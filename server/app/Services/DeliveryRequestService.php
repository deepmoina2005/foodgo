<?php

namespace App\Services;

use App\Support\ApiResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DeliveryRequestService extends BaseApiService
{
    public function createRequestForOrder(int $orderId): array
    {
        return DB::transaction(function () use ($orderId): array {
            $order = DB::table('orders')
                ->join('restaurants', 'restaurants.id', '=', 'orders.restaurant_id')
                ->select('orders.*', 'restaurants.name as restaurant_name', 'restaurants.city as restaurant_city', 'restaurants.area as restaurant_area', 'restaurants.latitude as restaurant_latitude', 'restaurants.longitude as restaurant_longitude')
                ->where('orders.id', $orderId)
                ->lockForUpdate()
                ->first();

            if (! $order) {
                return ['created' => false, 'reason' => 'Order not found.'];
            }

            if ($order->status !== 'ready') {
                return ['created' => false, 'reason' => 'Order is not ready for delivery request creation.'];
            }

            $existing = DB::table('delivery_requests')->where('order_id', $orderId)->lockForUpdate()->first();
            if ($existing && in_array($existing->status, ['open', 'accepted'], true)) {
                return ['created' => true, 'request_id' => (int) $existing->id, 'status' => $existing->status, 'already_exists' => true];
            }

            $now = now();
            $payload = [
                'order_id' => $orderId,
                'restaurant_id' => $order->restaurant_id,
                'city' => $order->restaurant_city ?? null,
                'area' => $order->restaurant_area ?? null,
                'status' => 'open',
                'accepted_by_delivery_partner_id' => null,
                'accepted_at' => null,
                'expires_at' => $now->copy()->addHours(12),
                'updated_at' => $now,
                'created_at' => $now,
            ];

            if ($existing) {
                DB::table('delivery_requests')->where('id', $existing->id)->update($payload);
                $requestId = (int) $existing->id;
            } else {
                $requestId = (int) DB::table('delivery_requests')->insertGetId($payload);
            }

            $partners = $this->eligiblePartnersForRestaurant($order->restaurant_city, $order->restaurant_area)->get();
            foreach ($partners as $partner) {
                $this->notifyUser(
                    (int) $partner->user_id,
                    'delivery_request_created',
                    'New Pickup Available',
                    "New order pickup request from {$order->restaurant_name}.",
                    [
                        'request_id' => $requestId,
                        'order_id' => $orderId,
                        'restaurant_id' => (int) $order->restaurant_id,
                    ]
                );
            }

            return [
                'created' => true,
                'request_id' => $requestId,
                'notified' => $partners->count(),
            ];
        });
    }

    public function getAvailableRequestsForDeliveryPartner(int $deliveryPartnerUserId): array
    {
        $partner = $this->deliveryPartnerRow($deliveryPartnerUserId);
        $isAvailable = (int) ($partner->is_available ?? 0) === 1 && empty($partner->current_order_id);

        if (! $isAvailable) {
            return [
                'delivery_partner' => $partner,
                'requests' => collect([]),
                'count' => 0,
            ];
        }

        $requests = DB::table('delivery_requests as requests')
            ->join('orders', 'orders.id', '=', 'requests.order_id')
            ->join('restaurants', 'restaurants.id', '=', 'requests.restaurant_id')
            ->join('users as customers', 'customers.id', '=', 'orders.user_id')
            ->leftJoin('addresses', 'addresses.id', '=', 'orders.address_id')
            ->select(
                'requests.id as request_id',
                'requests.order_id',
                'requests.restaurant_id',
                'requests.city as request_city',
                'requests.area as request_area',
                'requests.status as request_status',
                'requests.accepted_by_delivery_partner_id',
                'requests.accepted_at',
                'requests.expires_at',
                'orders.order_number',
                'orders.status as order_status',
                'orders.payment_status',
                'orders.total_amount',
                'orders.ready_at',
                'orders.prepared_at',
                'orders.estimated_delivery_time',
                'restaurants.name as restaurant_name',
                'restaurants.address_line as pickup_address',
                'restaurants.city as restaurant_city',
                'restaurants.area as restaurant_area',
                'restaurants.latitude as restaurant_latitude',
                'restaurants.longitude as restaurant_longitude',
                'customers.name as customer_name',
                'addresses.city as customer_city',
                'addresses.area as customer_area',
                'addresses.line1 as customer_address_line',
                'addresses.landmark as customer_landmark'
            )
            ->where('requests.status', 'open')
            ->where(function ($builder): void {
                $builder->whereNull('requests.expires_at')->orWhere('requests.expires_at', '>', now());
            })
            ->orderByDesc('requests.id')
            ->get()
            ->map(function (object $request) use ($partner): object {
                $request->distance = $this->calculateDistance(
                    $partner->latitude ? (float) $partner->latitude : null,
                    $partner->longitude ? (float) $partner->longitude : null,
                    $request->restaurant_latitude ? (float) $request->restaurant_latitude : null,
                    $request->restaurant_longitude ? (float) $request->restaurant_longitude : null
                );
                $request->estimated_pickup_ready_at = $request->ready_at ?? $request->prepared_at ?? $request->accepted_at ?? null;

                return $request;
            })
            ->sort(function (object $left, object $right): int {
                if ($left->distance === null && $right->distance === null) {
                    return $right->request_id <=> $left->request_id;
                }

                if ($left->distance === null) {
                    return 1;
                }

                if ($right->distance === null) {
                    return -1;
                }

                return $left->distance <=> $right->distance;
            })
            ->values();

        return [
            'delivery_partner' => $partner,
            'requests' => $requests,
            'count' => $requests->count(),
        ];
    }

    public function getAvailableRequestDetailsForDeliveryPartner(int $deliveryPartnerUserId, int $requestId): array
    {
        $available = $this->getAvailableRequestsForDeliveryPartner($deliveryPartnerUserId);
        $request = collect($available['requests'])->firstWhere('request_id', $requestId);
        abort_if(! $request, 404, 'Pickup request not found.');

        return [
            'delivery_partner' => $available['delivery_partner'],
            'request' => $request,
        ];
    }

    public function acceptRequest(int $deliveryPartnerUserId, int $requestId): array
    {
        return DB::transaction(function () use ($deliveryPartnerUserId, $requestId): array {
            $partner = DB::table('delivery_partners')
                ->join('users', 'users.id', '=', 'delivery_partners.user_id')
                ->select('delivery_partners.*', 'users.account_status')
                ->where('delivery_partners.user_id', $deliveryPartnerUserId)
                ->lockForUpdate()
                ->first();

            abort_if(! $partner, 404, 'Delivery partner not found.');
            abort_if($partner->status !== 'approved' || ! in_array($partner->account_status ?? null, ['active', 'approved'], true), 403, 'Delivery partner account is not approved.');
            abort_if((int) ($partner->is_available ?? 0) !== 1 || ! empty($partner->current_order_id), 422, 'You can accept only one active order at a time.');

            $request = DB::table('delivery_requests')->where('id', $requestId)->lockForUpdate()->first();
            abort_if(! $request, 404, 'Pickup request not found.');

            if ($request->status !== 'open') {
                abort(409, 'This delivery request has already been accepted by another partner.');
            }

            if ($request->expires_at && now()->greaterThan(Carbon::parse($request->expires_at))) {
                DB::table('delivery_requests')->where('id', $requestId)->update([
                    'status' => 'expired',
                    'updated_at' => now(),
                ]);

                abort(409, 'This delivery request has already been accepted by another partner.');
            }

            $order = DB::table('orders')
                ->join('restaurants', 'restaurants.id', '=', 'orders.restaurant_id')
                ->select('orders.*', 'restaurants.name as restaurant_name', 'restaurants.city as restaurant_city', 'restaurants.area as restaurant_area')
                ->where('orders.id', $request->order_id)
                ->lockForUpdate()
                ->first();
            abort_if(! $order, 404, 'Order not found.');

            if (! is_null($order->delivery_partner_id) || in_array($order->status, ['delivered', 'cancelled', 'refunded'], true)) {
                abort(409, 'This delivery request has already been accepted by another partner.');
            }

            $now = now();
            DB::table('delivery_requests')->where('id', $requestId)->update([
                'status' => 'accepted',
                'accepted_by_delivery_partner_id' => $partner->id,
                'accepted_at' => $now,
                'updated_at' => $now,
            ]);

            DB::table('delivery_assignments')->updateOrInsert(
                ['order_id' => $order->id],
                [
                    'delivery_partner_id' => $partner->id,
                    'assigned_by' => null,
                    'status' => 'accepted',
                    'assigned_at' => $now,
                    'accepted_at' => $now,
                    'picked_up_at' => null,
                    'delivered_at' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );

            DB::table('orders')->where('id', $order->id)->update([
                'delivery_partner_id' => $partner->id,
                'status' => 'assigned',
                'order_status' => 'assigned',
                'assigned_at' => $now,
                'updated_at' => $now,
            ]);

            DB::table('delivery_partners')->where('id', $partner->id)->update([
                'is_available' => 0,
                'current_order_id' => $order->id,
                'updated_at' => $now,
            ]);

            $customerId = (int) $order->user_id;
            $vendorUserId = DB::table('vendors')->where('id', $order->vendor_id)->value('user_id');

            $this->notifyUser($customerId, 'delivery_partner_assigned', 'Delivery partner assigned', "Your order {$order->order_number} has been assigned to a delivery partner.", [
                'order_id' => $order->id,
                'request_id' => $requestId,
                'delivery_partner_id' => $partner->id,
            ]);

            if ($vendorUserId) {
                $this->notifyUser((int) $vendorUserId, 'delivery_partner_assigned', 'Delivery partner accepted pickup', "A delivery partner accepted pickup for order {$order->order_number}.", [
                    'order_id' => $order->id,
                    'request_id' => $requestId,
                    'delivery_partner_id' => $partner->id,
                ]);
            }

            return [
                'request_id' => $requestId,
                'order_id' => $order->id,
                'delivery_partner_id' => $partner->id,
                'delivery_partner_name' => $partner->full_name,
                'order_number' => $order->order_number,
            ];
        });
    }

    public function acceptRequestForOrder(int $deliveryPartnerUserId, int $orderId): array
    {
        $request = DB::table('delivery_requests')->where('order_id', $orderId)->first();
        abort_if(! $request, 404, 'Pickup request not found.');

        return $this->acceptRequest($deliveryPartnerUserId, (int) $request->id);
    }

    public function cancelRequestForOrder(int $orderId): void
    {
        $request = DB::table('delivery_requests')->where('order_id', $orderId)->first();
        if (! $request) {
            return;
        }

        DB::table('delivery_requests')->where('order_id', $orderId)->update([
            'status' => 'cancelled',
            'accepted_by_delivery_partner_id' => null,
            'accepted_at' => null,
            'updated_at' => now(),
        ]);

        $order = DB::table('orders')->where('id', $orderId)->first();
        if ($order?->delivery_partner_id) {
            DB::table('delivery_assignments')->where('order_id', $orderId)->update([
                'status' => 'cancelled',
                'updated_at' => now(),
            ]);

            DB::table('delivery_partners')
                ->where('id', $order->delivery_partner_id)
                ->where('current_order_id', $orderId)
                ->update([
                    'is_available' => 1,
                    'current_order_id' => null,
                    'updated_at' => now(),
                ]);
        }
    }

    public function expireOpenRequests(): int
    {
        return DB::table('delivery_requests')
            ->where('status', 'open')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->update([
                'status' => 'expired',
                'updated_at' => now(),
            ]);
    }

    public function calculateDistance(?float $restaurantLat, ?float $restaurantLng, ?float $partnerLat, ?float $partnerLng): ?float
    {
        if ($restaurantLat === null || $restaurantLng === null || $partnerLat === null || $partnerLng === null) {
            return null;
        }

        return sqrt(pow($partnerLat - $restaurantLat, 2) + pow($partnerLng - $restaurantLng, 2));
    }

    private function eligiblePartnersForRestaurant(?string $city, ?string $area)
    {
        return DB::table('delivery_partners')
            ->join('users', 'users.id', '=', 'delivery_partners.user_id')
            ->select('delivery_partners.*', 'users.name', 'users.email', 'users.account_status')
            ->where('delivery_partners.status', 'approved')
            ->whereIn('users.account_status', ['active', 'approved'])
            ->where('delivery_partners.is_available', 1)
            ->whereNull('delivery_partners.current_order_id');
    }

    private function deliveryPartnerRow(int $deliveryPartnerUserId): object
    {
        $partner = DB::table('delivery_partners')
            ->join('users', 'users.id', '=', 'delivery_partners.user_id')
            ->select('delivery_partners.*', 'users.account_status')
            ->where('delivery_partners.user_id', $deliveryPartnerUserId)
            ->first();

        abort_if(! $partner, 404, 'Delivery partner not found.');

        return $partner;
    }
}
