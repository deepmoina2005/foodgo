<?php

namespace App\Services;

use App\Http\Requests\Api\Customer\AddressRequest;
use App\Http\Requests\Api\Customer\CartItemRequest;
use App\Http\Requests\Api\Customer\CartItemUpdateRequest;
use App\Http\Requests\Api\Customer\CheckoutRequest;
use App\Http\Requests\Api\Customer\ComplaintRequest;
use App\Http\Requests\Api\Customer\CouponRequest;
use App\Http\Requests\Api\Customer\ReviewRequest;
use App\Http\Requests\Api\Auth\ProfileRequest;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CustomerService extends BaseApiService
{
    public function profile()
    {
        $user = DB::table('users')->where('id', $this->userId())->first();
        $addresses = DB::table('addresses')->where('user_id', $this->userId())->orderByDesc('is_default')->get();

        return ApiResponse::success('Customer profile loaded.', [
            'user' => $user,
            'addresses' => $addresses,
        ]);
    }

    public function profileUpdate(ProfileRequest $request)
    {
        $current = DB::table('users')->where('id', $this->userId())->first();
        $avatar = $request->file('avatar') ? $this->storeFile($request->file('avatar'), 'avatars') : $current?->avatar;

        DB::table('users')
            ->where('id', $this->userId())
            ->update([
                'name' => $request->validated('name'),
                'phone' => $request->validated('phone'),
                'avatar' => $avatar,
                'updated_at' => now(),
            ]);

        return ApiResponse::success('Profile updated.', [
            'user' => DB::table('users')->where('id', $this->userId())->first(),
        ]);
    }

    public function addressesIndex()
    {
        return ApiResponse::success('Addresses loaded.', [
            'addresses' => DB::table('addresses')->where('user_id', $this->userId())->orderByDesc('is_default')->get(),
        ]);
    }

    public function addressesStore(AddressRequest $request)
    {
        $data = $request->validated();

        if (! empty($data['is_default'])) {
            DB::table('addresses')->where('user_id', $this->userId())->update(['is_default' => false, 'updated_at' => now()]);
        }

        DB::table('addresses')->insert([
            'user_id' => $this->userId(),
            'label' => $data['label'] ?? 'Home',
            'name' => $data['name'],
            'phone' => $data['phone'] ?? null,
            'line1' => $data['line1'],
            'line2' => $data['line2'] ?? null,
            'city' => $data['city'],
            'state' => $data['state'],
            'postal_code' => $data['postal_code'],
            'area' => $data['area'] ?? null,
            'landmark' => $data['landmark'] ?? null,
            'is_default' => (bool) ($data['is_default'] ?? false),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return ApiResponse::success('Address created.');
    }

    public function addressesUpdate(AddressRequest $request, int $id)
    {
        $address = DB::table('addresses')->where('id', $id)->where('user_id', $this->userId())->first();
        abort_if(! $address, 404, 'Address not found.');

        $data = $request->validated();

        if (! empty($data['is_default'])) {
            DB::table('addresses')->where('user_id', $this->userId())->update(['is_default' => false, 'updated_at' => now()]);
        }

        DB::table('addresses')
            ->where('id', $id)
            ->where('user_id', $this->userId())
            ->update([
                'label' => $data['label'] ?? $address->label,
                'name' => $data['name'],
                'phone' => $data['phone'] ?? null,
                'line1' => $data['line1'],
                'line2' => $data['line2'] ?? null,
                'city' => $data['city'],
                'state' => $data['state'],
                'postal_code' => $data['postal_code'],
                'area' => $data['area'] ?? null,
                'landmark' => $data['landmark'] ?? null,
                'is_default' => (bool) ($data['is_default'] ?? false),
                'updated_at' => now(),
            ]);

        return ApiResponse::success('Address updated.');
    }

    public function addressesDestroy(int $id)
    {
        DB::table('addresses')->where('id', $id)->where('user_id', $this->userId())->delete();

        return ApiResponse::success('Address deleted.');
    }

    public function addressesDefault(int $id)
    {
        DB::table('addresses')->where('user_id', $this->userId())->update(['is_default' => false, 'updated_at' => now()]);
        DB::table('addresses')->where('id', $id)->where('user_id', $this->userId())->update(['is_default' => true, 'updated_at' => now()]);

        return ApiResponse::success('Default address updated.');
    }

    public function restaurantsIndex(Request $request)
    {
        $query = DB::table('restaurants')
            ->join('vendors', 'vendors.id', '=', 'restaurants.vendor_id')
            ->select(
                'restaurants.*',
                'vendors.status as vendor_status',
                DB::raw('(select count(*) from food_items where food_items.restaurant_id = restaurants.id and food_items.is_active = 1) as available_food_count')
            );

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('restaurants.name', 'like', "%{$search}%")
                    ->orWhere('restaurants.cuisine', 'like', "%{$search}%")
                    ->orWhere('restaurants.area', 'like', "%{$search}%")
                    ->orWhere('restaurants.city', 'like', "%{$search}%");
            });
        }

        if ($area = $request->string('area')->toString()) {
            $query->where('restaurants.area', 'like', "%{$area}%");
        }

        if ($city = $request->string('city')->toString()) {
            $query->where('restaurants.city', 'like', "%{$city}%");
        }

        if ($request->filled('category_id')) {
            $categoryId = $request->integer('category_id');
            $query->whereExists(function ($builder) use ($categoryId): void {
                $builder->select(DB::raw(1))
                    ->from('food_items')
                    ->whereColumn('food_items.restaurant_id', 'restaurants.id')
                    ->where('food_items.category_id', $categoryId);
            });
        }

        if ($request->boolean('veg_only')) {
            $query->whereExists(function ($builder): void {
                $builder->select(DB::raw(1))
                    ->from('food_items')
                    ->whereColumn('food_items.restaurant_id', 'restaurants.id')
                    ->where('food_items.veg_type', 'veg');
            });
        }

        if ($request->filled('rating')) {
            $query->where('restaurants.average_rating', '>=', (float) $request->input('rating'));
        }

        if ($request->filled('min_price')) {
            $query->where('restaurants.min_order_value', '>=', $request->float('min_price'));
        }

        if ($request->filled('max_price')) {
            $query->where('restaurants.min_order_value', '<=', $request->float('max_price'));
        }

        $sort = $request->string('sort_by', $request->string('sort')->toString())->toString();
        if ($sort === 'price') {
            $query->orderBy('restaurants.min_order_value');
        } elseif ($sort === 'popularity') {
            $query->orderByDesc('restaurants.average_rating')->orderByDesc('restaurants.id');
        } elseif ($sort === 'delivery_time') {
            $query->orderBy('restaurants.delivery_time_minutes');
        } else {
            $query->orderByDesc('restaurants.average_rating')->orderByDesc('restaurants.id');
        }

        return ApiResponse::paginated('Restaurants loaded.', $this->paginate($query, $request), 'restaurants');
    }

    public function restaurantsShow(int $id)
    {
        $restaurant = DB::table('restaurants')->where('id', $id)->first();
        abort_if(! $restaurant, 404, 'Restaurant not found.');

        $foods = DB::table('food_items')
            ->leftJoin('categories', 'categories.id', '=', 'food_items.category_id')
            ->select('food_items.*', 'categories.name as category_name')
            ->where('food_items.restaurant_id', $id)
            ->orderBy('categories.name')
            ->orderByDesc('food_items.best_seller')
            ->orderByDesc('food_items.today_special')
            ->orderBy('food_items.name')
            ->get();
        $reviews = DB::table('reviews')
            ->leftJoin('users', 'users.id', '=', 'reviews.user_id')
            ->select('reviews.*', 'users.name as customer_name')
            ->where('reviews.restaurant_id', $id)
            ->orderByDesc('reviews.id')
            ->limit(8)
            ->get();
        $categories = DB::table('categories')
            ->join('food_items', 'food_items.category_id', '=', 'categories.id')
            ->where('food_items.restaurant_id', $id)
            ->where('food_items.is_active', true)
            ->select('categories.id', 'categories.name', 'categories.slug')
            ->distinct()
            ->orderBy('categories.name')
            ->get();
        $groupedFoods = $foods->groupBy(function (object $food): string {
            return (string) ($food->category_name ?? 'Uncategorized');
        })->map(fn ($items) => $items->values()->all())->all();

        return ApiResponse::success('Restaurant loaded.', [
            'restaurant' => $restaurant,
            'categories' => $categories,
            'foods' => $foods,
            'menu' => $groupedFoods,
            'reviews' => $reviews,
        ]);
    }

    public function restaurantsMenu(int $id)
    {
        return $this->restaurantsShow($id);
    }

    public function foodsIndex(Request $request)
    {
        $query = DB::table('food_items')
            ->join('restaurants', 'restaurants.id', '=', 'food_items.restaurant_id')
            ->leftJoin('categories', 'categories.id', '=', 'food_items.category_id')
            ->select('food_items.*', 'restaurants.name as restaurant_name', 'restaurants.area as restaurant_area', 'categories.name as category_name');

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('food_items.name', 'like', "%{$search}%")
                    ->orWhere('food_items.description', 'like', "%{$search}%")
                    ->orWhere('restaurants.name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('restaurant_id')) {
            $query->where('food_items.restaurant_id', $request->integer('restaurant_id'));
        }

        if ($request->filled('category_id')) {
            $query->where('food_items.category_id', $request->integer('category_id'));
        }

        if ($area = $request->string('area')->toString()) {
            $query->where('restaurants.area', 'like', "%{$area}%");
        }

        if ($request->filled('rating')) {
            $query->where('restaurants.average_rating', '>=', (float) $request->input('rating'));
        }

        if ($request->filled('veg_type')) {
            $query->where('food_items.veg_type', $request->string('veg_type'));
        }

        if ($request->boolean('veg_only')) {
            $query->where('food_items.veg_type', 'veg');
        }

        if ($request->filled('min_price')) {
            $query->whereRaw('COALESCE(food_items.discount_price, food_items.price) >= ?', [$request->float('min_price')]);
        }

        if ($request->filled('max_price')) {
            $query->whereRaw('COALESCE(food_items.discount_price, food_items.price) <= ?', [$request->float('max_price')]);
        }

        $sort = $request->string('sort_by', $request->string('sort')->toString())->toString();
        if ($sort === 'price') {
            $query->orderByRaw('COALESCE(food_items.discount_price, food_items.price) ASC');
        } elseif ($sort === 'delivery_time') {
            $query->orderBy('food_items.prep_time_minutes');
        } elseif ($sort === 'popularity') {
            $query->orderByDesc('food_items.popularity_score');
        } else {
            $query->orderByDesc('food_items.popularity_score');
        }

        return ApiResponse::paginated('Foods loaded.', $this->paginate($query, $request), 'foods');
    }

    public function foodsShow(int $id)
    {
        $food = DB::table('food_items')
            ->join('restaurants', 'restaurants.id', '=', 'food_items.restaurant_id')
            ->leftJoin('categories', 'categories.id', '=', 'food_items.category_id')
            ->select('food_items.*', 'restaurants.name as restaurant_name', 'restaurants.area as restaurant_area', 'restaurants.city as restaurant_city', 'restaurants.delivery_fee as restaurant_delivery_fee', 'categories.name as category_name')
            ->where('food_items.id', $id)
            ->first();

        abort_if(! $food, 404, 'Food item not found.');

        return ApiResponse::success('Food loaded.', [
            'food' => $food,
        ]);
    }

    public function categoriesIndex()
    {
        return ApiResponse::success('Categories loaded.', [
            'categories' => DB::table('categories')->where('is_active', true)->orderBy('name')->get(),
        ]);
    }

    public function cartShow()
    {
        $cart = $this->resolveCart();

        return ApiResponse::success('Cart loaded.', [
            'cart' => $this->cartPayload($cart->id),
        ]);
    }

    public function cartSummary()
    {
        $cart = $this->resolveCart();

        return ApiResponse::success('Cart summary loaded.', [
            'summary' => $this->cartSummaryPayload($cart->id),
        ]);
    }

    public function cartStore(CartItemRequest $request)
    {
        $data = $request->validated();
        $food = DB::table('food_items')->where('id', $data['food_item_id'])->first();
        abort_if(! $food, 404, 'Food item not found.');
        abort_if(! $food->is_active || ! $food->stock_enabled || (int) $food->stock_qty <= 0, 422, 'Food item is not available.');
        $restaurant = DB::table('restaurants')->where('id', $food->restaurant_id)->first();
        abort_if(! $restaurant || $restaurant->status !== 'active', 422, 'Restaurant is not active.');

        return DB::transaction(function () use ($data, $food) {
            $cart = $this->resolveCart(true, $food->restaurant_id);
            $existingRestaurantId = $cart->restaurant_id;
            $hasItems = DB::table('cart_items')->where('cart_id', $cart->id)->exists();

            if ($existingRestaurantId && (int) $existingRestaurantId !== (int) $food->restaurant_id && $hasItems) {
                return ApiResponse::error('Your cart already has items from another restaurant. Clear cart first.', 422);
            }

            if (! $existingRestaurantId || (int) $existingRestaurantId !== (int) $food->restaurant_id) {
                DB::table('carts')->where('id', $cart->id)->update([
                    'restaurant_id' => $food->restaurant_id,
                    'updated_at' => now(),
                ]);
            }

            $price = $this->effectiveFoodPrice($food);
            $quantity = (int) ($data['quantity'] ?? 1);
            $itemTotal = $price * $quantity;

            DB::table('cart_items')->updateOrInsert(
                [
                    'cart_id' => $cart->id,
                    'food_item_id' => $food->id,
                ],
                [
                    'quantity' => $quantity,
                    'price' => $price,
                    'item_total' => $itemTotal,
                    'note' => $data['note'] ?? null,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );

            $this->recalculateCart($cart->id);

            return ApiResponse::success('Cart item saved.', [
                'cart' => $this->cartPayload($cart->id),
            ]);
        });
    }

    public function cartUpdate(CartItemUpdateRequest $request, int $id)
    {
        $cart = $this->resolveCart();
        $item = DB::table('cart_items')->where('id', $id)->where('cart_id', $cart->id)->first();
        abort_if(! $item, 404, 'Cart item not found.');

        $food = DB::table('food_items')->where('id', $item->food_item_id)->first();
        abort_if(! $food || ! $food->is_active || ! $food->stock_enabled || (int) $food->stock_qty <= 0, 422, 'Food item is not available.');
        $quantity = (int) ($request->validated('quantity') ?? 1);
        $price = $this->effectiveFoodPrice($food);

        DB::table('cart_items')->where('id', $id)->update([
            'quantity' => $quantity,
            'price' => $price,
            'item_total' => $price * $quantity,
            'note' => $request->validated('note') ?? $item->note,
            'updated_at' => now(),
        ]);

        $this->recalculateCart($cart->id);

        return ApiResponse::success('Cart item updated.', [
            'cart' => $this->cartPayload($cart->id),
        ]);
    }

    public function cartDestroy(int $id)
    {
        $cart = $this->resolveCart();
        DB::table('cart_items')->where('id', $id)->where('cart_id', $cart->id)->delete();
        $this->recalculateCart($cart->id);

        return ApiResponse::success('Cart item removed.', [
            'cart' => $this->cartPayload($cart->id),
        ]);
    }

    public function cartClear()
    {
        $cart = $this->resolveCart();
        $this->clearCart($cart->id);

        return ApiResponse::success('Cart cleared.', [
            'cart' => $this->cartPayload($cart->id),
        ]);
    }

    public function cartApplyCoupon(CouponRequest $request)
    {
        $cart = $this->resolveCart();
        $coupon = DB::table('coupons')
            ->where('code', Str::upper($request->validated('code')))
            ->where('is_active', true)
            ->first();

        if (! $coupon) {
            return ApiResponse::error('Coupon is invalid or inactive.', 422);
        }

        $subtotal = $this->cartSubtotal($cart->id);
        if ($subtotal < $coupon->min_order_amount) {
            return ApiResponse::error('Coupon minimum order amount not met.', 422);
        }

        $discount = $this->calculateDiscount($subtotal, $coupon);

        DB::table('carts')->where('id', $cart->id)->update([
            'coupon_code' => $coupon->code,
            'coupon_discount' => $discount,
            'total_amount' => max(0, $subtotal - $discount),
            'updated_at' => now(),
        ]);

        return ApiResponse::success('Coupon applied.', [
            'cart' => $this->cartPayload($cart->id),
        ]);
    }

    public function checkout(CheckoutRequest $request)
    {
        $cart = $this->resolveCart();
        $items = DB::table('cart_items')->where('cart_id', $cart->id)->get();
        abort_if($items->isEmpty(), 422, 'Cart is empty.');

        $restaurant = DB::table('restaurants')->where('id', $cart->restaurant_id)->first();
        abort_if(! $restaurant, 422, 'Restaurant not found for cart.');
        abort_if($restaurant->status !== 'active', 422, 'Restaurant is not active.');

        $address = DB::table('addresses')->where('id', $request->validated('address_id'))->where('user_id', $this->userId())->first();
        abort_if(! $address, 404, 'Address not found.');

        $coupon = null;
        if ($request->filled('coupon_code')) {
            $coupon = DB::table('coupons')->where('code', Str::upper($request->string('coupon_code')->toString()))->where('is_active', true)->first();
        } elseif ($cart->coupon_code) {
            $coupon = DB::table('coupons')->where('code', $cart->coupon_code)->first();
        }

        return DB::transaction(function () use ($items, $restaurant, $address, $coupon, $request, $cart) {
            $subtotal = 0;
            foreach ($items as $item) {
                $food = DB::table('food_items')->where('id', $item->food_item_id)->first();
                abort_if(! $food || ! $food->is_active || ! $food->stock_enabled || (int) $food->stock_qty < (int) $item->quantity, 422, 'One or more food items are not available.');
                $subtotal += $item->item_total;
            }

            $pricing = (new PricingService())->quote($cart->id, $restaurant, $coupon);
            $discount = (float) ($coupon ? $pricing['discount_amount'] : $cart->coupon_discount);
            $deliveryFee = (float) $pricing['delivery_charge'];
            $gstAmount = (float) $pricing['gst_amount'];
            $platformFee = (float) $pricing['platform_fee'];
            $commissionPercentage = (float) (DB::table('vendors')->where('id', $restaurant->vendor_id)->value('commission_percentage') ?? 15);
            $commissionAmount = round(($subtotal - $discount) * ($commissionPercentage / 100), 2);
            $totalAmount = (float) $pricing['total_amount'];
            $orderNumber = 'FD'.now()->format('YmdHis').Str::upper(Str::random(6));

            $orderId = DB::table('orders')->insertGetId([
                'order_number' => $orderNumber,
                'user_id' => $this->userId(),
                'customer_id' => $this->userId(),
                'vendor_id' => $restaurant->vendor_id,
                'restaurant_id' => $restaurant->id,
                'delivery_partner_id' => null,
                'address_id' => $address->id,
                'coupon_id' => $coupon?->id,
                'status' => 'placed',
                'order_status' => 'placed',
                'payment_status' => 'pending',
                'subtotal' => $subtotal,
                'discount_amount' => $discount,
                'gst_amount' => $gstAmount,
                'delivery_fee' => $deliveryFee,
                'delivery_charge' => $deliveryFee,
                'platform_fee' => $platformFee,
                'commission_amount' => $commissionAmount,
                'total_amount' => $totalAmount,
                'coupon_code' => $coupon?->code,
                'customer_note' => $request->validated('customer_note'),
                'estimated_delivery_time' => ((int) $restaurant->delivery_time_minutes) + 20,
                'placed_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach ($items as $item) {
                $food = DB::table('food_items')->where('id', $item->food_item_id)->first();

                DB::table('order_items')->insert([
                    'order_id' => $orderId,
                    'food_item_id' => $item->food_item_id,
                    'item_name' => $food->name,
                    'unit_price' => $item->price,
                    'quantity' => $item->quantity,
                    'line_total' => $item->item_total,
                    'veg_type' => $food->veg_type ?? 'veg',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                if (isset($food->stock_qty)) {
                    DB::table('food_items')->where('id', $food->id)->update([
                        'stock_qty' => max(0, (int) $food->stock_qty - (int) $item->quantity),
                        'updated_at' => now(),
                    ]);
                }
            }

            DB::table('payments')->insert([
                'order_id' => $orderId,
                'payment_method' => 'COD',
                'amount' => $totalAmount,
                'payment_status' => 'pending',
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('admin_commissions')->insert([
                'order_id' => $orderId,
                'vendor_id' => $restaurant->vendor_id,
                'percentage' => $commissionPercentage,
                'amount' => $commissionAmount,
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            if ($coupon) {
                DB::table('coupons')->where('id', $coupon->id)->increment('used_count');
            }

            $this->clearCart($cart->id);
            $this->refreshOrderTimeline($orderId);

            $this->notifyUser($this->userId(), 'order_placed', 'Order placed', "Your order {$orderNumber} has been placed.", [
                'order_id' => $orderId,
            ]);

            $vendorUserId = DB::table('vendors')->where('id', $restaurant->vendor_id)->value('user_id');
            if ($vendorUserId) {
                $this->notifyUser((int) $vendorUserId, 'order_placed', 'New order received', "Order {$orderNumber} has been placed.", [
                    'order_id' => $orderId,
                ]);
            }

            $this->notifyUsersByRole('admin', 'order_placed', 'New order placed', "Order {$orderNumber} has been placed by a customer.", [
                'order_id' => $orderId,
            ]);

            return ApiResponse::success('Checkout completed.', [
                'order_id' => $orderId,
                'order_number' => $orderNumber,
                'payment_status' => 'pending',
                'order_status' => 'placed',
            ], 201);
        });
    }

    public function ordersIndex()
    {
        $orders = DB::table('orders')->where('user_id', $this->userId())->orderByDesc('id')->get();

        return ApiResponse::success('Orders loaded.', ['orders' => $orders]);
    }

    public function ordersShow(int $id)
    {
        $order = DB::table('orders')->where('id', $id)->where('user_id', $this->userId())->first();
        abort_if(! $order, 404, 'Order not found.');

        return ApiResponse::success('Order loaded.', [
            'order' => $this->orderPayload((int) $order->id),
            'items' => DB::table('order_items')->where('order_id', $id)->get(),
            'payment' => DB::table('payments')->where('order_id', $id)->first(),
            'assignment' => $this->assignmentPayload((int) $order->id),
            'timeline' => $this->orderTimeline($order),
        ]);
    }

    public function ordersTrack(int $id)
    {
        $order = DB::table('orders')->where('id', $id)->where('user_id', $this->userId())->first();
        abort_if(! $order, 404, 'Order not found.');

        return ApiResponse::success('Order tracking loaded.', [
            'order' => $this->orderPayload((int) $order->id),
            'timeline' => $this->orderTimeline($order),
            'assignment' => $this->assignmentPayload((int) $order->id),
        ]);
    }

    public function ordersCancel(int $id)
    {
        $order = DB::table('orders')->where('id', $id)->where('user_id', $this->userId())->first();
        abort_if(! $order, 404, 'Order not found.');
        abort_if($order->status !== 'placed', 422, 'Only placed orders can be cancelled.');

        DB::table('orders')->where('id', $id)->update([
            'status' => 'cancelled',
            'order_status' => 'cancelled',
            'cancelled_at' => now(),
            'cancellation_reason' => 'Cancelled by customer.',
            'updated_at' => now(),
        ]);

        app(DeliveryRequestService::class)->cancelRequestForOrder($id);

        DB::table('payments')->where('order_id', $id)->update([
            'payment_status' => $order->payment_status === 'paid' ? 'refunded' : 'pending',
            'status' => $order->payment_status === 'paid' ? 'refunded' : 'pending',
            'updated_at' => now(),
        ]);

        $this->notifyUser($this->userId(), 'cancelled', 'Order cancelled', "Your order {$order->order_number} was cancelled.", [
            'order_id' => $id,
        ]);

        $vendorUserId = DB::table('vendors')->where('id', $order->vendor_id)->value('user_id');
        if ($vendorUserId) {
            $this->notifyUser((int) $vendorUserId, 'cancelled', 'Order cancelled', "Order {$order->order_number} was cancelled by the customer.", [
                'order_id' => $id,
            ]);
        }

        $this->notifyUsersByRole('admin', 'cancelled', 'Order cancelled', "Order {$order->order_number} was cancelled.", [
            'order_id' => $id,
        ]);
        $this->refreshOrderTimeline($id);

        return ApiResponse::success('Order cancelled.');
    }

    public function ordersReorder(int $id)
    {
        $order = DB::table('orders')->where('id', $id)->where('user_id', $this->userId())->first();
        abort_if(! $order, 404, 'Order not found.');

        $items = DB::table('order_items')->where('order_id', $id)->get();
        abort_if($items->isEmpty(), 422, 'Order has no items.');

        $cart = $this->resolveCart(true, $order->restaurant_id);
        $this->clearCart($cart->id);
        DB::table('carts')->where('id', $cart->id)->update([
            'restaurant_id' => $order->restaurant_id,
            'updated_at' => now(),
        ]);

        foreach ($items as $item) {
            DB::table('cart_items')->insert([
                'cart_id' => $cart->id,
                'food_item_id' => $item->food_item_id,
                'quantity' => $item->quantity,
                'price' => $item->unit_price,
                'item_total' => $item->line_total,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->recalculateCart($cart->id);

        return ApiResponse::success('Order added back to cart.', [
            'cart' => $this->cartPayload($cart->id),
        ]);
    }

    public function ordersInvoice(int $id)
    {
        $order = DB::table('orders')->where('id', $id)->where('user_id', $this->userId())->first();
        abort_if(! $order, 404, 'Order not found.');

        return ApiResponse::success('Invoice loaded.', [
            'order' => $this->orderPayload((int) $order->id),
            'items' => DB::table('order_items')->where('order_id', $id)->get(),
            'payment' => DB::table('payments')->where('order_id', $id)->first(),
        ]);
    }

    public function reviewsStore(ReviewRequest $request)
    {
        $data = $request->validated();
        $order = DB::table('orders')->where('id', $data['order_id'])->where('user_id', $this->userId())->first();
        abort_if(! $order, 404, 'Order not found.');
        abort_if($order->status !== 'delivered', 422, 'Reviews are allowed only after delivery.');

        if (! empty($data['restaurant_id'])) {
            abort_if(DB::table('reviews')->where('order_id', $data['order_id'])->where('restaurant_id', $data['restaurant_id'])->exists(), 422, 'Restaurant review already exists for this order.');
        }
        if (! empty($data['food_item_id'])) {
            abort_if(DB::table('reviews')->where('order_id', $data['order_id'])->where('food_item_id', $data['food_item_id'])->exists(), 422, 'Food review already exists for this order.');
        }
        if (! empty($data['delivery_partner_id'])) {
            abort_if(DB::table('reviews')->where('order_id', $data['order_id'])->where('delivery_partner_id', $data['delivery_partner_id'])->exists(), 422, 'Delivery partner review already exists for this order.');
        }

        DB::table('reviews')->insert([
            'order_id' => $data['order_id'],
            'user_id' => $this->userId(),
            'restaurant_id' => $data['restaurant_id'] ?? null,
            'food_item_id' => $data['food_item_id'] ?? null,
            'delivery_partner_id' => $data['delivery_partner_id'] ?? null,
            'rating' => $data['rating'],
            'comment' => $data['comment'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->syncRatingsFromReviewTargets($data);

        return ApiResponse::success('Review submitted.', [], 201);
    }

    public function reviewsIndex()
    {
        return ApiResponse::success('Reviews loaded.', [
            'reviews' => DB::table('reviews')
                ->leftJoin('restaurants', 'restaurants.id', '=', 'reviews.restaurant_id')
                ->leftJoin('food_items', 'food_items.id', '=', 'reviews.food_item_id')
                ->leftJoin('delivery_partners', 'delivery_partners.id', '=', 'reviews.delivery_partner_id')
                ->select(
                    'reviews.*',
                    'restaurants.name as restaurant_name',
                    'food_items.name as food_name',
                    'delivery_partners.full_name as delivery_partner_name'
                )
                ->where('reviews.user_id', $this->userId())
                ->orderByDesc('reviews.id')
                ->get(),
        ]);
    }

    public function reviewsUpdate(ReviewRequest $request, int $id)
    {
        DB::table('reviews')
            ->where('id', $id)
            ->where('user_id', $this->userId())
            ->update([
                'rating' => $request->validated('rating'),
                'comment' => $request->validated('comment'),
                'restaurant_id' => $request->validated('restaurant_id'),
                'food_item_id' => $request->validated('food_item_id'),
                'delivery_partner_id' => $request->validated('delivery_partner_id'),
                'updated_at' => now(),
            ]);

        $this->syncRatingsFromReviewTargets([
            'restaurant_id' => $request->validated('restaurant_id'),
            'food_item_id' => $request->validated('food_item_id'),
            'delivery_partner_id' => $request->validated('delivery_partner_id'),
        ]);

        return ApiResponse::success('Review updated.');
    }

    public function reviewsDestroy(int $id)
    {
        $review = DB::table('reviews')->where('id', $id)->where('user_id', $this->userId())->first();
        abort_if(! $review, 404, 'Review not found.');
        DB::table('reviews')->where('id', $id)->where('user_id', $this->userId())->delete();
        $this->syncRatingsFromReviewTargets((array) $review);

        return ApiResponse::success('Review deleted.');
    }

    public function complaintsIndex()
    {
        return ApiResponse::success('Complaints loaded.', [
            'complaints' => DB::table('complaints')->where('user_id', $this->userId())->orderByDesc('id')->get(),
        ]);
    }

    public function complaintsStore(ComplaintRequest $request)
    {
        $data = $request->validated();
        DB::table('complaints')->insert([
            'order_id' => $data['order_id'] ?? null,
            'user_id' => $this->userId(),
            'subject' => $data['subject'],
            'description' => $data['description'],
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->notifyUsersByRole('admin', 'complaint_created', 'New complaint received', $data['subject'], [
            'order_id' => $data['order_id'] ?? null,
        ]);

        return ApiResponse::success('Complaint submitted.', [], 201);
    }

    private function resolveCart(bool $create = true, ?int $restaurantId = null): object
    {
        $cart = DB::table('carts')->where('user_id', $this->userId())->first();

        if (! $cart && $create) {
            $cartId = DB::table('carts')->insertGetId([
                'user_id' => $this->userId(),
                'restaurant_id' => $restaurantId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $cart = DB::table('carts')->where('id', $cartId)->first();
        }

        abort_if(! $cart, 404, 'Cart not found.');

        return $cart;
    }

    private function clearCart(int $cartId): void
    {
        DB::table('cart_items')->where('cart_id', $cartId)->delete();
        DB::table('carts')->where('id', $cartId)->update([
            'restaurant_id' => null,
            'coupon_code' => null,
            'coupon_discount' => 0,
            'total_amount' => 0,
            'updated_at' => now(),
        ]);
    }

    private function recalculateCart(int $cartId): void
    {
        $items = DB::table('cart_items')->where('cart_id', $cartId)->get();
        $subtotal = $items->sum('item_total');
        $cart = DB::table('carts')->where('id', $cartId)->first();
        $discount = $cart?->coupon_discount ?? 0;
        DB::table('carts')->where('id', $cartId)->update([
            'total_amount' => max(0, $subtotal - $discount),
            'updated_at' => now(),
        ]);
    }

    private function cartSubtotal(int $cartId): float
    {
        return (float) DB::table('cart_items')->where('cart_id', $cartId)->sum('item_total');
    }

    private function effectiveFoodPrice(object $food): float
    {
        return (float) ($food->discount_price ?: $food->price);
    }

    private function calculateDiscount(float $subtotal, object $coupon): float
    {
        if ($coupon->type === 'fixed') {
            return min((float) $coupon->value, $subtotal);
        }

        $discount = ($subtotal * ((float) $coupon->value / 100));

        if (! empty($coupon->max_discount_amount)) {
            $discount = min($discount, (float) $coupon->max_discount_amount);
        }

        return round($discount, 2);
    }

    private function cartPayload(int $cartId): array
    {
        $cart = DB::table('carts')->where('id', $cartId)->first();
        $items = DB::table('cart_items')
            ->join('food_items', 'food_items.id', '=', 'cart_items.food_item_id')
            ->join('restaurants', 'restaurants.id', '=', 'food_items.restaurant_id')
            ->select('cart_items.*', 'food_items.name as food_name', 'food_items.image as food_image', 'restaurants.name as restaurant_name')
            ->where('cart_items.cart_id', $cartId)
            ->get();

        $restaurant = $cart?->restaurant_id
            ? DB::table('restaurants')
                ->where('id', $cart->restaurant_id)
                ->select('id', 'name', 'area', 'delivery_fee', 'delivery_time_minutes', 'average_rating')
                ->first()
            : null;

        if (! $restaurant && $items->isNotEmpty()) {
            $restaurant = DB::table('restaurants')
                ->where('name', $items->first()->restaurant_name)
                ->select('id', 'name', 'area', 'delivery_fee', 'delivery_time_minutes', 'average_rating')
                ->first();
        }

        return [
            'cart' => $cart,
            'restaurant' => $restaurant,
            'items' => $items,
            'subtotal' => $this->cartSubtotal($cartId),
            'total' => $cart?->total_amount ?? 0,
            'summary' => $this->cartSummaryPayload($cartId, $restaurant),
        ];
    }

    private function cartSummaryPayload(int $cartId, ?object $restaurant = null): array
    {
        $cart = DB::table('carts')->where('id', $cartId)->first();
        $coupon = $cart?->coupon_code ? DB::table('coupons')->where('code', $cart->coupon_code)->first() : null;

        return (new PricingService())->quote($cartId, $restaurant ?? $this->restaurantForCart($cartId), $coupon) + [
            'coupon_code' => $cart?->coupon_code,
            'item_count' => DB::table('cart_items')->where('cart_id', $cartId)->count(),
        ];
    }

    private function restaurantForCart(int $cartId): ?object
    {
        $cart = DB::table('carts')->where('id', $cartId)->first();
        if (! $cart?->restaurant_id) {
            return null;
        }

        return DB::table('restaurants')->where('id', $cart->restaurant_id)->first();
    }

    private function orderPayload(int $orderId): ?object
    {
        $order = DB::table('orders')
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
                'restaurants.delivery_time_minutes',
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
            ->first();

        if ($order) {
            $timeline = $order->status_timeline ? json_decode((string) $order->status_timeline, true) : $this->orderTimeline($order);
            $order->status_timeline = is_array($timeline) ? $this->normalizeOrderTimeline($order, $timeline) : $this->orderTimeline($order);
        }

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

    private function syncRatingsFromReviewTargets(array $data): void
    {
        if (! empty($data['restaurant_id'])) {
            $restaurantId = (int) $data['restaurant_id'];
            $average = DB::table('reviews')->where('restaurant_id', $restaurantId)->avg('rating') ?? 0;
            DB::table('restaurants')->where('id', $restaurantId)->update(['average_rating' => round((float) $average, 2), 'updated_at' => now()]);
        }

        if (! empty($data['food_item_id'])) {
            $foodItemId = (int) $data['food_item_id'];
            $average = DB::table('reviews')->where('food_item_id', $foodItemId)->avg('rating') ?? 0;
            DB::table('food_items')->where('id', $foodItemId)->update(['rating_average' => round((float) $average, 2), 'updated_at' => now()]);
        }

        if (! empty($data['delivery_partner_id'])) {
            $deliveryPartnerId = (int) $data['delivery_partner_id'];
            $average = DB::table('reviews')->where('delivery_partner_id', $deliveryPartnerId)->avg('rating') ?? 0;
            DB::table('delivery_partners')->where('id', $deliveryPartnerId)->update(['rating_average' => round((float) $average, 2), 'updated_at' => now()]);
        }
    }

    private function orderTimeline(object $order): array
    {
        return $this->normalizeOrderTimeline($order, [
            ['status' => 'placed', 'at' => $order->placed_at],
            ['status' => 'accepted', 'at' => $order->accepted_at],
            ['status' => 'preparing', 'at' => $order->prepared_at],
            ['status' => 'ready', 'at' => $order->ready_at],
            ['status' => 'assigned', 'at' => $order->assigned_at],
            ['status' => 'picked_up', 'at' => $order->picked_up_at],
            ['status' => 'out_for_delivery', 'at' => $order->out_for_delivery_at],
            ['status' => 'delivered', 'at' => $order->delivered_at],
            ['status' => 'cancelled', 'at' => $order->cancelled_at],
        ]);
    }
}
