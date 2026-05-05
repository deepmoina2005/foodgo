<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class AutoAssignService extends BaseApiService
{
    public function findAvailablePartners(object $restaurant): array
    {
        $query = DB::table('delivery_partners as delivery_partners')
            ->join('users as users', 'users.id', '=', 'delivery_partners.user_id')
            ->select(
                'delivery_partners.*',
                'users.name',
                'users.email',
                'users.account_status'
            )
            ->where('delivery_partners.status', 'approved')
            ->whereIn('users.account_status', ['active', 'approved'])
            ->where('delivery_partners.is_available', 1)
            ->whereNull('delivery_partners.current_order_id');

        if (! empty($restaurant->city)) {
            $query->where(function ($builder) use ($restaurant): void {
                $builder->where('delivery_partners.city', $restaurant->city);

                if (! empty($restaurant->area)) {
                    $builder->orWhere('delivery_partners.area', $restaurant->area);
                }
            });
        } elseif (! empty($restaurant->area)) {
            $query->where('delivery_partners.area', $restaurant->area);
        } else {
            return [];
        }

        $partners = $query->get();

        return $partners
            ->map(function (object $partner) use ($restaurant): object {
                $partner->distance = $this->calculateDistance(
                    $restaurant->latitude ?? null,
                    $restaurant->longitude ?? null,
                    $partner->latitude ?? null,
                    $partner->longitude ?? null
                );

                return $partner;
            })
            ->sort(function (object $left, object $right): int {
                if ($left->distance === null && $right->distance === null) {
                    return ($right->rating_average <=> $left->rating_average) ?: ($left->id <=> $right->id);
                }

                if ($left->distance === null) {
                    return 1;
                }

                if ($right->distance === null) {
                    return -1;
                }

                return ($left->distance <=> $right->distance)
                    ?: ($right->rating_average <=> $left->rating_average)
                    ?: ($left->id <=> $right->id);
            })
            ->values()
            ->all();
    }

    public function calculateDistance(?float $restaurantLat, ?float $restaurantLng, ?float $partnerLat, ?float $partnerLng): ?float
    {
        if ($restaurantLat === null || $restaurantLng === null || $partnerLat === null || $partnerLng === null) {
            return null;
        }

        return sqrt(
            pow($partnerLat - $restaurantLat, 2) +
            pow($partnerLng - $restaurantLng, 2)
        );
    }

    public function assignDelivery(int $orderId): array
    {
        return DB::transaction(function () use ($orderId): array {
            $order = DB::table('orders')->where('id', $orderId)->lockForUpdate()->first();
            if (! $order) {
                return ['assigned' => false, 'reason' => 'Order not found.'];
            }

            if ($order->status !== 'ready' || $order->order_status !== 'ready') {
                return ['assigned' => false, 'reason' => 'Order is not ready for automatic assignment.'];
            }

            if (! empty($order->delivery_partner_id)) {
                return [
                    'assigned' => true,
                    'already_assigned' => true,
                    'delivery_partner_id' => (int) $order->delivery_partner_id,
                ];
            }

            $restaurant = DB::table('restaurants')->where('id', $order->restaurant_id)->first();
            if (! $restaurant) {
                return ['assigned' => false, 'reason' => 'Restaurant not found.'];
            }

            $partners = $this->findAvailablePartners($restaurant);
            if (empty($partners)) {
                return ['assigned' => false, 'reason' => 'No delivery partner available.'];
            }

            foreach ($partners as $partner) {
                $lockedPartner = DB::table('delivery_partners')
                    ->join('users as users', 'users.id', '=', 'delivery_partners.user_id')
                    ->select('delivery_partners.*', 'users.account_status')
                    ->where('delivery_partners.id', $partner->id)
                    ->lockForUpdate()
                    ->first();

                if (! $lockedPartner) {
                    continue;
                }

                if ($lockedPartner->status !== 'approved' || ! in_array($lockedPartner->account_status ?? null, ['active', 'approved'], true)) {
                    continue;
                }

                if ((int) ($lockedPartner->is_available ?? 0) !== 1 || ! empty($lockedPartner->current_order_id)) {
                    continue;
                }

                $now = now();

                DB::table('delivery_assignments')->updateOrInsert(
                    ['order_id' => $orderId],
                    [
                        'delivery_partner_id' => $lockedPartner->id,
                        'assigned_by' => null,
                        'status' => 'assigned',
                        'assigned_at' => $now,
                        'accepted_at' => null,
                        'picked_up_at' => null,
                        'delivered_at' => null,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]
                );

                DB::table('orders')->where('id', $orderId)->update([
                    'status' => 'assigned',
                    'order_status' => 'assigned',
                    'delivery_partner_id' => $lockedPartner->id,
                    'assigned_at' => $now,
                    'updated_at' => $now,
                ]);

                DB::table('delivery_partners')->where('id', $lockedPartner->id)->update([
                    'is_available' => 0,
                    'current_order_id' => $orderId,
                    'updated_at' => $now,
                ]);

                $this->notifyUser(
                    (int) $lockedPartner->user_id,
                    'delivery_assigned',
                    'New delivery assigned',
                    "Order {$order->order_number} was assigned to you.",
                    [
                        'order_id' => $orderId,
                        'delivery_partner_id' => (int) $lockedPartner->id,
                        'distance' => $partner->distance,
                    ]
                );

                $this->notifyUser(
                    (int) $order->user_id,
                    'delivery_assigned',
                    'Delivery assigned',
                    "Delivery has been assigned for order {$order->order_number}.",
                    [
                        'order_id' => $orderId,
                        'delivery_partner_id' => (int) $lockedPartner->id,
                    ]
                );

                $this->refreshOrderTimeline($orderId);

                return [
                    'assigned' => true,
                    'delivery_partner_id' => (int) $lockedPartner->id,
                    'delivery_partner_name' => $lockedPartner->full_name,
                    'distance' => $partner->distance,
                ];
            }

            return ['assigned' => false, 'reason' => 'No delivery partner could be reserved.'];
        });
    }

    public function retryReadyOrders(): array
    {
        $orders = DB::table('orders')
            ->select('id')
            ->where('status', 'ready')
            ->whereNull('delivery_partner_id')
            ->orderBy('ready_at')
            ->orderBy('id')
            ->get();

        $checked = 0;
        $assigned = 0;

        foreach ($orders as $order) {
            $checked++;
            $result = $this->assignDelivery((int) $order->id);

            if (! empty($result['assigned'])) {
                $assigned++;
            }
        }

        return [
            'checked' => $checked,
            'assigned' => $assigned,
        ];
    }
}
