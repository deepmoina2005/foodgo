<?php

namespace App\Services;

use App\Http\Requests\Api\Admin\BannerRequest;
use App\Http\Requests\Api\Admin\CategoryRequest;
use App\Http\Requests\Api\Admin\ComplaintReplyRequest;
use App\Http\Requests\Api\Admin\CouponRequest;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdminService extends BaseApiService
{
    public function dashboard()
    {
        $orders = DB::table('orders');

        return ApiResponse::success('Dashboard loaded.', [
            'stats' => [
                'customers' => DB::table('users')->where('role', 'customer')->count(),
                'vendors' => DB::table('users')->where('role', 'vendor')->count(),
                'delivery_partners' => DB::table('users')->where('role', 'delivery_partner')->count(),
                'orders' => $orders->count(),
                'revenue' => (float) DB::table('orders')->where('payment_status', 'paid')->sum('total_amount'),
                'pending_vendors' => DB::table('vendors')->where('status', 'pending')->count(),
                'pending_delivery' => DB::table('delivery_partners')->where('status', 'pending')->count(),
                'complaints' => DB::table('complaints')->where('status', 'pending')->count(),
            ],
        ]);
    }

    public function customersIndex(Request $request)
    {
        $query = DB::table('users')->where('role', 'customer')->orderByDesc('id');
        return ApiResponse::paginated('Customers loaded.', $this->paginate($query, $request), 'customers');
    }

    public function customersShow(int $id)
    {
        return ApiResponse::success('Customer loaded.', [
            'customer' => $this->customerPayload($id),
        ]);
    }

    public function customersBlock(int $id)
    {
        $customer = $this->customerPayload($id);
        abort_if(! $customer, 404, 'Customer not found.');
        $this->changeUserStatus($id, 'blocked');
        $this->notifyUser((int) $customer->id, 'account_blocked', 'Account blocked', 'Your customer account has been blocked by the administrator.', [
            'customer_id' => $id,
        ]);
        return ApiResponse::success('Customer blocked.');
    }

    public function customersUnblock(int $id)
    {
        $customer = $this->customerPayload($id);
        abort_if(! $customer, 404, 'Customer not found.');
        $this->changeUserStatus($id, 'active');
        $this->notifyUser((int) $customer->id, 'account_unblocked', 'Account unblocked', 'Your customer account has been restored.', [
            'customer_id' => $id,
        ]);
        return ApiResponse::success('Customer unblocked.');
    }

    public function customersOrders(int $id)
    {
        return ApiResponse::success('Customer orders loaded.', [
            'orders' => DB::table('orders')->where('user_id', $id)->orderByDesc('id')->get(),
        ]);
    }

    public function vendorsIndex(Request $request)
    {
        $query = DB::table('vendors')
            ->join('users', 'users.id', '=', 'vendors.user_id')
            ->select('vendors.*', 'users.name', 'users.email', 'users.account_status')
            ->orderByDesc('vendors.id');

        return ApiResponse::paginated('Vendors loaded.', $this->paginate($query, $request), 'vendors');
    }

    public function vendorsPending(Request $request)
    {
        $query = DB::table('vendors')
            ->join('users', 'users.id', '=', 'vendors.user_id')
            ->select('vendors.*', 'users.name', 'users.email', 'users.account_status')
            ->where('vendors.status', 'pending')
            ->orderByDesc('vendors.id');

        return ApiResponse::paginated('Pending vendors loaded.', $this->paginate($query, $request), 'vendors');
    }

    public function vendorsShow(int $id)
    {
        return ApiResponse::success('Vendor loaded.', [
            'vendor' => $this->vendorPayload($id),
        ]);
    }

    public function vendorsApprove(int $id)
    {
        $vendor = $this->vendorRow($id);
        DB::table('vendors')->where('id', $id)->update(['status' => 'approved', 'updated_at' => now()]);
        $this->changeUserStatus($vendor->user_id, 'approved');
        $this->notifyUser((int) $vendor->user_id, 'vendor_approved', 'Vendor approved', 'Your vendor account has been approved.', [
            'vendor_id' => $id,
        ]);
        return ApiResponse::success('Vendor approved.');
    }

    public function vendorsReject(int $id)
    {
        $vendor = $this->vendorRow($id);
        DB::table('vendors')->where('id', $id)->update(['status' => 'rejected', 'updated_at' => now()]);
        $this->changeUserStatus($vendor->user_id, 'rejected');
        $this->notifyUser((int) $vendor->user_id, 'vendor_rejected', 'Vendor rejected', 'Your vendor application has been rejected.', [
            'vendor_id' => $id,
        ]);
        return ApiResponse::success('Vendor rejected.');
    }

    public function vendorsSuspend(int $id)
    {
        $vendor = $this->vendorRow($id);
        DB::table('vendors')->where('id', $id)->update(['status' => 'suspended', 'updated_at' => now()]);
        $this->changeUserStatus($vendor->user_id, 'suspended');
        $this->notifyUser((int) $vendor->user_id, 'vendor_suspended', 'Vendor suspended', 'Your vendor account has been suspended.', [
            'vendor_id' => $id,
        ]);
        return ApiResponse::success('Vendor suspended.');
    }

    public function vendorsCommission(Request $request, int $id)
    {
        $request->validate(['commission_percentage' => ['required', 'numeric', 'min:0', 'max:100']]);
        DB::table('vendors')->where('id', $id)->update([
            'commission_percentage' => $request->float('commission_percentage'),
            'updated_at' => now(),
        ]);
        return ApiResponse::success('Vendor commission updated.');
    }

    public function vendorsVerifyDocuments(int $id)
    {
        $vendor = $this->vendorRow($id);
        DB::table('vendors')->where('id', $id)->update(['documents_verified' => true, 'updated_at' => now()]);
        $this->notifyUser((int) $vendor->user_id, 'documents_verified', 'Documents verified', 'Your vendor documents have been verified.', [
            'vendor_id' => $id,
        ]);
        return ApiResponse::success('Vendor documents verified.');
    }

    public function vendorsDestroy(int $id)
    {
        $vendor = DB::table('vendors')->where('id', $id)->first();
        abort_if(! $vendor, 404, 'Vendor not found.');
        DB::table('users')->where('id', $vendor->user_id)->delete();
        return ApiResponse::success('Vendor deleted successfully.');
    }

    public function restaurantsIndex(Request $request)
    {
        $query = DB::table('restaurants')->join('vendors', 'vendors.id', '=', 'restaurants.vendor_id')->select('restaurants.*', 'vendors.status as vendor_status')->orderByDesc('restaurants.id');
        return ApiResponse::paginated('Restaurants loaded.', $this->paginate($query, $request), 'restaurants');
    }

    public function restaurantsShow(int $id)
    {
        return ApiResponse::success('Restaurant loaded.', [
            'restaurant' => DB::table('restaurants')->where('id', $id)->first(),
        ]);
    }

    public function restaurantsSuspend(int $id)
    {
        $restaurant = DB::table('restaurants')->where('id', $id)->first();
        abort_if(! $restaurant, 404, 'Restaurant not found.');
        DB::table('restaurants')->where('id', $id)->update(['status' => 'suspended', 'updated_at' => now()]);
        $vendorUserId = DB::table('vendors')->where('id', $restaurant->vendor_id)->value('user_id');
        if ($vendorUserId) {
            $this->notifyUser((int) $vendorUserId, 'restaurant_suspended', 'Restaurant suspended', 'Your restaurant has been suspended by admin.', [
                'restaurant_id' => $id,
            ]);
        }
        return ApiResponse::success('Restaurant suspended.');
    }

    public function restaurantsActivate(int $id)
    {
        $restaurant = DB::table('restaurants')->where('id', $id)->first();
        abort_if(! $restaurant, 404, 'Restaurant not found.');
        DB::table('restaurants')->where('id', $id)->update(['status' => 'active', 'updated_at' => now()]);
        $vendorUserId = DB::table('vendors')->where('id', $restaurant->vendor_id)->value('user_id');
        if ($vendorUserId) {
            $this->notifyUser((int) $vendorUserId, 'restaurant_activated', 'Restaurant activated', 'Your restaurant has been activated by admin.', [
                'restaurant_id' => $id,
            ]);
        }
        return ApiResponse::success('Restaurant activated.');
    }

    public function restaurantsUpdate(Request $request, int $id)
    {
        $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'cuisine' => ['nullable', 'string', 'max:255'],
            'area' => ['nullable', 'string', 'max:255'],
            'address_line' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:active,suspended'],
        ]);

        $payload = array_filter([
            'name' => $request->input('name'),
            'slug' => $request->filled('name') ? $this->uniqueSlug('restaurants', 'slug', $request->string('name')->toString(), $id) : null,
            'description' => $request->input('description'),
            'cuisine' => $request->input('cuisine'),
            'area' => $request->input('area'),
            'address_line' => $request->input('address_line'),
            'status' => $request->input('status'),
            'updated_at' => now(),
        ], fn ($value) => ! is_null($value));

        DB::table('restaurants')->where('id', $id)->update($payload);

        if (! empty($payload)) {
            $restaurant = DB::table('restaurants')->where('id', $id)->first();
            $vendorUserId = $restaurant ? DB::table('vendors')->where('id', $restaurant->vendor_id)->value('user_id') : null;
            if ($vendorUserId) {
                $this->notifyUser((int) $vendorUserId, 'restaurant_updated', 'Restaurant updated', 'Your restaurant details were updated by admin.', [
                    'restaurant_id' => $id,
                ]);
            }
        }

        return ApiResponse::success('Restaurant updated.');
    }

    public function restaurantsDestroy(int $id)
    {
        $restaurant = DB::table('restaurants')->where('id', $id)->first();
        abort_if(! $restaurant, 404, 'Restaurant not found.');
        DB::table('restaurants')->where('id', $id)->delete();
        return ApiResponse::success('Restaurant deleted successfully.');
    }

    public function deliveryPartnersIndex(Request $request)
    {
        $query = DB::table('delivery_partners')->join('users', 'users.id', '=', 'delivery_partners.user_id')->select('delivery_partners.*', 'users.name', 'users.email', 'users.account_status')->orderByDesc('delivery_partners.id');
        return ApiResponse::paginated('Delivery partners loaded.', $this->paginate($query, $request), 'delivery_partners');
    }

    public function deliveryPartnersPending(Request $request)
    {
        $query = DB::table('delivery_partners')->join('users', 'users.id', '=', 'delivery_partners.user_id')->select('delivery_partners.*', 'users.name', 'users.email', 'users.account_status')->where('delivery_partners.status', 'pending')->orderByDesc('delivery_partners.id');
        return ApiResponse::paginated('Pending delivery partners loaded.', $this->paginate($query, $request), 'delivery_partners');
    }

    public function deliveryPartnersShow(int $id)
    {
        return ApiResponse::success('Delivery partner loaded.', [
            'delivery_partner' => $this->deliveryPayload($id),
        ]);
    }

    public function deliveryPartnersApprove(int $id)
    {
        $partner = $this->deliveryRow($id);
        DB::table('delivery_partners')->where('id', $id)->update([
            'status' => 'approved',
            'is_available' => 1,
            'current_order_id' => null,
            'updated_at' => now(),
        ]);
        $this->changeUserStatus($partner->user_id, 'active');
        $this->notifyUser((int) $partner->user_id, 'delivery_partner_approved', 'Delivery partner approved', 'Your delivery partner account has been approved.', [
            'delivery_partner_id' => $id,
        ]);
        return ApiResponse::success('Delivery partner approved.');
    }

    public function deliveryPartnersReject(int $id)
    {
        $partner = $this->deliveryRow($id);
        DB::table('delivery_partners')->where('id', $id)->update([
            'status' => 'rejected',
            'is_available' => 0,
            'current_order_id' => null,
            'updated_at' => now(),
        ]);
        $this->changeUserStatus($partner->user_id, 'rejected');
        $this->notifyUser((int) $partner->user_id, 'delivery_partner_rejected', 'Delivery partner rejected', 'Your delivery partner application has been rejected.', [
            'delivery_partner_id' => $id,
        ]);
        return ApiResponse::success('Delivery partner rejected.');
    }

    public function deliveryPartnersSuspend(int $id)
    {
        $partner = $this->deliveryRow($id);
        DB::table('delivery_partners')->where('id', $id)->update([
            'status' => 'suspended',
            'is_available' => 0,
            'current_order_id' => null,
            'updated_at' => now(),
        ]);
        $this->changeUserStatus($partner->user_id, 'suspended');
        $this->notifyUser((int) $partner->user_id, 'delivery_partner_suspended', 'Delivery partner suspended', 'Your delivery partner account has been suspended.', [
            'delivery_partner_id' => $id,
        ]);
        return ApiResponse::success('Delivery partner suspended.');
    }

    public function categoriesIndex()
    {
        return ApiResponse::success('Categories loaded.', ['categories' => DB::table('categories')->orderBy('name')->get()]);
    }

    public function categoriesStore(CategoryRequest $request)
    {
        $data = $request->validated();
        DB::table('categories')->insert([
            'name' => $data['name'],
            'slug' => $this->uniqueSlug('categories', 'slug', $data['name']),
            'image' => $this->storeFile($request->file('image'), 'categories'),
            'is_active' => (bool) ($data['is_active'] ?? true),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return ApiResponse::success('Category created.', [], 201);
    }

    public function categoriesUpdate(CategoryRequest $request, int $id)
    {
        $data = $request->validated();
        $current = DB::table('categories')->where('id', $id)->first();
        DB::table('categories')->where('id', $id)->update([
            'name' => $data['name'],
            'slug' => $this->uniqueSlug('categories', 'slug', $data['name'], $id),
            'image' => $request->file('image') ? $this->storeFile($request->file('image'), 'categories') : $current?->image,
            'is_active' => (bool) ($data['is_active'] ?? true),
            'updated_at' => now(),
        ]);
        return ApiResponse::success('Category updated.');
    }

    public function categoriesDestroy(int $id)
    {
        DB::table('categories')->where('id', $id)->delete();
        return ApiResponse::success('Category deleted.');
    }

    public function foodItemsIndex(Request $request)
    {
        $query = DB::table('food_items')->join('restaurants', 'restaurants.id', '=', 'food_items.restaurant_id')->select('food_items.*', 'restaurants.name as restaurant_name')->orderByDesc('food_items.id');
        return ApiResponse::paginated('Food items loaded.', $this->paginate($query, $request), 'food_items');
    }

    public function foodItemsShow(int $id)
    {
        return ApiResponse::success('Food item loaded.', ['food_item' => DB::table('food_items')->where('id', $id)->first()]);
    }

    public function foodItemsDisable(int $id)
    {
        DB::table('food_items')->where('id', $id)->update(['is_active' => false, 'updated_at' => now()]);
        return ApiResponse::success('Food item disabled.');
    }

    public function foodItemsEnable(int $id)
    {
        DB::table('food_items')->where('id', $id)->update(['is_active' => true, 'updated_at' => now()]);
        return ApiResponse::success('Food item enabled.');
    }

    public function foodItemsDestroy(int $id)
    {
        DB::table('food_items')->where('id', $id)->delete();
        return ApiResponse::success('Food item deleted.');
    }

    public function bannersIndex()
    {
        return ApiResponse::success('Banners loaded.', ['banners' => DB::table('banners')->orderBy('sort_order')->get()]);
    }

    public function bannersStore(BannerRequest $request)
    {
        $data = $request->validated();
        DB::table('banners')->insert([
            'title' => $data['title'],
            'subtitle' => $data['subtitle'] ?? null,
            'image' => $this->storeFile($request->file('image'), 'banners'),
            'link_url' => $data['link_url'] ?? null,
            'is_active' => (bool) ($data['is_active'] ?? true),
            'sort_order' => $data['sort_order'] ?? 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return ApiResponse::success('Banner created.', [], 201);
    }

    public function bannersUpdate(BannerRequest $request, int $id)
    {
        $data = $request->validated();
        $current = DB::table('banners')->where('id', $id)->first();
        DB::table('banners')->where('id', $id)->update([
            'title' => $data['title'],
            'subtitle' => $data['subtitle'] ?? null,
            'image' => $request->file('image') ? $this->storeFile($request->file('image'), 'banners') : $current?->image,
            'link_url' => $data['link_url'] ?? null,
            'is_active' => (bool) ($data['is_active'] ?? true),
            'sort_order' => $data['sort_order'] ?? 0,
            'updated_at' => now(),
        ]);
        return ApiResponse::success('Banner updated.');
    }

    public function bannersDestroy(int $id)
    {
        DB::table('banners')->where('id', $id)->delete();
        return ApiResponse::success('Banner deleted.');
    }

    public function bannersStatus(int $id)
    {
        $banner = DB::table('banners')->where('id', $id)->first();
        abort_if(! $banner, 404, 'Banner not found.');
        DB::table('banners')->where('id', $id)->update(['is_active' => ! (bool) $banner->is_active, 'updated_at' => now()]);
        return ApiResponse::success('Banner status updated.');
    }

    public function ordersIndex(Request $request)
    {
        $query = $this->orderQuery();
        if ($request->filled('status')) {
            $query->where('orders.status', $request->string('status')->toString());
        }

        return ApiResponse::paginated('Orders loaded.', $this->paginate($query, $request), 'orders');
    }

    public function ordersShow(int $id)
    {
        $order = $this->orderQuery()->where('orders.id', $id)->first();
        abort_if(! $order, 404, 'Order not found.');

        return ApiResponse::success('Order loaded.', [
            'order' => $order,
            'items' => DB::table('order_items')->where('order_id', $id)->get(),
            'payment' => DB::table('payments')->where('order_id', $id)->first(),
            'assignment' => $this->assignmentPayload($id),
            'timeline' => $this->orderTimeline($order),
        ]);
    }

    public function ordersTrack(int $id)
    {
        $order = $this->orderQuery()->where('orders.id', $id)->first();
        abort_if(! $order, 404, 'Order not found.');

        return ApiResponse::success('Order tracking loaded.', [
            'order' => $order,
            'timeline' => $this->orderTimeline($order),
            'assignment' => $this->assignmentPayload($id),
        ]);
    }

    public function ordersCancel(int $id)
    {
        $order = $this->orderQuery()->where('orders.id', $id)->first();
        abort_if(! $order, 404, 'Order not found.');

        DB::table('orders')->where('id', $id)->update([
            'status' => 'cancelled',
            'order_status' => 'cancelled',
            'cancelled_at' => now(),
            'updated_at' => now(),
        ]);

        app(DeliveryRequestService::class)->cancelRequestForOrder($id);

        if ($payment = DB::table('payments')->where('order_id', $id)->first()) {
            DB::table('payments')->where('order_id', $id)->update(['payment_status' => 'refunded', 'status' => 'refunded', 'updated_at' => now()]);
            DB::table('refunds')->insert([
                'order_id' => $id,
                'payment_id' => $payment->id,
                'amount' => $payment->amount,
                'reason' => 'Admin cancellation refund.',
                'status' => 'processed',
                'processed_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->notifyUser((int) $order->user_id, 'cancelled', 'Order cancelled', "Order {$order->order_number} has been cancelled.", ['order_id' => $id]);
        $vendorUserId = DB::table('vendors')->where('id', $order->vendor_id)->value('user_id');
        if ($vendorUserId) {
            $this->notifyUser((int) $vendorUserId, 'cancelled', 'Order cancelled', "Order {$order->order_number} has been cancelled by admin.", ['order_id' => $id]);
        }

        $this->refreshOrderTimeline($id);

        return ApiResponse::success('Order cancelled.');
    }

    public function ordersRefund(Request $request, int $id)
    {
        $request->validate(['reason' => ['required', 'string', 'max:5000']]);
        $order = $this->orderQuery()->where('orders.id', $id)->first();
        abort_if(! $order, 404, 'Order not found.');

        $payment = DB::table('payments')->where('order_id', $id)->first();
        abort_if(! $payment, 422, 'Payment not found.');

        DB::table('refunds')->insert([
            'order_id' => $id,
            'payment_id' => $payment->id,
            'amount' => $payment->amount,
            'reason' => $request->string('reason'),
            'status' => 'processed',
            'processed_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('payments')->where('order_id', $id)->update(['payment_status' => 'refunded', 'status' => 'refunded', 'updated_at' => now()]);
        DB::table('orders')->where('id', $id)->update(['status' => 'refunded', 'order_status' => 'refunded', 'updated_at' => now()]);

        $this->notifyUser((int) $order->user_id, 'refund_updated', 'Refund processed', "Your refund for order {$order->order_number} has been processed.", ['order_id' => $id]);
        $vendorUserId = DB::table('vendors')->where('id', $order->vendor_id)->value('user_id');
        if ($vendorUserId) {
            $this->notifyUser((int) $vendorUserId, 'refund_updated', 'Refund processed', "Refund was processed for order {$order->order_number}.", ['order_id' => $id]);
        }

        $this->refreshOrderTimeline($id);

        return ApiResponse::success('Refund processed.');
    }

    public function deliveryPartnersAvailable(Request $request)
    {
        $query = DB::table('delivery_partners')
            ->join('users', 'users.id', '=', 'delivery_partners.user_id')
            ->select('delivery_partners.*', 'users.name', 'users.email', 'users.account_status')
            ->where('delivery_partners.status', 'approved')
            ->whereIn('users.account_status', ['active', 'approved'])
            ->where('delivery_partners.is_available', 1)
            ->whereNull('delivery_partners.current_order_id')
            ->orderByDesc('delivery_partners.rating_average')
            ->orderByDesc('delivery_partners.id');

        return ApiResponse::paginated('Available delivery partners loaded.', $this->paginate($query, $request), 'delivery_partners');
    }

    public function deliveryRequestsIndex(Request $request)
    {
        $query = DB::table('delivery_requests')
            ->join('orders', 'orders.id', '=', 'delivery_requests.order_id')
            ->join('restaurants', 'restaurants.id', '=', 'delivery_requests.restaurant_id')
            ->leftJoin('delivery_partners', 'delivery_partners.id', '=', 'delivery_requests.accepted_by_delivery_partner_id')
            ->leftJoin('users as partner_users', 'partner_users.id', '=', 'delivery_partners.user_id')
            ->select(
                'delivery_requests.id',
                'delivery_requests.order_id',
                'delivery_requests.restaurant_id',
                'delivery_requests.city',
                'delivery_requests.area',
                'delivery_requests.status',
                'delivery_requests.accepted_at',
                'delivery_requests.expires_at',
                'delivery_requests.created_at',
                'orders.order_number',
                'orders.status as order_status',
                'orders.total_amount',
                'restaurants.name as restaurant_name',
                'restaurants.address_line as pickup_address',
                'partner_users.name as accepted_partner_name',
                'partner_users.email as accepted_partner_email',
                'delivery_partners.full_name as accepted_partner_full_name',
                'delivery_partners.phone as accepted_partner_phone'
            )
            ->orderByDesc('delivery_requests.id');

        return ApiResponse::paginated('Delivery requests loaded.', $this->paginate($query, $request), 'delivery_requests');
    }

    public function couponsIndex()
    {
        return ApiResponse::success('Coupons loaded.', ['coupons' => DB::table('coupons')->orderByDesc('id')->get()]);
    }

    public function couponsStore(CouponRequest $request)
    {
        $data = $request->validated();
        DB::table('coupons')->insert([
            'code' => Str::upper($data['code']),
            'title' => $data['title'],
            'type' => $data['type'],
            'value' => $data['value'],
            'min_order_amount' => $data['min_order_amount'] ?? 0,
            'max_discount_amount' => $data['max_discount_amount'] ?? null,
            'start_date' => $data['start_date'] ?? null,
            'end_date' => $data['end_date'] ?? null,
            'usage_limit' => $data['usage_limit'] ?? null,
            'is_active' => (bool) ($data['is_active'] ?? true),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->notifyUsersByRole('customer', 'coupon_created', 'New coupon available', "Coupon {$data['code']} has been created.", ['code' => $data['code']]);
        return ApiResponse::success('Coupon created.', [], 201);
    }

    public function couponsUpdate(CouponRequest $request, int $id)
    {
        $data = $request->validated();
        DB::table('coupons')->where('id', $id)->update([
            'code' => Str::upper($data['code']),
            'title' => $data['title'],
            'type' => $data['type'],
            'value' => $data['value'],
            'min_order_amount' => $data['min_order_amount'] ?? 0,
            'max_discount_amount' => $data['max_discount_amount'] ?? null,
            'start_date' => $data['start_date'] ?? null,
            'end_date' => $data['end_date'] ?? null,
            'usage_limit' => $data['usage_limit'] ?? null,
            'is_active' => (bool) ($data['is_active'] ?? true),
            'updated_at' => now(),
        ]);
        return ApiResponse::success('Coupon updated.');
    }

    public function couponsDestroy(int $id)
    {
        DB::table('coupons')->where('id', $id)->delete();
        return ApiResponse::success('Coupon deleted.');
    }

    public function couponsStatus(int $id)
    {
        $coupon = DB::table('coupons')->where('id', $id)->first();
        abort_if(! $coupon, 404, 'Coupon not found.');
        DB::table('coupons')->where('id', $id)->update(['is_active' => ! (bool) $coupon->is_active, 'updated_at' => now()]);
        return ApiResponse::success('Coupon status updated.');
    }

    public function paymentsIndex(Request $request)
    {
        return ApiResponse::paginated('Payments loaded.', $this->paginate(DB::table('payments')->orderByDesc('id'), $request), 'payments');
    }

    public function commissionsIndex(Request $request)
    {
        return ApiResponse::paginated('Commissions loaded.', $this->paginate(DB::table('admin_commissions')->orderByDesc('id'), $request), 'commissions');
    }

    public function vendorPayoutsIndex(Request $request)
    {
        return ApiResponse::paginated('Vendor payouts loaded.', $this->paginate(DB::table('vendor_payouts')->orderByDesc('id'), $request), 'vendor_payouts');
    }

    public function vendorPayoutsStore(Request $request)
    {
        $request->validate([
            'vendor_id' => ['required', 'integer', 'exists:vendors,id'],
            'order_id' => ['nullable', 'integer', 'exists:orders,id'],
            'amount' => ['required', 'numeric', 'min:0'],
            'commission_amount' => ['nullable', 'numeric', 'min:0'],
            'payout_status' => ['nullable', 'in:pending,paid,failed'],
        ]);

        DB::table('vendor_payouts')->insert([
            'vendor_id' => $request->integer('vendor_id'),
            'order_id' => $request->input('order_id'),
            'amount' => $request->float('amount'),
            'commission_amount' => $request->float('commission_amount', 0),
            'payout_status' => $request->input('payout_status', 'pending'),
            'payout_date' => now()->toDateString(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $vendorUserId = DB::table('vendors')->where('id', $request->integer('vendor_id'))->value('user_id');
        if ($vendorUserId) {
            $this->notifyUser((int) $vendorUserId, 'payout_created', 'Payout created', 'A vendor payout record has been created.', [
                'vendor_id' => $request->integer('vendor_id'),
            ]);
        }

        return ApiResponse::success('Vendor payout created.', [], 201);
    }

    public function vendorPayoutsStatus(Request $request, int $id)
    {
        $request->validate(['payout_status' => ['required', 'in:pending,paid,failed']]);
        $payout = DB::table('vendor_payouts')->where('id', $id)->first();
        abort_if(! $payout, 404, 'Payout not found.');
        DB::table('vendor_payouts')->where('id', $id)->update([
            'payout_status' => $request->input('payout_status'),
            'updated_at' => now(),
        ]);
        $vendorUserId = DB::table('vendors')->where('id', $payout->vendor_id)->value('user_id');
        if ($vendorUserId) {
            $this->notifyUser((int) $vendorUserId, 'payout_status', 'Payout status updated', "Your payout status is now {$request->input('payout_status')}.", [
                'vendor_payout_id' => $id,
            ]);
        }
        return ApiResponse::success('Vendor payout status updated.');
    }

    public function complaintsIndex(Request $request)
    {
        return ApiResponse::paginated('Complaints loaded.', $this->paginate(DB::table('complaints')->orderByDesc('id'), $request), 'complaints');
    }

    public function complaintsShow(int $id)
    {
        return ApiResponse::success('Complaint loaded.', ['complaint' => DB::table('complaints')->where('id', $id)->first()]);
    }

    public function complaintsReply(ComplaintReplyRequest $request, int $id)
    {
        $complaint = DB::table('complaints')->where('id', $id)->first();
        abort_if(! $complaint, 404, 'Complaint not found.');

        DB::table('complaints')->where('id', $id)->update([
            'admin_reply' => $request->validated('admin_reply'),
            'status' => $request->validated('status'),
            'replied_by' => $this->userId(),
            'replied_at' => now(),
            'updated_at' => now(),
        ]);

        $this->notifyUser((int) $complaint->user_id, 'complaint_reply', 'Complaint updated', 'Your complaint has a new admin reply.', ['complaint_id' => $id]);

        return ApiResponse::success('Complaint replied.');
    }

    public function complaintsStatus(Request $request, int $id)
    {
        $request->validate(['status' => ['required', 'in:pending,in_progress,resolved,rejected']]);
        $complaint = DB::table('complaints')->where('id', $id)->first();
        abort_if(! $complaint, 404, 'Complaint not found.');
        DB::table('complaints')->where('id', $id)->update([
            'status' => $request->input('status'),
            'updated_at' => now(),
        ]);

        $this->notifyUser((int) $complaint->user_id, 'complaint_status', 'Complaint status updated', "Your complaint status has been updated to {$request->input('status')}.", [
            'complaint_id' => $id,
        ]);
        return ApiResponse::success('Complaint status updated.');
    }

    public function reportsDailySales()
    {
        return ApiResponse::success('Daily sales report loaded.', [
            'report' => DB::table('orders')
                ->selectRaw('DATE(created_at) as day, COUNT(*) as orders_count, SUM(total_amount) as total_sales')
                ->groupByRaw('DATE(created_at)')
                ->orderBy('day', 'desc')
                ->get(),
        ]);
    }

    public function reportsMonthlyRevenue()
    {
        return ApiResponse::success('Monthly revenue report loaded.', [
            'report' => DB::table('orders')
                ->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, SUM(total_amount) as revenue')
                ->groupByRaw('DATE_FORMAT(created_at, "%Y-%m")')
                ->orderBy('month', 'desc')
                ->get(),
        ]);
    }

    public function reportsVendorSales()
    {
        return ApiResponse::success('Vendor sales report loaded.', [
            'report' => DB::table('orders')
                ->join('restaurants', 'restaurants.id', '=', 'orders.restaurant_id')
                ->join('vendors', 'vendors.id', '=', 'restaurants.vendor_id')
                ->join('users', 'users.id', '=', 'vendors.user_id')
                ->selectRaw('users.name as vendor_name, SUM(orders.total_amount) as total_sales, COUNT(*) as orders_count')
                ->groupBy('users.name')
                ->orderByDesc('total_sales')
                ->get(),
        ]);
    }

    public function reportsCommission()
    {
        return ApiResponse::success('Commission report loaded.', [
            'report' => DB::table('admin_commissions')
                ->selectRaw('status, SUM(amount) as commission_amount, COUNT(*) as rows_count')
                ->groupBy('status')
                ->get(),
        ]);
    }

    public function reportsCancellations()
    {
        return ApiResponse::success('Cancellation report loaded.', [
            'report' => DB::table('orders')->where('status', 'cancelled')->selectRaw('DATE(cancelled_at) as day, COUNT(*) as cancellations')->groupByRaw('DATE(cancelled_at)')->get(),
        ]);
    }

    public function reportsPayments()
    {
        return ApiResponse::success('Payments report loaded.', [
            'report' => DB::table('payments')->selectRaw('payment_status, COUNT(*) as count, SUM(amount) as total_amount')->groupBy('payment_status')->get(),
        ]);
    }

    private function changeUserStatus(int $userId, string $status): void
    {
        DB::table('users')->where('id', $userId)->update(['account_status' => $status, 'updated_at' => now()]);
    }

    private function customerPayload(int $id): ?object
    {
        return DB::table('users')->where('id', $id)->where('role', 'customer')->first();
    }

    private function vendorRow(int $id): object
    {
        $vendor = DB::table('vendors')->where('id', $id)->first();
        abort_if(! $vendor, 404, 'Vendor not found.');
        return $vendor;
    }

    private function vendorPayload(int $id): array
    {
        $vendor = DB::table('vendors')->join('users', 'users.id', '=', 'vendors.user_id')->select('vendors.*', 'users.name', 'users.email', 'users.account_status')->where('vendors.id', $id)->first();
        abort_if(! $vendor, 404, 'Vendor not found.');
        $restaurant = DB::table('restaurants')->where('vendor_id', $vendor->id)->first();
        return ['vendor' => $vendor, 'restaurant' => $restaurant];
    }

    private function deliveryRow(int $id): object
    {
        $partner = DB::table('delivery_partners')->where('id', $id)->first();
        abort_if(! $partner, 404, 'Delivery partner not found.');
        return $partner;
    }

    private function deliveryPayload(int $id): array
    {
        $partner = DB::table('delivery_partners')->join('users', 'users.id', '=', 'delivery_partners.user_id')->select('delivery_partners.*', 'users.name', 'users.email', 'users.account_status')->where('delivery_partners.id', $id)->first();
        abort_if(! $partner, 404, 'Delivery partner not found.');
        return ['delivery_partner' => $partner];
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

    private function orderQuery()
    {
        return DB::table('orders')
            ->join('users as customers', 'customers.id', '=', 'orders.user_id')
            ->join('restaurants', 'restaurants.id', '=', 'orders.restaurant_id')
            ->join('vendors', 'vendors.id', '=', 'restaurants.vendor_id')
            ->leftJoin('delivery_requests', 'delivery_requests.order_id', '=', 'orders.id')
            ->leftJoin('delivery_assignments', 'delivery_assignments.order_id', '=', 'orders.id')
            ->leftJoin('delivery_partners', 'delivery_partners.id', '=', 'delivery_assignments.delivery_partner_id')
            ->select(
                'orders.*',
                'customers.name as customer_name',
                'restaurants.name as restaurant_name',
                'delivery_requests.status as delivery_request_status',
                'delivery_requests.accepted_by_delivery_partner_id as delivery_request_partner_id',
                'delivery_requests.accepted_at as delivery_request_accepted_at',
                'delivery_requests.expires_at as delivery_request_expires_at',
                'delivery_partners.full_name as delivery_partner_name',
                'delivery_partners.phone as delivery_partner_phone',
                'delivery_partners.vehicle_type as delivery_vehicle_type',
                'delivery_assignments.status as assignment_status'
            );
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
