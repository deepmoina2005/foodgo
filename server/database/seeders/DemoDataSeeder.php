<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $timestamps = $this->timestamps();

        $users = $this->seedUsers($timestamps);
        $vendors = $this->seedVendors($timestamps, $users);
        $restaurants = $this->seedRestaurants($timestamps, $vendors);
        $categories = $this->seedCategories($timestamps);
        $foods = $this->seedFoods($timestamps, $restaurants, $categories);
        $coupons = $this->seedCoupons($timestamps);
        $partners = $this->seedDeliveryPartners($timestamps, $users);
        $addresses = $this->seedAddresses($timestamps, $users);

        $orders = $this->seedOrders($timestamps, [
            'customer_one' => $users['customer_one'],
            'customer_two' => $users['customer_two'],
            'vendor_one' => $vendors['vendor_one'],
            'vendor_two' => $vendors['vendor_two'],
            'restaurant_one' => $restaurants['restaurant_one'],
            'restaurant_two' => $restaurants['restaurant_two'],
            'foods' => $foods,
            'coupons' => $coupons,
            'addresses' => $addresses,
            'partners' => $partners,
        ]);

        $this->seedBanners($timestamps);
        $this->seedNotifications($users, $orders, $partners, $restaurants, $timestamps);
        $this->seedComplaints($users, $orders, $timestamps);
        $this->seedRestaurantDocuments($restaurants, $timestamps);
    }

    private function timestamps(): array
    {
        return [
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    private function seedUsers(array $timestamps): array
    {
        $users = [
            'admin' => [
                'email' => 'admin@fooddelivery.com',
                'name' => 'Admin',
                'phone' => '9000000001',
                'password' => Hash::make('Admin@123456'),
                'role' => 'admin',
                'account_status' => 'active',
            ],
            'customer_one' => [
                'email' => 'customer@example.com',
                'name' => 'Customer One',
                'phone' => '9000000011',
                'password' => Hash::make('Password@123'),
                'role' => 'customer',
                'account_status' => 'active',
            ],
            'customer_two' => [
                'email' => 'customer2@example.com',
                'name' => 'Customer Two',
                'phone' => '9000000012',
                'password' => Hash::make('Password@123'),
                'role' => 'customer',
                'account_status' => 'active',
            ],
            'vendor_one' => [
                'email' => 'vendor@example.com',
                'name' => 'Vendor One',
                'phone' => '9000000021',
                'password' => Hash::make('Password@123'),
                'role' => 'vendor',
                'account_status' => 'approved',
            ],
            'vendor_two' => [
                'email' => 'vendor2@example.com',
                'name' => 'Vendor Two',
                'phone' => '9000000022',
                'password' => Hash::make('Password@123'),
                'role' => 'vendor',
                'account_status' => 'approved',
            ],
            'vendor_three' => [
                'email' => 'vendor3@example.com',
                'name' => 'Vendor Pending',
                'phone' => '9000000023',
                'password' => Hash::make('Password@123'),
                'role' => 'vendor',
                'account_status' => 'pending',
            ],
            'delivery_one' => [
                'email' => 'delivery@example.com',
                'name' => 'Delivery One',
                'phone' => '9000000031',
                'password' => Hash::make('Password@123'),
                'role' => 'delivery_partner',
                'account_status' => 'active',
            ],
            'delivery_two' => [
                'email' => 'delivery2@example.com',
                'name' => 'Delivery Two',
                'phone' => '9000000032',
                'password' => Hash::make('Password@123'),
                'role' => 'delivery_partner',
                'account_status' => 'active',
            ],
            'delivery_three' => [
                'email' => 'delivery3@example.com',
                'name' => 'Delivery Pending',
                'phone' => '9000000033',
                'password' => Hash::make('Password@123'),
                'role' => 'delivery_partner',
                'account_status' => 'pending',
            ],
        ];

        foreach ($users as $user) {
            DB::table('users')->updateOrInsert(
                ['email' => $user['email']],
                array_merge($user, $timestamps)
            );
        }

        $ids = [];
        foreach ($users as $key => $user) {
            $ids[$key] = (int) DB::table('users')->where('email', $user['email'])->value('id');
        }

        return $ids;
    }

    private function seedVendors(array $timestamps, array $users): array
    {
        $vendors = [
            'vendor_one' => [
                'user_id' => $users['vendor_one'],
                'store_name' => 'Spice Route Kitchen',
                'gst_number' => 'GSTIN12345',
                'license_number' => 'LIC98765',
                'bank_name' => 'Demo Bank',
                'bank_account_number' => '1234567890',
                'bank_ifsc' => 'DEMO0001',
                'status' => 'approved',
                'documents_verified' => true,
                'commission_percentage' => 15,
            ],
            'vendor_two' => [
                'user_id' => $users['vendor_two'],
                'store_name' => 'Urban Bites',
                'gst_number' => 'GSTIN54321',
                'license_number' => 'LIC12345',
                'bank_name' => 'City Bank',
                'bank_account_number' => '9876543210',
                'bank_ifsc' => 'CITY0002',
                'status' => 'approved',
                'documents_verified' => true,
                'commission_percentage' => 12,
            ],
            'vendor_three' => [
                'user_id' => $users['vendor_three'],
                'store_name' => 'Tandoori Trails',
                'gst_number' => 'GSTIN77777',
                'license_number' => 'LIC77777',
                'bank_name' => 'Pending Bank',
                'bank_account_number' => '7777777777',
                'bank_ifsc' => 'PEND0003',
                'status' => 'pending',
                'documents_verified' => false,
                'commission_percentage' => 15,
            ],
        ];

        foreach ($vendors as $vendor) {
            DB::table('vendors')->updateOrInsert(
                ['user_id' => $vendor['user_id']],
                array_merge($vendor, $timestamps)
            );
        }

        return [
            'vendor_one' => (int) DB::table('vendors')->where('user_id', $users['vendor_one'])->value('id'),
            'vendor_two' => (int) DB::table('vendors')->where('user_id', $users['vendor_two'])->value('id'),
            'vendor_three' => (int) DB::table('vendors')->where('user_id', $users['vendor_three'])->value('id'),
        ];
    }

    private function seedRestaurants(array $timestamps, array $vendors): array
    {
        $restaurants = [
            'restaurant_one' => [
                'vendor_id' => $vendors['vendor_one'],
                'name' => 'Spice Route Kitchen',
                'slug' => 'spice-route-kitchen',
                'description' => 'A demo multi-cuisine restaurant for testing the platform.',
                'cuisine' => 'North Indian, Chinese',
                'city' => 'Mumbai',
                'area' => 'Downtown',
                'address_line' => '12 Market Street, Downtown',
                'latitude' => 19.0760000,
                'longitude' => 72.8777000,
                'min_order_value' => 199,
                'delivery_fee' => 29,
                'average_rating' => 4.6,
                'delivery_time_minutes' => 35,
                'status' => 'active',
            ],
            'restaurant_two' => [
                'vendor_id' => $vendors['vendor_two'],
                'name' => 'Urban Bites',
                'slug' => 'urban-bites',
                'description' => 'Second demo restaurant for multi-vendor testing.',
                'cuisine' => 'Burgers, Wraps, Fast Food',
                'city' => 'Mumbai',
                'area' => 'Midtown',
                'address_line' => '88 Central Avenue, Midtown',
                'latitude' => 19.0820000,
                'longitude' => 72.8842000,
                'min_order_value' => 149,
                'delivery_fee' => 19,
                'average_rating' => 4.3,
                'delivery_time_minutes' => 28,
                'status' => 'active',
            ],
        ];

        foreach ($restaurants as $restaurant) {
            DB::table('restaurants')->updateOrInsert(
                ['slug' => $restaurant['slug']],
                array_merge($restaurant, $timestamps)
            );
        }

        return [
            'restaurant_one' => (int) DB::table('restaurants')->where('slug', 'spice-route-kitchen')->value('id'),
            'restaurant_two' => (int) DB::table('restaurants')->where('slug', 'urban-bites')->value('id'),
        ];
    }

    private function seedCategories(array $timestamps): array
    {
        $categories = [
            ['name' => 'Biryani', 'slug' => 'biryani'],
            ['name' => 'Pizza', 'slug' => 'pizza'],
            ['name' => 'Dessert', 'slug' => 'dessert'],
            ['name' => 'Beverages', 'slug' => 'beverages'],
            ['name' => 'Burgers', 'slug' => 'burgers'],
            ['name' => 'Wraps', 'slug' => 'wraps'],
        ];

        foreach ($categories as $category) {
            DB::table('categories')->updateOrInsert(
                ['slug' => $category['slug']],
                array_merge($category, ['is_active' => true], $timestamps)
            );
        }

        return [
            'biryani' => (int) DB::table('categories')->where('slug', 'biryani')->value('id'),
            'pizza' => (int) DB::table('categories')->where('slug', 'pizza')->value('id'),
            'dessert' => (int) DB::table('categories')->where('slug', 'dessert')->value('id'),
            'beverages' => (int) DB::table('categories')->where('slug', 'beverages')->value('id'),
            'burgers' => (int) DB::table('categories')->where('slug', 'burgers')->value('id'),
            'wraps' => (int) DB::table('categories')->where('slug', 'wraps')->value('id'),
        ];
    }

    private function seedFoods(array $timestamps, array $restaurants, array $categories): array
    {
        $foods = [
            ['restaurant_key' => 'restaurant_one', 'category_key' => 'biryani', 'name' => 'Hyderabadi Chicken Biryani', 'slug' => 'hyderabadi-chicken-biryani', 'price' => 249, 'discount_price' => 219, 'veg_type' => 'non_veg', 'today_special' => true, 'best_seller' => true, 'prep_time_minutes' => 25],
            ['restaurant_key' => 'restaurant_one', 'category_key' => 'pizza', 'name' => 'Margherita Pizza', 'slug' => 'margherita-pizza', 'price' => 199, 'discount_price' => 179, 'veg_type' => 'veg', 'today_special' => false, 'best_seller' => true, 'prep_time_minutes' => 20],
            ['restaurant_key' => 'restaurant_one', 'category_key' => 'dessert', 'name' => 'Chocolate Brownie', 'slug' => 'chocolate-brownie', 'price' => 129, 'discount_price' => 109, 'veg_type' => 'veg', 'today_special' => false, 'best_seller' => false, 'prep_time_minutes' => 15],
            ['restaurant_key' => 'restaurant_one', 'category_key' => 'beverages', 'name' => 'Fresh Lime Soda', 'slug' => 'fresh-lime-soda', 'price' => 69, 'discount_price' => 59, 'veg_type' => 'veg', 'today_special' => false, 'best_seller' => false, 'prep_time_minutes' => 10],
            ['restaurant_key' => 'restaurant_two', 'category_key' => 'burgers', 'name' => 'Classic Chicken Burger', 'slug' => 'classic-chicken-burger', 'price' => 189, 'discount_price' => 169, 'veg_type' => 'non_veg', 'today_special' => true, 'best_seller' => true, 'prep_time_minutes' => 18],
            ['restaurant_key' => 'restaurant_two', 'category_key' => 'wraps', 'name' => 'Paneer Wrap', 'slug' => 'paneer-wrap', 'price' => 149, 'discount_price' => 139, 'veg_type' => 'veg', 'today_special' => false, 'best_seller' => true, 'prep_time_minutes' => 16],
            ['restaurant_key' => 'restaurant_two', 'category_key' => 'beverages', 'name' => 'Cold Coffee', 'slug' => 'cold-coffee', 'price' => 99, 'discount_price' => 89, 'veg_type' => 'veg', 'today_special' => false, 'best_seller' => false, 'prep_time_minutes' => 8],
        ];

        foreach ($foods as $food) {
            $payload = [
                'restaurant_id' => $restaurants[$food['restaurant_key']],
                'category_id' => $categories[$food['category_key']],
                'name' => $food['name'],
                'slug' => $food['slug'],
                'description' => 'Demo food item used for testing.',
                'price' => $food['price'],
                'discount_price' => $food['discount_price'],
                'veg_type' => $food['veg_type'],
                'stock_qty' => 100,
                'stock_enabled' => true,
                'today_special' => $food['today_special'],
                'best_seller' => $food['best_seller'],
                'prep_time_minutes' => $food['prep_time_minutes'],
                'image' => null,
                'is_active' => true,
                'rating_average' => 4.5,
                'popularity_score' => 100,
            ];

            DB::table('food_items')->updateOrInsert(
                ['slug' => $food['slug']],
                array_merge($payload, $timestamps)
            );
        }

        return [
            'hyderabadi-chicken-biryani' => (int) DB::table('food_items')->where('slug', 'hyderabadi-chicken-biryani')->value('id'),
            'margherita-pizza' => (int) DB::table('food_items')->where('slug', 'margherita-pizza')->value('id'),
            'chocolate-brownie' => (int) DB::table('food_items')->where('slug', 'chocolate-brownie')->value('id'),
            'fresh-lime-soda' => (int) DB::table('food_items')->where('slug', 'fresh-lime-soda')->value('id'),
            'classic-chicken-burger' => (int) DB::table('food_items')->where('slug', 'classic-chicken-burger')->value('id'),
            'paneer-wrap' => (int) DB::table('food_items')->where('slug', 'paneer-wrap')->value('id'),
            'cold-coffee' => (int) DB::table('food_items')->where('slug', 'cold-coffee')->value('id'),
        ];
    }

    private function seedCoupons(array $timestamps): array
    {
        $coupons = [
            ['code' => 'WELCOME10', 'title' => '10% off on first order', 'type' => 'percent', 'value' => 10, 'min_order_amount' => 150, 'max_discount_amount' => 50, 'usage_limit' => 100, 'is_active' => true],
            ['code' => 'FLAT50', 'title' => 'Flat 50 off', 'type' => 'fixed', 'value' => 50, 'min_order_amount' => 300, 'max_discount_amount' => null, 'usage_limit' => 50, 'is_active' => true],
            ['code' => 'FREESHIP', 'title' => 'Free delivery', 'type' => 'fixed', 'value' => 29, 'min_order_amount' => 250, 'max_discount_amount' => 29, 'usage_limit' => 25, 'is_active' => true],
        ];

        foreach ($coupons as $coupon) {
            DB::table('coupons')->updateOrInsert(
                ['code' => $coupon['code']],
                array_merge($coupon, $timestamps)
            );
        }

        return [
            'WELCOME10' => (int) DB::table('coupons')->where('code', 'WELCOME10')->value('id'),
            'FLAT50' => (int) DB::table('coupons')->where('code', 'FLAT50')->value('id'),
            'FREESHIP' => (int) DB::table('coupons')->where('code', 'FREESHIP')->value('id'),
        ];
    }

    private function seedDeliveryPartners(array $timestamps, array $users): array
    {
        $partners = [
            'delivery_one' => [
                'user_id' => $users['delivery_one'],
                'full_name' => 'Delivery One',
                'phone' => '9000000031',
                'vehicle_type' => 'Bike',
                'city' => 'Mumbai',
                'area' => 'Downtown',
                'latitude' => 19.0763000,
                'longitude' => 72.8781000,
                'kyc_status' => 'approved',
                'status' => 'approved',
                'is_available' => 0,
                'current_order_id' => null,
                'rating_average' => 4.8,
                'earnings_balance' => 150,
            ],
            'delivery_two' => [
                'user_id' => $users['delivery_two'],
                'full_name' => 'Delivery Two',
                'phone' => '9000000032',
                'vehicle_type' => 'Scooter',
                'city' => 'Mumbai',
                'area' => 'Downtown',
                'latitude' => 19.0779000,
                'longitude' => 72.8800000,
                'kyc_status' => 'approved',
                'status' => 'approved',
                'is_available' => 1,
                'current_order_id' => null,
                'rating_average' => 4.6,
                'earnings_balance' => 0,
            ],
            'delivery_three' => [
                'user_id' => $users['delivery_three'],
                'full_name' => 'Delivery Pending',
                'phone' => '9000000033',
                'vehicle_type' => 'Bike',
                'city' => 'Mumbai',
                'area' => 'Midtown',
                'latitude' => 19.0830000,
                'longitude' => 72.8860000,
                'kyc_status' => 'approved',
                'status' => 'approved',
                'is_available' => 1,
                'current_order_id' => null,
                'rating_average' => 4.4,
                'earnings_balance' => 0,
            ],
        ];

        foreach ($partners as $partner) {
            DB::table('delivery_partners')->updateOrInsert(
                ['user_id' => $partner['user_id']],
                array_merge($partner, $timestamps)
            );
        }

        return [
            'delivery_one' => (int) DB::table('delivery_partners')->where('user_id', $users['delivery_one'])->value('id'),
            'delivery_two' => (int) DB::table('delivery_partners')->where('user_id', $users['delivery_two'])->value('id'),
            'delivery_three' => (int) DB::table('delivery_partners')->where('user_id', $users['delivery_three'])->value('id'),
        ];
    }

    private function seedAddresses(array $timestamps, array $users): array
    {
        $addresses = [
            [
                'user_id' => $users['customer_one'],
                'label' => 'Home',
                'name' => 'Customer One',
                'phone' => '9000000011',
                'line1' => '221B Baker Street',
                'line2' => 'Apt 12',
                'city' => 'Mumbai',
                'state' => 'Maharashtra',
                'postal_code' => '400001',
                'area' => 'Downtown',
                'landmark' => 'Near Central Park',
                'is_default' => true,
            ],
            [
                'user_id' => $users['customer_one'],
                'label' => 'Office',
                'name' => 'Customer One',
                'phone' => '9000000011',
                'line1' => '44 Commerce Tower',
                'line2' => null,
                'city' => 'Mumbai',
                'state' => 'Maharashtra',
                'postal_code' => '400002',
                'area' => 'Midtown',
                'landmark' => 'Opposite Metro Station',
                'is_default' => false,
            ],
            [
                'user_id' => $users['customer_two'],
                'label' => 'Home',
                'name' => 'Customer Two',
                'phone' => '9000000012',
                'line1' => '77 Lake View Road',
                'line2' => null,
                'city' => 'Mumbai',
                'state' => 'Maharashtra',
                'postal_code' => '400003',
                'area' => 'Downtown',
                'landmark' => 'Near Lake Garden',
                'is_default' => true,
            ],
        ];

        foreach ($addresses as $address) {
            DB::table('addresses')->updateOrInsert(
                ['user_id' => $address['user_id'], 'label' => $address['label']],
                array_merge($address, $timestamps)
            );
        }

        return [
            'customer_one_home' => (int) DB::table('addresses')->where('user_id', $users['customer_one'])->where('label', 'Home')->value('id'),
            'customer_one_office' => (int) DB::table('addresses')->where('user_id', $users['customer_one'])->where('label', 'Office')->value('id'),
            'customer_two_home' => (int) DB::table('addresses')->where('user_id', $users['customer_two'])->where('label', 'Home')->value('id'),
        ];
    }

    private function seedOrders(array $timestamps, array $context): array
    {
        $now = now();

        $orders = [
            [
                'order_number' => 'FDDEMO1001',
                'user_id' => $context['customer_one'],
                'customer_id' => $context['customer_one'],
                'vendor_id' => $context['vendor_one'],
                'restaurant_id' => $context['restaurant_one'],
                'address_id' => $context['addresses']['customer_one_home'],
                'coupon_id' => $context['coupons']['WELCOME10'],
                'coupon_code' => 'WELCOME10',
                'status' => 'placed',
                'order_status' => 'placed',
                'payment_status' => 'pending',
                'customer_note' => 'Call on arrival.',
                'vendor_note' => null,
                'delivery_note' => 'Leave at the gate.',
                'placed_at' => $now->copy()->subDays(3),
            ],
            [
                'order_number' => 'FDDEMO1002',
                'user_id' => $context['customer_one'],
                'customer_id' => $context['customer_one'],
                'vendor_id' => $context['vendor_one'],
                'restaurant_id' => $context['restaurant_one'],
                'address_id' => $context['addresses']['customer_one_office'],
                'coupon_id' => null,
                'coupon_code' => null,
                'status' => 'preparing',
                'order_status' => 'preparing',
                'payment_status' => 'pending',
                'customer_note' => 'Please keep extra chutney.',
                'vendor_note' => 'Pack separately.',
                'delivery_note' => null,
                'placed_at' => $now->copy()->subDays(2),
                'accepted_at' => $now->copy()->subDays(2)->addMinutes(10),
                'prepared_at' => $now->copy()->subDays(2)->addMinutes(25),
            ],
            [
                'order_number' => 'FDDEMO1003',
                'user_id' => $context['customer_one'],
                'customer_id' => $context['customer_one'],
                'vendor_id' => $context['vendor_one'],
                'restaurant_id' => $context['restaurant_one'],
                'address_id' => $context['addresses']['customer_one_home'],
                'coupon_id' => $context['coupons']['FREESHIP'],
                'coupon_code' => 'FREESHIP',
                'status' => 'accepted',
                'order_status' => 'accepted',
                'payment_status' => 'pending',
                'customer_note' => 'Accepted order for pickup request testing.',
                'vendor_note' => 'Send with cutlery.',
                'delivery_note' => 'Call if address is unclear.',
                'placed_at' => $now->copy()->subHours(10),
                'accepted_at' => $now->copy()->subHours(9),
                'prepared_at' => $now->copy()->subHours(8),
            ],
            [
                'order_number' => 'FDDEMO1004',
                'user_id' => $context['customer_two'],
                'customer_id' => $context['customer_two'],
                'vendor_id' => $context['vendor_one'],
                'restaurant_id' => $context['restaurant_one'],
                'address_id' => $context['addresses']['customer_two_home'],
                'coupon_id' => null,
                'coupon_code' => null,
                'status' => 'assigned',
                'order_status' => 'assigned',
                'payment_status' => 'pending',
                'customer_note' => 'Need it quickly.',
                'vendor_note' => null,
                'delivery_note' => 'Knock twice.',
                'placed_at' => $now->copy()->subHours(6),
                'accepted_at' => $now->copy()->subHours(5),
                'prepared_at' => $now->copy()->subHours(4),
                'ready_at' => $now->copy()->subHours(3),
                'assigned_at' => $now->copy()->subHours(2),
            ],
            [
                'order_number' => 'FDDEMO1005',
                'user_id' => $context['customer_two'],
                'customer_id' => $context['customer_two'],
                'vendor_id' => $context['vendor_one'],
                'restaurant_id' => $context['restaurant_one'],
                'address_id' => $context['addresses']['customer_two_home'],
                'coupon_id' => null,
                'coupon_code' => null,
                'status' => 'delivered',
                'order_status' => 'delivered',
                'payment_status' => 'paid',
                'customer_note' => 'Delivered order for history testing.',
                'vendor_note' => null,
                'delivery_note' => null,
                'placed_at' => $now->copy()->subDays(1),
                'accepted_at' => $now->copy()->subDays(1)->addMinutes(10),
                'prepared_at' => $now->copy()->subDays(1)->addMinutes(35),
                'ready_at' => $now->copy()->subDays(1)->addMinutes(50),
                'assigned_at' => $now->copy()->subDays(1)->addMinutes(55),
                'picked_up_at' => $now->copy()->subDays(1)->addMinutes(70),
                'out_for_delivery_at' => $now->copy()->subDays(1)->addMinutes(80),
                'delivered_at' => $now->copy()->subDays(1)->addMinutes(100),
            ],
            [
                'order_number' => 'FDDEMO1006',
                'user_id' => $context['customer_two'],
                'customer_id' => $context['customer_two'],
                'vendor_id' => $context['vendor_two'],
                'restaurant_id' => $context['restaurant_two'],
                'address_id' => $context['addresses']['customer_two_home'],
                'coupon_id' => null,
                'coupon_code' => null,
                'status' => 'cancelled',
                'order_status' => 'cancelled',
                'payment_status' => 'pending',
                'customer_note' => 'Cancelled test order.',
                'vendor_note' => null,
                'delivery_note' => null,
                'placed_at' => $now->copy()->subDays(2),
                'accepted_at' => null,
                'cancelled_at' => $now->copy()->subDays(2)->addMinutes(15),
                'cancellation_reason' => 'Customer changed their mind.',
            ],
            [
                'order_number' => 'FDDEMO1007',
                'user_id' => $context['customer_one'],
                'customer_id' => $context['customer_one'],
                'vendor_id' => $context['vendor_two'],
                'restaurant_id' => $context['restaurant_two'],
                'address_id' => $context['addresses']['customer_one_home'],
                'coupon_id' => null,
                'coupon_code' => null,
                'status' => 'placed',
                'order_status' => 'placed',
                'payment_status' => 'pending',
                'customer_note' => 'Second vendor demo order.',
                'vendor_note' => null,
                'delivery_note' => null,
                'placed_at' => $now->copy()->subHours(4),
            ],
        ];

        $orderItems = [
            'FDDEMO1001' => [
                ['food_item_id' => $context['foods']['hyderabadi-chicken-biryani'], 'item_name' => 'Hyderabadi Chicken Biryani', 'unit_price' => 219, 'quantity' => 1, 'veg_type' => 'non_veg'],
                ['food_item_id' => $context['foods']['fresh-lime-soda'], 'item_name' => 'Fresh Lime Soda', 'unit_price' => 59, 'quantity' => 2, 'veg_type' => 'veg'],
            ],
            'FDDEMO1002' => [
                ['food_item_id' => $context['foods']['margherita-pizza'], 'item_name' => 'Margherita Pizza', 'unit_price' => 179, 'quantity' => 1, 'veg_type' => 'veg'],
                ['food_item_id' => $context['foods']['chocolate-brownie'], 'item_name' => 'Chocolate Brownie', 'unit_price' => 109, 'quantity' => 1, 'veg_type' => 'veg'],
            ],
            'FDDEMO1003' => [
                ['food_item_id' => $context['foods']['hyderabadi-chicken-biryani'], 'item_name' => 'Hyderabadi Chicken Biryani', 'unit_price' => 219, 'quantity' => 1, 'veg_type' => 'non_veg'],
                ['food_item_id' => $context['foods']['chocolate-brownie'], 'item_name' => 'Chocolate Brownie', 'unit_price' => 109, 'quantity' => 1, 'veg_type' => 'veg'],
            ],
            'FDDEMO1004' => [
                ['food_item_id' => $context['foods']['margherita-pizza'], 'item_name' => 'Margherita Pizza', 'unit_price' => 179, 'quantity' => 2, 'veg_type' => 'veg'],
            ],
            'FDDEMO1005' => [
                ['food_item_id' => $context['foods']['chocolate-brownie'], 'item_name' => 'Chocolate Brownie', 'unit_price' => 109, 'quantity' => 2, 'veg_type' => 'veg'],
                ['food_item_id' => $context['foods']['fresh-lime-soda'], 'item_name' => 'Fresh Lime Soda', 'unit_price' => 59, 'quantity' => 2, 'veg_type' => 'veg'],
            ],
            'FDDEMO1006' => [
                ['food_item_id' => $context['foods']['classic-chicken-burger'], 'item_name' => 'Classic Chicken Burger', 'unit_price' => 169, 'quantity' => 1, 'veg_type' => 'non_veg'],
            ],
            'FDDEMO1007' => [
                ['food_item_id' => $context['foods']['classic-chicken-burger'], 'item_name' => 'Classic Chicken Burger', 'unit_price' => 169, 'quantity' => 1, 'veg_type' => 'non_veg'],
                ['food_item_id' => $context['foods']['cold-coffee'], 'item_name' => 'Cold Coffee', 'unit_price' => 89, 'quantity' => 1, 'veg_type' => 'veg'],
            ],
        ];

        $assignments = [
            'FDDEMO1004' => [
                'delivery_partner_id' => $context['partners']['delivery_one'],
                'status' => 'accepted',
                'assigned_at' => $now->copy()->subHours(2),
                'accepted_at' => $now->copy()->subHours(2),
            ],
            'FDDEMO1005' => [
                'delivery_partner_id' => $context['partners']['delivery_two'],
                'status' => 'delivered',
                'assigned_at' => $now->copy()->subDays(1)->addMinutes(55),
                'accepted_at' => $now->copy()->subDays(1)->addMinutes(60),
                'picked_up_at' => $now->copy()->subDays(1)->addMinutes(70),
                'delivered_at' => $now->copy()->subDays(1)->addMinutes(100),
            ],
        ];

        $deliveryRequests = [
            'FDDEMO1003' => [
                'status' => 'open',
                'accepted_by_delivery_partner_id' => null,
                'accepted_at' => null,
                'expires_at' => $now->copy()->addHours(8),
            ],
            'FDDEMO1004' => [
                'status' => 'accepted',
                'accepted_by_delivery_partner_id' => $context['partners']['delivery_one'],
                'accepted_at' => $now->copy()->subHours(2),
                'expires_at' => $now->copy()->addHours(6),
            ],
            'FDDEMO1005' => [
                'status' => 'accepted',
                'accepted_by_delivery_partner_id' => $context['partners']['delivery_two'],
                'accepted_at' => $now->copy()->subDays(1)->addMinutes(60),
                'expires_at' => $now->copy()->subDays(1)->addHours(6),
            ],
        ];

        $ordersByNumber = [];

        foreach ($orders as $order) {
            $items = $orderItems[$order['order_number']] ?? [];
            $assignment = $assignments[$order['order_number']] ?? null;

            $subtotal = 0;
            foreach ($items as $item) {
                $subtotal += ((float) $item['unit_price']) * ((int) $item['quantity']);
            }

            $discountAmount = $order['coupon_code'] === 'WELCOME10'
                ? round(min($subtotal * 0.1, 50), 2)
                : ($order['coupon_code'] === 'FREESHIP' ? 29.0 : 0.0);
            $deliveryFee = $order['vendor_id'] === $context['vendor_two'] ? 19.0 : 29.0;
            $gstAmount = round(max(0, $subtotal - $discountAmount) * 0.05, 2);
            $platformFee = 0.0;
            $commissionRate = (float) (DB::table('vendors')->where('id', $order['vendor_id'])->value('commission_percentage') ?? 15);
            $commissionAmount = round(($subtotal - $discountAmount) * ($commissionRate / 100), 2);
            $totalAmount = round($subtotal - $discountAmount + $deliveryFee + $gstAmount + $platformFee, 2);

            $statusTimeline = $this->buildTimeline([
                'placed' => ($order['placed_at'] ?? null)?->toDateTimeString(),
                'accepted' => ($order['accepted_at'] ?? null)?->toDateTimeString(),
                'preparing' => ($order['prepared_at'] ?? null)?->toDateTimeString(),
                'ready' => ($order['ready_at'] ?? null)?->toDateTimeString(),
                'assigned' => ($order['assigned_at'] ?? null)?->toDateTimeString(),
                'picked_up' => ($order['picked_up_at'] ?? null)?->toDateTimeString(),
                'out_for_delivery' => ($order['out_for_delivery_at'] ?? null)?->toDateTimeString(),
                'delivered' => ($order['delivered_at'] ?? null)?->toDateTimeString(),
                'cancelled' => ($order['cancelled_at'] ?? null)?->toDateTimeString(),
            ]);

            DB::table('orders')->updateOrInsert(
                ['order_number' => $order['order_number']],
                array_merge([
                    'user_id' => $order['user_id'],
                    'customer_id' => $order['customer_id'],
                    'vendor_id' => $order['vendor_id'],
                    'restaurant_id' => $order['restaurant_id'],
                    'address_id' => $order['address_id'],
                    'delivery_partner_id' => $assignment['delivery_partner_id'] ?? null,
                    'coupon_id' => $order['coupon_id'],
                    'status' => $order['status'],
                    'order_status' => $order['order_status'],
                    'payment_status' => $order['payment_status'],
                    'subtotal' => $subtotal,
                    'discount_amount' => $discountAmount,
                    'gst_amount' => $gstAmount,
                    'delivery_fee' => $deliveryFee,
                    'delivery_charge' => $deliveryFee,
                    'platform_fee' => $platformFee,
                    'commission_amount' => $commissionAmount,
                    'total_amount' => $totalAmount,
                    'coupon_code' => $order['coupon_code'],
                    'customer_note' => $order['customer_note'],
                    'vendor_note' => $order['vendor_note'],
                    'delivery_note' => $order['delivery_note'],
                    'placed_at' => $order['placed_at'],
                    'accepted_at' => $order['accepted_at'] ?? null,
                    'prepared_at' => $order['prepared_at'] ?? null,
                    'ready_at' => $order['ready_at'] ?? null,
                    'assigned_at' => $order['assigned_at'] ?? null,
                    'picked_up_at' => $order['picked_up_at'] ?? null,
                    'out_for_delivery_at' => $order['out_for_delivery_at'] ?? null,
                    'delivered_at' => $order['delivered_at'] ?? null,
                    'cancelled_at' => $order['cancelled_at'] ?? null,
                    'cancellation_reason' => $order['cancellation_reason'] ?? null,
                    'status_timeline' => $statusTimeline,
                    'estimated_delivery_time' => $order['estimated_delivery_time'] ?? 45,
                ], $timestamps)
            );

            $orderId = (int) DB::table('orders')->where('order_number', $order['order_number'])->value('id');
            $ordersByNumber[$order['order_number']] = $orderId;

            DB::table('order_items')->where('order_id', $orderId)->delete();
            DB::table('payments')->where('order_id', $orderId)->delete();
            DB::table('delivery_assignments')->where('order_id', $orderId)->delete();
            DB::table('admin_commissions')->where('order_id', $orderId)->delete();
            DB::table('vendor_payouts')->where('order_id', $orderId)->delete();
            DB::table('refunds')->where('order_id', $orderId)->delete();
            DB::table('reviews')->where('order_id', $orderId)->delete();

            foreach ($items as $item) {
                DB::table('order_items')->insert([
                    'order_id' => $orderId,
                    'food_item_id' => $item['food_item_id'],
                    'item_name' => $item['item_name'],
                    'unit_price' => $item['unit_price'],
                    'quantity' => $item['quantity'],
                    'line_total' => round(((float) $item['unit_price']) * ((int) $item['quantity']), 2),
                    'veg_type' => $item['veg_type'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            DB::table('payments')->insert([
                'order_id' => $orderId,
                'payment_method' => 'COD',
                'amount' => $totalAmount,
                'payment_status' => $order['payment_status'],
                'status' => $order['payment_status'],
                'paid_at' => $order['payment_status'] === 'paid' ? $order['delivered_at'] : null,
                'reference_no' => $order['payment_status'] === 'paid' ? 'COD-'.$order['order_number'] : null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            DB::table('admin_commissions')->insert([
                'order_id' => $orderId,
                'vendor_id' => $order['vendor_id'],
                'percentage' => $commissionRate,
                'amount' => $commissionAmount,
                'status' => $order['status'] === 'delivered' ? 'paid' : ($order['status'] === 'cancelled' ? 'cancelled' : 'pending'),
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            if ($assignment) {
                DB::table('delivery_assignments')->insert([
                    'order_id' => $orderId,
                    'delivery_partner_id' => $assignment['delivery_partner_id'],
                    'assigned_by' => null,
                    'status' => $assignment['status'],
                    'assigned_at' => $assignment['assigned_at'] ?? $now,
                    'accepted_at' => $assignment['accepted_at'] ?? null,
                    'picked_up_at' => $assignment['picked_up_at'] ?? null,
                    'delivered_at' => $assignment['delivered_at'] ?? null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                DB::table('delivery_partners')->where('id', $assignment['delivery_partner_id'])->update([
                    'is_available' => $order['status'] === 'delivered' ? 1 : 0,
                    'current_order_id' => $order['status'] === 'delivered' ? null : $orderId,
                    'updated_at' => $now,
                ]);
            }

            if (isset($deliveryRequests[$order['order_number']])) {
                $deliveryRequest = $deliveryRequests[$order['order_number']];
                DB::table('delivery_requests')->updateOrInsert(
                    ['order_id' => $orderId],
                    [
                        'order_id' => $orderId,
                        'restaurant_id' => $order['restaurant_id'],
                        'city' => DB::table('restaurants')->where('id', $order['restaurant_id'])->value('city'),
                        'area' => DB::table('restaurants')->where('id', $order['restaurant_id'])->value('area'),
                        'status' => $deliveryRequest['status'],
                        'accepted_by_delivery_partner_id' => $deliveryRequest['accepted_by_delivery_partner_id'],
                        'accepted_at' => $deliveryRequest['accepted_at'],
                        'expires_at' => $deliveryRequest['expires_at'],
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]
                );
            }

            if ($order['status'] === 'delivered') {
                DB::table('vendor_payouts')->insert([
                    'vendor_id' => $order['vendor_id'],
                    'order_id' => $orderId,
                    'amount' => round($totalAmount - $commissionAmount, 2),
                    'commission_amount' => $commissionAmount,
                    'payout_status' => 'pending',
                    'remarks' => 'Demo payout generated from delivered order.',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                $restaurantId = $order['restaurant_id'];
                $foodIds = array_column($items, 'food_item_id');
                $ratingTargets = [
                    [
                        'user_id' => $order['user_id'],
                        'restaurant_id' => $restaurantId,
                        'food_item_id' => $foodIds[0] ?? null,
                        'vendor_id' => $order['vendor_id'],
                        'delivery_partner_id' => $assignment['delivery_partner_id'] ?? null,
                        'rating' => 5,
                        'comment' => 'Great demo order and quick delivery.',
                    ],
                    [
                        'user_id' => $order['user_id'],
                        'restaurant_id' => $restaurantId,
                        'food_item_id' => null,
                        'vendor_id' => $order['vendor_id'],
                        'delivery_partner_id' => null,
                        'rating' => 4,
                        'comment' => 'Food quality was good for testing.',
                    ],
                ];

                foreach ($ratingTargets as $review) {
                    DB::table('reviews')->insert(array_merge([
                        'order_id' => $orderId,
                        'is_active' => true,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ], $review));
                }
            }
        }

        return $ordersByNumber;
    }

    private function seedBanners(array $timestamps): void
    {
        $banners = [
            ['title' => 'Weekend Feast', 'subtitle' => 'Flat discounts on demo menu items.', 'image' => null, 'link_url' => '/customer/foods', 'is_active' => true, 'sort_order' => 1],
            ['title' => 'Fast Delivery', 'subtitle' => 'Auto assignment testing banner.', 'image' => null, 'link_url' => '/delivery/orders', 'is_active' => true, 'sort_order' => 2],
        ];

        foreach ($banners as $banner) {
            DB::table('banners')->updateOrInsert(
                ['title' => $banner['title']],
                array_merge($banner, $timestamps)
            );
        }
    }

    private function seedNotifications(array $users, array $orders, array $partners, array $restaurants, array $timestamps): void
    {
        $userIds = array_values($users);
        DB::table('notifications')->whereIn('user_id', $userIds)->delete();

        $notifications = [
            [
                'user_id' => $users['customer_one'],
                'type' => 'order_ready',
                'title' => 'Order ready',
                'message' => 'Your order FDDEMO1003 is ready for delivery assignment.',
                'payload' => ['order_id' => $orders['FDDEMO1003']],
            ],
            [
                'user_id' => $users['customer_one'],
                'type' => 'delivery_assigned',
                'title' => 'Delivery assigned',
                'message' => 'Your demo delivery partner has been assigned for FDDEMO1004.',
                'payload' => ['order_id' => $orders['FDDEMO1004']],
            ],
            [
                'user_id' => $users['customer_two'],
                'type' => 'delivered',
                'title' => 'Order delivered',
                'message' => 'FDDEMO1005 was delivered successfully.',
                'payload' => ['order_id' => $orders['FDDEMO1005']],
            ],
            [
                'user_id' => $users['vendor_one'],
                'type' => 'order_received',
                'title' => 'New order received',
                'message' => 'You have demo orders waiting in the vendor dashboard.',
                'payload' => ['restaurant_id' => $restaurants['restaurant_one']],
            ],
            [
                'user_id' => $users['vendor_two'],
                'type' => 'order_received',
                'title' => 'New order received',
                'message' => 'Urban Bites has a demo order for testing.',
                'payload' => ['restaurant_id' => $restaurants['restaurant_two']],
            ],
            [
                'user_id' => $users['delivery_one'],
                'type' => 'delivery_assigned',
                'title' => 'Active delivery',
                'message' => 'You are assigned to FDDEMO1004.',
                'payload' => ['order_id' => $orders['FDDEMO1004']],
            ],
            [
                'user_id' => $users['delivery_two'],
                'type' => 'delivery_completed',
                'title' => 'Delivery completed',
                'message' => 'FDDEMO1005 is already delivered in the demo data.',
                'payload' => ['order_id' => $orders['FDDEMO1005']],
            ],
            [
                'user_id' => $users['admin'],
                'type' => 'pending_approval',
                'title' => 'Pending approvals',
                'message' => 'Demo vendor and delivery approval records are available.',
                'payload' => ['restaurant_ids' => array_values($restaurants), 'delivery_partner_ids' => array_values($partners)],
            ],
        ];

        foreach ($notifications as $notification) {
            $payload = $notification['payload'];
            unset($notification['payload']);

            DB::table('notifications')->insert(array_merge([
                'is_read' => false,
                'payload' => json_encode($payload),
            ], $notification, $timestamps));
        }
    }

    private function seedComplaints(array $users, array $orders, array $timestamps): void
    {
        DB::table('complaints')->whereIn('order_id', [$orders['FDDEMO1005'], $orders['FDDEMO1006']])->delete();

        DB::table('complaints')->insert([
            [
                'order_id' => $orders['FDDEMO1006'],
                'user_id' => $users['customer_two'],
                'subject' => 'Late delivery',
                'description' => 'This is a demo complaint for admin testing.',
                'status' => 'pending',
                'admin_reply' => null,
                'replied_by' => null,
                'replied_at' => null,
                'created_at' => $timestamps['created_at'],
                'updated_at' => $timestamps['updated_at'],
            ],
        ]);
    }

    private function seedRestaurantDocuments(array $restaurants, array $timestamps): void
    {
        DB::table('restaurant_documents')->whereIn('restaurant_id', array_values($restaurants))->delete();

        DB::table('restaurant_documents')->insert([
            [
                'restaurant_id' => $restaurants['restaurant_one'],
                'document_type' => 'gst',
                'file_path' => 'demo/docs/spice-route-gst.pdf',
                'status' => 'approved',
                'notes' => 'Demo GST document.',
                'created_at' => $timestamps['created_at'],
                'updated_at' => $timestamps['updated_at'],
            ],
            [
                'restaurant_id' => $restaurants['restaurant_two'],
                'document_type' => 'license',
                'file_path' => 'demo/docs/urban-bites-license.pdf',
                'status' => 'approved',
                'notes' => 'Demo restaurant license.',
                'created_at' => $timestamps['created_at'],
                'updated_at' => $timestamps['updated_at'],
            ],
        ]);
    }

    private function buildTimeline(array $stamps): string
    {
        $steps = [
            'placed',
            'accepted',
            'preparing',
            'ready',
            'assigned',
            'picked_up',
            'out_for_delivery',
            'delivered',
            'cancelled',
        ];

        $timeline = [];
        foreach ($steps as $step) {
            $timeline[] = [
                'status' => $step,
                'at' => $stamps[$step] ?? null,
            ];
        }

        return json_encode($timeline);
    }
}
