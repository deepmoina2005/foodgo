<?php

namespace App\Services;

use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PublicService extends BaseApiService
{
    public function restaurantsIndex(Request $request)
    {
        $query = DB::table('restaurants')
            ->join('vendors', 'vendors.id', '=', 'restaurants.vendor_id')
            ->where('restaurants.status', 'active')
            ->where('vendors.status', 'approved')
            ->select(
                'restaurants.*',
                'vendors.status as vendor_status',
                DB::raw('CONCAT("' . url('uploads') . '/", restaurants.banner) as image_url'),
                DB::raw('CONCAT("' . url('uploads') . '/", restaurants.logo) as logo_url'),
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

        if ($request->filled('rating')) {
            $query->where('restaurants.average_rating', '>=', (float) $request->input('rating'));
        }

        $sort = $request->string('sort', 'rating')->toString();
        if ($sort === 'rating') {
            $query->orderByDesc('restaurants.average_rating');
        } elseif ($sort === 'delivery_time') {
            $query->orderBy('restaurants.delivery_time_minutes');
        } else {
            $query->orderByDesc('restaurants.id');
        }

        return ApiResponse::success('Public restaurants loaded.', [
            'restaurants' => $query->get()
        ]);
    }

    public function restaurantsShow(int $id)
    {
        $restaurant = DB::table('restaurants')
            ->join('vendors', 'vendors.id', '=', 'restaurants.vendor_id')
            ->where('restaurants.id', $id)
            ->where('restaurants.status', 'active')
            ->where('vendors.status', 'approved')
            ->select('restaurants.*', DB::raw('CONCAT("' . url('uploads') . '/", restaurants.banner) as image_url'), DB::raw('CONCAT("' . url('uploads') . '/", restaurants.logo) as logo_url'))
            ->first();

        abort_if(! $restaurant, 404, 'Restaurant not found or inactive.');

        return ApiResponse::success('Public restaurant loaded.', [
            'restaurant' => $restaurant
        ]);
    }

    public function restaurantsMenu(int $id)
    {
        $foods = DB::table('food_items')
            ->leftJoin('categories', 'categories.id', '=', 'food_items.category_id')
            ->select('food_items.*', 'categories.name as category_name', DB::raw('CONCAT("' . url('uploads') . '/", food_items.image) as image_url'))
            ->where('food_items.restaurant_id', $id)
            ->where('food_items.is_active', true)
            ->orderBy('categories.name')
            ->orderBy('food_items.name')
            ->get();

        $groupedFoods = $foods->groupBy(function (object $food): string {
            return (string) ($food->category_name ?? 'Uncategorized');
        })->map(fn ($items) => $items->values()->all())->all();

        $reviews = DB::table('reviews')
            ->join('users', 'users.id', '=', 'reviews.user_id')
            ->where('reviews.restaurant_id', $id)
            ->select('reviews.*', 'users.name as customer_name')
            ->orderByDesc('reviews.created_at')
            ->limit(10)
            ->get();

        return ApiResponse::success('Restaurant menu loaded.', [
            'menu' => $groupedFoods,
            'foods' => $foods,
            'reviews' => $reviews
        ]);
    }

    public function foodsIndex(Request $request)
    {
        $query = DB::table('food_items')
            ->join('restaurants', 'restaurants.id', '=', 'food_items.restaurant_id')
            ->join('vendors', 'vendors.id', '=', 'restaurants.vendor_id')
            ->leftJoin('categories', 'categories.id', '=', 'food_items.category_id')
            ->where('food_items.is_active', true)
            ->where('restaurants.status', 'active')
            ->where('vendors.status', 'approved')
            ->select('food_items.*', 'restaurants.name as restaurant_name', 'restaurants.area as restaurant_area', 'categories.name as category_name', DB::raw('CONCAT("' . url('uploads') . '/", food_items.image) as image_url'));

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('food_items.name', 'like', "%{$search}%")
                    ->orWhere('food_items.description', 'like', "%{$search}%")
                    ->orWhere('restaurants.name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->where('food_items.category_id', $request->integer('category_id'));
        }

        if ($request->filled('veg_type')) {
            $query->where('food_items.veg_type', $request->string('veg_type'));
        }

        if ($request->filled('min_price')) {
            $query->whereRaw('COALESCE(food_items.discount_price, food_items.price) >= ?', [$request->float('min_price')]);
        }

        if ($request->filled('max_price')) {
            $query->whereRaw('COALESCE(food_items.discount_price, food_items.price) <= ?', [$request->float('max_price')]);
        }

        $sort = $request->string('sort', 'popularity')->toString();
        if ($sort === 'price_asc') {
            $query->orderByRaw('COALESCE(food_items.discount_price, food_items.price) ASC');
        } elseif ($sort === 'price_desc') {
            $query->orderByRaw('COALESCE(food_items.discount_price, food_items.price) DESC');
        } elseif ($sort === 'rating') {
            $query->orderByDesc('food_items.popularity_score');
        } else {
            $query->orderByDesc('food_items.id');
        }

        return ApiResponse::success('Public foods loaded.', [
            'foods' => $query->get()
        ]);
    }

    public function foodsShow(int $id)
    {
        $food = DB::table('food_items')
            ->join('restaurants', 'restaurants.id', '=', 'food_items.restaurant_id')
            ->join('vendors', 'vendors.id', '=', 'restaurants.vendor_id')
            ->leftJoin('categories', 'categories.id', '=', 'food_items.category_id')
            ->where('food_items.id', $id)
            ->where('food_items.is_active', true)
            ->where('restaurants.status', 'active')
            ->where('vendors.status', 'approved')
            ->select('food_items.*', 'restaurants.name as restaurant_name', 'restaurants.area as restaurant_area', 'restaurants.city as restaurant_city', 'categories.name as category_name', DB::raw('CONCAT("' . url('uploads') . '/", food_items.image) as image_url'))
            ->first();

        abort_if(! $food, 404, 'Food item not found or inactive.');

        $reviews = DB::table('reviews')
            ->join('users', 'users.id', '=', 'reviews.user_id')
            ->where('reviews.food_item_id', $id)
            ->select('reviews.*', 'users.name as customer_name')
            ->orderByDesc('reviews.created_at')
            ->limit(5)
            ->get();

        return ApiResponse::success('Public food loaded.', [
            'food' => $food,
            'reviews' => $reviews
        ]);
    }

    public function categoriesIndex()
    {
        $categories = DB::table('categories')
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return ApiResponse::success('Public categories loaded.', [
            'categories' => $categories
        ]);
    }
}
