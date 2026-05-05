<?php

namespace App\Services;

use App\Http\Requests\Api\Delivery\KycRequest;
use App\Http\Requests\Api\Delivery\ProfileRequest;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DeliveryService extends BaseApiService
{
    public function profile()
    {
        return ApiResponse::success('Delivery profile loaded.', [
            'user' => DB::table('users')->where('id', $this->userId())->first(),
            'delivery_partner' => $this->deliveryRow(),
        ]);
    }

    public function profileUpdate(ProfileRequest $request)
    {
        $current = DB::table('users')->where('id', $this->userId())->first();
        $partner = $this->deliveryRow();
        $avatar = $request->file('avatar') ? $this->storeFile($request->file('avatar'), 'avatars') : $current?->avatar;

        DB::table('users')->where('id', $this->userId())->update([
            'name' => $request->validated('full_name'),
            'phone' => $request->validated('phone'),
            'avatar' => $avatar,
            'updated_at' => now(),
        ]);

        DB::table('delivery_partners')->where('user_id', $this->userId())->update([
            'full_name' => $request->validated('full_name'),
            'phone' => $request->validated('phone'),
            'vehicle_type' => $request->validated('vehicle_type'),
            'city' => $request->validated('city') ?? $partner->city,
            'area' => $request->validated('area') ?? $partner->area,
            'latitude' => $request->validated('latitude') ?? $partner->latitude,
            'longitude' => $request->validated('longitude') ?? $partner->longitude,
            'updated_at' => now(),
        ]);

        return ApiResponse::success('Delivery profile updated.');
    }

    public function availabilityUpdate(Request $request)
    {
        $request->validate([
            'is_available' => ['required', 'boolean'],
        ]);

        $partner = $this->deliveryRow();
        $isAvailable = $request->boolean('is_available');

        abort_if($partner->current_order_id && $isAvailable, 422, 'You cannot go online while an order is active.');

        DB::table('delivery_partners')->where('id', $partner->id)->update([
            'is_available' => $isAvailable ? 1 : 0,
            'updated_at' => now(),
        ]);

        return ApiResponse::success($isAvailable ? 'You are now online.' : 'You are now offline.');
    }

    public function availableRequestsIndex()
    {
        $payload = app(DeliveryRequestService::class)->getAvailableRequestsForDeliveryPartner($this->userId());

        return ApiResponse::success('Available pickup requests loaded.', $payload);
    }

    public function availableRequestsShow(int $id)
    {
        $payload = app(DeliveryRequestService::class)->getAvailableRequestDetailsForDeliveryPartner($this->userId(), $id);

        return ApiResponse::success('Pickup request loaded.', $payload);
    }

    public function availableRequestsAccept(int $id)
    {
        $result = app(DeliveryRequestService::class)->acceptRequest($this->userId(), $id);

        return ApiResponse::success('Pickup request accepted.', $result);
    }

    public function kycStore(KycRequest $request)
    {
        $partner = $this->deliveryRow();
        DB::table('delivery_partners')->where('id', $partner->id)->update([
            'kyc_document' => $this->storeFile($request->file('kyc_document'), 'delivery-kyc'),
            'kyc_status' => $request->input('kyc_status', 'pending'),
            'updated_at' => now(),
        ]);

        $this->notifyUsersByRole('admin', 'delivery_kyc_uploaded', 'Delivery KYC uploaded', 'A delivery partner has uploaded KYC documents for review.', [
            'delivery_partner_id' => $partner->id,
        ]);

        return ApiResponse::success('KYC uploaded.');
    }

    public function ordersIndex()
    {
        return ApiResponse::success('Assigned orders loaded.', [
            'orders' => $this->assignedOrdersQuery()
                ->whereIn('orders.status', ['assigned', 'accepted', 'preparing', 'ready', 'picked_up', 'out_for_delivery'])
                ->orderByDesc('orders.id')
                ->get(),
        ]);
    }

    public function ordersShow(int $id)
    {
        $order = $this->ownedAssignment($id);

        return ApiResponse::success('Delivery order loaded.', [
            'order' => $order,
            'items' => DB::table('order_items')->where('order_id', $id)->get(),
            'assignment' => $this->assignmentPayload($id),
            'timeline' => $this->orderTimeline($order),
        ]);
    }

    public function ordersAccept(int $id)
    {
        $result = app(DeliveryRequestService::class)->acceptRequestForOrder($this->userId(), $id);

        return ApiResponse::success('Pickup request accepted.', $result);
    }

    public function ordersPickup(int $id)
    {
        $assignment = $this->assignmentForOrder($id);
        abort_if($assignment->status !== 'accepted', 422, 'Order must be accepted before pickup.');
        $order = DB::table('orders')->where('id', $id)->first();
        abort_if(! $order || ! in_array($order->status, ['assigned', 'ready'], true), 422, 'Waiting for restaurant to mark food ready.');

        DB::table('orders')->where('id', $id)->update([
            'status' => 'picked_up',
            'order_status' => 'picked_up',
            'picked_up_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('delivery_assignments')->where('id', $assignment->id)->update([
            'status' => 'picked_up',
            'picked_up_at' => now(),
            'updated_at' => now(),
        ]);

        if ($order) {
            $this->notifyUser((int) $order->user_id, 'picked_up', 'Order picked up', "Your order {$order->order_number} has been picked up.", ['order_id' => $id]);
            $vendorId = DB::table('restaurants')->where('id', $order->restaurant_id)->value('vendor_id');
            if ($vendorId) {
                $vendorUserId = DB::table('vendors')->where('id', $vendorId)->value('user_id');
                if ($vendorUserId) {
                    $this->notifyUser((int) $vendorUserId, 'picked_up', 'Order picked up', "Order {$order->order_number} has been picked up by the delivery partner.", ['order_id' => $id]);
                }
            }
        }

        $this->refreshOrderTimeline($id);

        return ApiResponse::success('Pickup confirmed.');
    }

    public function ordersStatus(Request $request, int $id)
    {
        $request->validate(['status' => ['required', 'in:out_for_delivery']]);
        $assignment = $this->assignmentForOrder($id);
        abort_if(! in_array($assignment->status, ['accepted', 'picked_up'], true), 422, 'Order must be accepted before it can be dispatched.');
        $order = DB::table('orders')->where('id', $id)->first();
        abort_if(! $order || $order->status !== 'picked_up', 422, 'Invalid delivery status.');

        DB::table('orders')->where('id', $id)->update([
            'status' => 'out_for_delivery',
            'order_status' => 'out_for_delivery',
            'out_for_delivery_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('delivery_assignments')->where('id', $assignment->id)->update([
            'status' => 'out_for_delivery',
            'updated_at' => now(),
        ]);

        if ($order) {
            $this->notifyUser((int) $order->user_id, 'out_for_delivery', 'Out for delivery', "Your order {$order->order_number} is out for delivery.", ['order_id' => $id]);
            $vendorId = DB::table('restaurants')->where('id', $order->restaurant_id)->value('vendor_id');
            if ($vendorId) {
                $vendorUserId = DB::table('vendors')->where('id', $vendorId)->value('user_id');
                if ($vendorUserId) {
                    $this->notifyUser((int) $vendorUserId, 'out_for_delivery', 'Order out for delivery', "Order {$order->order_number} is now out for delivery.", ['order_id' => $id]);
                }
            }
        }

        $this->refreshOrderTimeline($id);

        return ApiResponse::success('Delivery status updated.');
    }

    public function ordersDelivered(int $id)
    {
        $assignment = $this->assignmentForOrder($id);
        $order = DB::table('orders')->where('id', $id)->first();
        abort_if(! $order || $order->status !== 'out_for_delivery', 422, 'Invalid delivery state.');
        abort_if($assignment->status !== 'accepted' && $assignment->status !== 'out_for_delivery', 422, 'Invalid delivery assignment state.');

        DB::table('orders')->where('id', $id)->update([
            'status' => 'delivered',
            'order_status' => 'delivered',
            'payment_status' => 'paid',
            'delivered_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('payments')->where('order_id', $id)->update([
            'payment_status' => 'paid',
            'status' => 'paid',
            'paid_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('delivery_assignments')->where('id', $assignment->id)->update([
            'status' => 'delivered',
            'delivered_at' => now(),
            'updated_at' => now(),
        ]);

        $partner = $this->deliveryRow();
        DB::table('delivery_partners')->where('id', $partner->id)->increment('earnings_balance', (float) $order->delivery_fee);
        DB::table('delivery_partners')->where('id', $partner->id)->update([
            'is_available' => 1,
            'current_order_id' => null,
            'updated_at' => now(),
        ]);

        $vendorId = DB::table('restaurants')->where('id', $order->restaurant_id)->value('vendor_id');
        if ($vendorId) {
            DB::table('vendor_payouts')->insert([
                'vendor_id' => $vendorId,
                'order_id' => $id,
                'amount' => max(0, (float) $order->total_amount - (float) $order->commission_amount),
                'commission_amount' => (float) $order->commission_amount,
                'payout_status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $customerId = (int) $order->user_id;
        $this->notifyUser($customerId, 'delivered', 'Order delivered', "Your order {$order->order_number} has been delivered.", ['order_id' => $id]);

        $vendorId = DB::table('restaurants')->where('id', $order->restaurant_id)->value('vendor_id');
        if ($vendorId) {
            $vendorUserId = DB::table('vendors')->where('id', $vendorId)->value('user_id');
            if ($vendorUserId) {
                $this->notifyUser((int) $vendorUserId, 'delivered', 'Order delivered', "Order {$order->order_number} has been delivered to the customer.", ['order_id' => $id]);
            }
        }

        $this->refreshOrderTimeline($id);

        return ApiResponse::success('Order marked as delivered.');
    }

    public function historyIndex()
    {
        return ApiResponse::success('Delivery history loaded.', [
            'history' => $this->assignedOrdersQuery()->where('orders.status', 'delivered')->orderByDesc('orders.delivered_at')->get(),
        ]);
    }

    public function earningsIndex()
    {
        $partner = $this->deliveryRow();
        return ApiResponse::success('Earnings loaded.', [
            'partner' => $partner,
            'earnings' => DB::table('orders')
                ->join('delivery_assignments', 'delivery_assignments.order_id', '=', 'orders.id')
                ->where('delivery_assignments.delivery_partner_id', $partner->id)
                ->where('orders.status', 'delivered')
                ->sum('orders.delivery_fee'),
        ]);
    }

    public function ratingsIndex()
    {
        $partner = $this->deliveryRow();
        return ApiResponse::success('Ratings loaded.', [
            'ratings' => DB::table('reviews')->where('delivery_partner_id', $partner->id)->orderByDesc('id')->get(),
        ]);
    }

    private function deliveryRow(): object
    {
        $row = DB::table('delivery_partners')->where('user_id', $this->userId())->first();
        abort_if(! $row, 404, 'Delivery partner not found.');
        return $row;
    }

    private function assignedOrdersQuery()
    {
        $partner = $this->deliveryRow();

        return DB::table('orders')
            ->join('delivery_assignments', 'delivery_assignments.order_id', '=', 'orders.id')
            ->join('restaurants', 'restaurants.id', '=', 'orders.restaurant_id')
            ->join('users as customers', 'customers.id', '=', 'orders.user_id')
            ->select('orders.*', 'delivery_assignments.status as assignment_status', 'restaurants.name as restaurant_name', 'customers.name as customer_name')
            ->where('delivery_assignments.delivery_partner_id', $partner->id);
    }

    private function assignmentForOrder(int $orderId): object
    {
        $partner = $this->deliveryRow();
        $assignment = DB::table('delivery_assignments')->where('order_id', $orderId)->where('delivery_partner_id', $partner->id)->first();
        abort_if(! $assignment, 404, 'Assignment not found.');
        return $assignment;
    }

    private function ownedAssignment(int $orderId): object
    {
        $order = $this->assignedOrdersQuery()->where('orders.id', $orderId)->first();
        abort_if(! $order, 404, 'Order not found.');
        return $order;
    }

    private function assignmentPayload(int $orderId): ?object
    {
        return DB::table('delivery_assignments')
            ->join('delivery_partners', 'delivery_partners.id', '=', 'delivery_assignments.delivery_partner_id')
            ->leftJoin('users', 'users.id', '=', 'delivery_partners.user_id')
            ->select(
                'delivery_assignments.*',
                'delivery_partners.full_name as delivery_partner_name',
                'delivery_partners.phone as delivery_partner_phone',
                'delivery_partners.vehicle_type',
                'delivery_partners.rating_average',
                'users.email as delivery_partner_email'
            )
            ->where('delivery_assignments.order_id', $orderId)
            ->first();
    }

    private function orderTimeline(object $order): array
    {
        if (! empty($order->status_timeline)) {
            $decoded = json_decode((string) $order->status_timeline, true);
            if (is_array($decoded)) {
                return $this->normalizeOrderTimeline($order, $decoded);
            }
        }

        return $this->normalizeOrderTimeline($order, [
            ['status' => 'placed', 'at' => $order->placed_at ?? null],
            ['status' => 'accepted', 'at' => $order->accepted_at ?? null],
            ['status' => 'preparing', 'at' => $order->prepared_at ?? null],
            ['status' => 'ready', 'at' => $order->ready_at ?? null],
            ['status' => 'assigned', 'at' => $order->assigned_at ?? null],
            ['status' => 'picked_up', 'at' => $order->picked_up_at ?? null],
            ['status' => 'out_for_delivery', 'at' => $order->out_for_delivery_at ?? null],
            ['status' => 'delivered', 'at' => $order->delivered_at ?? null],
            ['status' => 'cancelled', 'at' => $order->cancelled_at ?? null],
        ]);
    }
}
