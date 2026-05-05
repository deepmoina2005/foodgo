<?php

namespace App\Services;

use App\Http\Requests\Api\Auth\ProfileRequest;
use App\Http\Requests\Api\Vendor\FoodItemRequest;
use App\Http\Requests\Api\Vendor\RestaurantRequest;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class VendorService extends BaseApiService
{
    public function profile()
    {
        return ApiResponse::success('Vendor profile loaded.', [
            'user' => DB::table('users')->where('id', $this->userId())->first(),
            'vendor' => $this->vendorRow(),
            'restaurant' => $this->restaurantRow(),
        ]);
    }

    public function profileUpdate(ProfileRequest $request)
    {
        $current = DB::table('users')->where('id', $this->userId())->first();
        $avatar = $request->file('avatar') ? $this->storeFile($request->file('avatar'), 'avatars') : $current?->avatar;

        DB::table('users')->where('id', $this->userId())->update([
            'name' => $request->validated('name'),
            'phone' => $request->validated('phone'),
            'avatar' => $avatar,
            'updated_at' => now(),
        ]);

        $vendor = $this->vendorRow();
        if ($vendor) {
            DB::table('vendors')->where('id', $vendor->id)->update([
                'store_name' => $request->validated('name'),
                'updated_at' => now(),
            ]);
        }

        return ApiResponse::success('Vendor profile updated.', [
            'user' => DB::table('users')->where('id', $this->userId())->first(),
        ]);
    }

    public function restaurantShow()
    {
        return ApiResponse::success('Restaurant loaded.', [
            'restaurant' => $this->restaurantRow(),
        ]);
    }

    public function restaurantStore(RestaurantRequest $request)
    {
        $vendor = $this->vendorRow();
        abort_if(! $vendor, 404, 'Vendor profile not found.');
        
        if ($this->restaurantRow()) {
            return $this->restaurantUpdate($request);
        }

        $data = $request->validated();
        $slug = $this->uniqueSlug('restaurants', 'slug', $data['name']);

        DB::table('restaurants')->insert([
            'vendor_id' => $vendor->id,
            'name' => $data['name'],
            'slug' => $slug,
            'description' => $data['description'] ?? null,
            'cuisine' => $data['cuisine'] ?? null,
            'area' => $data['area'] ?? null,
            'city' => $data['city'] ?? null,
            'address_line' => $data['address_line'] ?? null,
            'latitude' => $data['latitude'] ?? null,
            'longitude' => $data['longitude'] ?? null,
            'logo' => $this->storeBase64File($data['logo'] ?? null, 'restaurants'),
            'banner' => $this->storeBase64File($data['banner'] ?? null, 'restaurants'),
            'min_order_value' => $data['min_order_value'] ?? 0,
            'delivery_fee' => $data['delivery_fee'] ?? 0,
            'delivery_time_minutes' => $data['delivery_time_minutes'] ?? 30,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return ApiResponse::success('Restaurant created.', [], 201);
    }

    public function restaurantUpdate(RestaurantRequest $request)
    {
        $vendor = $this->vendorRow();
        $restaurant = $this->restaurantRow();
        abort_if(! $vendor || ! $restaurant, 404, 'Restaurant not found.');

        $data = $request->validated();

        DB::table('restaurants')->where('id', $restaurant->id)->update([
            'name' => $data['name'],
            'slug' => $this->uniqueSlug('restaurants', 'slug', $data['name'], $restaurant->id),
            'description' => $data['description'] ?? null,
            'cuisine' => $data['cuisine'] ?? null,
            'area' => $data['area'] ?? null,
            'city' => $data['city'] ?? $restaurant->city,
            'address_line' => $data['address_line'] ?? null,
            'latitude' => $data['latitude'] ?? $restaurant->latitude,
            'longitude' => $data['longitude'] ?? $restaurant->longitude,
            'logo' => isset($data['logo']) ? $this->replaceBase64File($data['logo'], $restaurant->logo, 'restaurants') : $restaurant->logo,
            'banner' => isset($data['banner']) ? $this->replaceBase64File($data['banner'], $restaurant->banner, 'restaurants') : $restaurant->banner,
            'min_order_value' => $data['min_order_value'] ?? $restaurant->min_order_value,
            'delivery_fee' => $data['delivery_fee'] ?? $restaurant->delivery_fee,
            'delivery_time_minutes' => $data['delivery_time_minutes'] ?? $restaurant->delivery_time_minutes,
            'updated_at' => now(),
        ]);

        DB::table('vendors')->where('id', $vendor->id)->update([
            'store_name' => $data['store_name'] ?? $vendor->store_name,
            'gst_number' => $data['gst_number'] ?? $vendor->gst_number,
            'license_number' => $data['license_number'] ?? $vendor->license_number,
            'bank_name' => $data['bank_name'] ?? $vendor->bank_name,
            'bank_account_number' => $data['bank_account_number'] ?? $vendor->bank_account_number,
            'bank_ifsc' => $data['bank_ifsc'] ?? $vendor->bank_ifsc,
            'updated_at' => now(),
        ]);

        return ApiResponse::success('Restaurant updated.', [
            'restaurant' => $this->restaurantRow(),
        ]);
    }

    public function documentsStore(Request $request)
    {
        $restaurant = $this->restaurantRow();
        abort_if(! $restaurant, 404, 'Restaurant not found.');

        $request->validate([
            'document_type' => ['required', 'string', 'max:100'],
            'document' => ['required', 'file', 'max:5120'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $path = $this->storeFile($request->file('document'), 'restaurant-documents');

        DB::table('restaurant_documents')->insert([
            'restaurant_id' => $restaurant->id,
            'document_type' => $request->string('document_type'),
            'file_path' => $path,
            'notes' => $request->string('notes')->toString() ?: null,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $vendor = $this->vendorRow();
        if ($vendor) {
            $this->notifyUsersByRole('admin', 'vendor_document_uploaded', 'Vendor document uploaded', "Vendor documents were uploaded for review.", [
                'vendor_id' => $vendor->id,
                'restaurant_id' => $restaurant->id,
            ]);
        }

        return ApiResponse::success('Restaurant document uploaded.', [], 201);
    }

    public function foodsIndex(Request $request)
    {
        $restaurantId = $this->restaurantRow()?->id;
        $query = DB::table('food_items')
            ->leftJoin('categories', 'categories.id', '=', 'food_items.category_id')
            ->select('food_items.*', 'categories.name as category_name');

        if ($restaurantId) {
            $query->where('food_items.restaurant_id', $restaurantId);
        }

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('food_items.name', 'like', "%{$search}%")
                    ->orWhere('food_items.description', 'like', "%{$search}%");
            });
        }

        return ApiResponse::paginated('Food items loaded.', $this->paginate($query->orderByDesc('food_items.id'), $request), 'food_items');
    }

    public function foodsStore(FoodItemRequest $request)
    {
        $restaurant = $this->restaurantRow();
        abort_if(! $restaurant, 404, 'Restaurant not found.');

        $data = $request->validated();
        $slug = $this->uniqueSlug('food_items', 'slug', $data['name']);

        DB::table('food_items')->insert([
            'restaurant_id' => $restaurant->id,
            'category_id' => $data['category_id'] ?? null,
            'name' => $data['name'],
            'slug' => $slug,
            'description' => $data['description'] ?? null,
            'price' => $data['price'],
            'discount_price' => $data['discount_price'] ?? null,
            'veg_type' => $data['veg_type'],
            'stock_qty' => $data['stock_qty'] ?? 0,
            'stock_enabled' => (bool) ($data['stock_enabled'] ?? true),
            'today_special' => (bool) ($data['today_special'] ?? false),
            'best_seller' => (bool) ($data['best_seller'] ?? false),
            'prep_time_minutes' => $data['prep_time_minutes'] ?? 20,
            'image' => $this->storeFile($request->file('image'), 'food-items'),
            'is_active' => (bool) ($data['is_active'] ?? true),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return ApiResponse::success('Food item created.', [], 201);
    }

    public function foodsShow(int $id)
    {
        $food = $this->ownedFoodItem($id);
        return ApiResponse::success('Food item loaded.', ['food_item' => $food]);
    }

    public function foodsUpdate(FoodItemRequest $request, int $id)
    {
        $food = $this->ownedFoodItem($id);
        $data = $request->validated();

        DB::table('food_items')->where('id', $id)->update([
            'category_id' => $data['category_id'] ?? null,
            'name' => $data['name'],
            'slug' => $this->uniqueSlug('food_items', 'slug', $data['name'], $id),
            'description' => $data['description'] ?? null,
            'price' => $data['price'],
            'discount_price' => $data['discount_price'] ?? null,
            'veg_type' => $data['veg_type'],
            'stock_qty' => $data['stock_qty'] ?? $food->stock_qty,
            'stock_enabled' => (bool) ($data['stock_enabled'] ?? $food->stock_enabled),
            'today_special' => (bool) ($data['today_special'] ?? $food->today_special),
            'best_seller' => (bool) ($data['best_seller'] ?? $food->best_seller),
            'prep_time_minutes' => $data['prep_time_minutes'] ?? $food->prep_time_minutes,
            'image' => $request->file('image') ? $this->replaceFile($request->file('image'), $food->image, 'food-items') : $food->image,
            'is_active' => (bool) ($data['is_active'] ?? $food->is_active),
            'updated_at' => now(),
        ]);

        return ApiResponse::success('Food item updated.');
    }

    public function foodsDestroy(int $id)
    {
        $this->ownedFoodItem($id);
        DB::table('food_items')->where('id', $id)->delete();

        return ApiResponse::success('Food item deleted.');
    }

    public function foodsStock(int $id)
    {
        $food = $this->ownedFoodItem($id);
        DB::table('food_items')->where('id', $id)->update([
            'stock_enabled' => ! (bool) $food->stock_enabled,
            'updated_at' => now(),
        ]);

        return ApiResponse::success('Stock status updated.');
    }

    public function foodsStatus(int $id)
    {
        $food = $this->ownedFoodItem($id);
        DB::table('food_items')->where('id', $id)->update([
            'is_active' => ! (bool) $food->is_active,
            'updated_at' => now(),
        ]);

        return ApiResponse::success('Food visibility updated.');
    }

    public function ordersIndex()
    {
        return ApiResponse::success('Vendor orders loaded.', [
            'orders' => $this->vendorOrdersQuery(request())->orderByDesc('orders.id')->get(),
        ]);
    }

    public function ordersShow(int $id)
    {
        $order = $this->orderPayload($id);
        abort_if(! $order, 404, 'Order not found.');

        return ApiResponse::success('Order loaded.', [
            'order' => $order,
            'items' => DB::table('order_items')->where('order_id', $id)->get(),
            'payment' => DB::table('payments')->where('order_id', $id)->first(),
            'assignment' => $this->assignmentPayload($id),
            'timeline' => $this->timelinePayload($order),
        ]);
    }

    public function ordersAccept(int $id)
    {
        $order = $this->ownedOrder($id);
        abort_if($order->status !== 'placed', 422, 'Only placed orders can be accepted.');

        DB::table('orders')->where('id', $id)->update([
            'status' => 'accepted',
            'order_status' => 'accepted',
            'accepted_at' => now(),
            'updated_at' => now(),
        ]);

        $this->notifyUser((int) $order->user_id, 'order_accepted', 'Order accepted', "Order {$order->order_number} has been accepted.", ['order_id' => $id]);
        $this->notifyUsersByRole('admin', 'order_accepted', 'Order accepted', "Order {$order->order_number} has been accepted by the vendor.", ['order_id' => $id]);
        $this->refreshOrderTimeline($id);

        return ApiResponse::success('Order accepted.');
    }

    public function ordersReject(int $id)
    {
        $order = $this->ownedOrder($id);
        abort_if($order->status !== 'placed', 422, 'Only placed orders can be rejected.');

        DB::table('orders')->where('id', $id)->update([
            'status' => 'cancelled',
            'order_status' => 'cancelled',
            'cancelled_at' => now(),
            'updated_at' => now(),
        ]);

        $this->notifyUser((int) $order->user_id, 'order_rejected', 'Order rejected', "Order {$order->order_number} has been rejected.", ['order_id' => $id]);
        $this->notifyUsersByRole('admin', 'order_rejected', 'Order rejected', "Order {$order->order_number} has been rejected by the vendor.", ['order_id' => $id]);
        app(DeliveryRequestService::class)->cancelRequestForOrder($id);
        $this->refreshOrderTimeline($id);

        return ApiResponse::success('Order rejected.');
    }

    public function ordersStatus(Request $request, int $id)
    {
        $order = $this->ownedOrder($id);
        $request->validate([
            'status' => ['required', 'in:preparing,ready'],
        ]);

        $status = $request->string('status')->toString();
        abort_if(
            ($status === 'preparing' && $order->status !== 'accepted') ||
            ($status === 'ready' && $order->status !== 'preparing'),
            422,
            'Invalid status transition.'
        );

        $payload = [
            'status' => $status,
            'order_status' => $status,
            'updated_at' => now(),
        ];

        if ($status === 'preparing') {
            $payload['prepared_at'] = now();
        } else {
            $payload['ready_at'] = now();
        }

        DB::table('orders')->where('id', $id)->update($payload);
        if ($status === 'ready') {
            app(DeliveryRequestService::class)->createRequestForOrder($id);
        }
        $this->refreshOrderTimeline($id);

        $notifications = [
            'preparing' => ['order_preparing', 'Preparing', 'Your order is now being prepared.'],
            'ready' => ['order_ready', 'Ready', 'Your order is ready for pickup.'],
        ];
        [$type, $title, $message] = $notifications[$status];
        $this->notifyUser((int) $order->user_id, $type, $title, $message, ['order_id' => $id]);

        return ApiResponse::success($status === 'ready' ? 'Order is ready. Pickup request sent to delivery partners.' : 'Order status updated.');
    }

    public function ordersInvoice(int $id)
    {
        $order = $this->ownedOrder($id);

        return ApiResponse::success('Invoice loaded.', [
            'order' => $this->orderPayload($id),
            'items' => DB::table('order_items')->where('order_id', $id)->get(),
            'payment' => DB::table('payments')->where('order_id', $id)->first(),
        ]);
    }

    public function dashboard()
    {
        $restaurant = $this->restaurantRow();
        $query = $this->vendorOrdersQuery();
        $todayQuery = $this->vendorOrdersQuery()->whereDate('orders.created_at', now()->toDateString());

        return ApiResponse::success('Dashboard loaded.', [
            'restaurant' => $restaurant,
            'stats' => [
                'total_orders' => (clone $query)->count(),
                'placed_orders' => (clone $query)->where('orders.status', 'placed')->count(),
                'incoming_orders' => (clone $query)->where('orders.status', 'placed')->count(),
                'preparing_orders' => (clone $query)->where('orders.status', 'preparing')->count(),
                'ready_orders' => (clone $query)->where('orders.status', 'ready')->count(),
                'completed_orders' => (clone $query)->where('orders.status', 'delivered')->count(),
                'sales' => (float) (clone $query)->where('orders.payment_status', 'paid')->sum('orders.total_amount'),
                'today_sales' => (float) (clone $todayQuery)->where('orders.payment_status', 'paid')->sum('orders.total_amount'),
                'monthly_sales' => (float) DB::table('orders')
                    ->join('restaurants', 'restaurants.id', '=', 'orders.restaurant_id')
                    ->join('vendors', 'vendors.id', '=', 'restaurants.vendor_id')
                    ->where('vendors.user_id', $this->userId())
                    ->where('orders.payment_status', 'paid')
                    ->whereMonth('orders.created_at', now()->month)
                    ->whereYear('orders.created_at', now()->year)
                    ->sum('orders.total_amount'),
            ],
        ]);
    }

    public function reportsSales()
    {
        $rows = DB::table('orders')
            ->join('restaurants', 'restaurants.id', '=', 'orders.restaurant_id')
            ->join('vendors', 'vendors.id', '=', 'restaurants.vendor_id')
            ->where('vendors.user_id', $this->userId())
            ->selectRaw('DATE(orders.created_at) as day, COUNT(orders.id) as orders_count, COALESCE(SUM(orders.total_amount), 0) as sales_total')
            ->groupByRaw('DATE(orders.created_at)')
            ->orderBy('day')
            ->get();

        return ApiResponse::success('Sales report loaded.', ['report' => $rows]);
    }

    public function reportsBestSelling()
    {
        $rows = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('restaurants', 'restaurants.id', '=', 'orders.restaurant_id')
            ->where('restaurants.vendor_id', $this->vendorRow()->id)
            ->selectRaw('order_items.item_name, SUM(order_items.quantity) as total_quantity, SUM(order_items.line_total) as total_sales')
            ->groupBy('order_items.item_name')
            ->orderByDesc('total_quantity')
            ->get();

        return ApiResponse::success('Best selling items loaded.', ['items' => $rows]);
    }

    public function reviewsIndex()
    {
        $restaurant = $this->restaurantRow();
        if (! $restaurant) {
            return ApiResponse::success('Reviews loaded.', ['reviews' => []]);
        }

        return ApiResponse::success('Reviews loaded.', [
            'reviews' => DB::table('reviews')->where('restaurant_id', $restaurant->id)->orderByDesc('id')->get(),
        ]);
    }

    public function payoutsIndex()
    {
        $vendor = $this->vendorRow();
        return ApiResponse::success('Payouts loaded.', [
            'payouts' => DB::table('vendor_payouts')->where('vendor_id', $vendor->id)->orderByDesc('id')->get(),
        ]);
    }

    private function vendorRow(): ?object
    {
        return DB::table('vendors')->where('user_id', $this->userId())->first();
    }

    private function restaurantRow(): ?object
    {
        $vendor = $this->vendorRow();
        if (! $vendor) {
            return null;
        }

        return DB::table('restaurants')->where('vendor_id', $vendor->id)->first();
    }

    private function ownedFoodItem(int $id): object
    {
        $food = DB::table('food_items')
            ->join('restaurants', 'restaurants.id', '=', 'food_items.restaurant_id')
            ->join('vendors', 'vendors.id', '=', 'restaurants.vendor_id')
            ->select('food_items.*')
            ->where('food_items.id', $id)
            ->where('vendors.user_id', $this->userId())
            ->first();

        abort_if(! $food, 404, 'Food item not found.');

        return $food;
    }

    private function ownedOrder(int $id): object
    {
        $order = $this->vendorOrdersQuery()->where('orders.id', $id)->first();
        abort_if(! $order, 404, 'Order not found.');

        return $order;
    }

    private function orderPayload(int $orderId): ?object
    {
        return DB::table('orders')
            ->leftJoin('users as customers', 'customers.id', '=', 'orders.user_id')
            ->leftJoin('restaurants', 'restaurants.id', '=', 'orders.restaurant_id')
            ->leftJoin('delivery_requests', 'delivery_requests.order_id', '=', 'orders.id')
            ->leftJoin('delivery_assignments', 'delivery_assignments.order_id', '=', 'orders.id')
            ->leftJoin('delivery_partners', 'delivery_partners.id', '=', 'delivery_assignments.delivery_partner_id')
            ->select(
                'orders.*',
                'customers.name as customer_name',
                'customers.phone as customer_phone',
                'restaurants.name as restaurant_name',
                'restaurants.area as restaurant_area',
                'restaurants.city as restaurant_city',
                'delivery_requests.status as delivery_request_status',
                'delivery_requests.accepted_by_delivery_partner_id as delivery_request_partner_id',
                'delivery_requests.accepted_at as delivery_request_accepted_at',
                'delivery_requests.expires_at as delivery_request_expires_at',
                'delivery_partners.full_name as delivery_partner_name',
                'delivery_partners.phone as delivery_partner_phone',
                'delivery_partners.vehicle_type as delivery_vehicle_type',
                'delivery_assignments.status as assignment_status'
            )
            ->where('orders.id', $orderId)
            ->whereExists(function ($builder): void {
                $builder->select(DB::raw(1))
                    ->from('restaurants')
                    ->join('vendors', 'vendors.id', '=', 'restaurants.vendor_id')
                    ->whereColumn('restaurants.id', 'orders.restaurant_id')
                    ->where('vendors.user_id', $this->userId());
            })
            ->first();
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

    private function vendorOrdersQuery(Request $request = null)
    {
        $query = DB::table('orders')
            ->join('restaurants', 'restaurants.id', '=', 'orders.restaurant_id')
            ->join('vendors', 'vendors.id', '=', 'restaurants.vendor_id')
            ->select('orders.*', 'restaurants.name as restaurant_name')
            ->where('vendors.user_id', $this->userId());

        if ($request?->filled('status')) {
            $query->where('orders.status', $request->string('status')->toString());
        }

        return $query;
    }

    private function timelinePayload(object $order): array
    {
        if (! empty($order->status_timeline)) {
            $decoded = json_decode((string) $order->status_timeline, true);
            if (is_array($decoded)) {
                return $this->normalizeOrderTimeline($order, $decoded);
            }
        }

        return $this->buildOrderTimeline($order);
    }
}
