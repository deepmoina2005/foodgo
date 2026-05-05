<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class PricingService extends BaseApiService
{
    public function quote(int $cartId, ?object $restaurant = null, ?object $coupon = null): array
    {
        $items = DB::table('cart_items')->where('cart_id', $cartId)->get();
        $subtotal = (float) $items->sum('item_total');
        $discount = $coupon ? $this->calculateDiscount($subtotal, $coupon) : 0.0;
        $gstPercentage = (float) config('foodgo.pricing.gst_percentage', 5);
        $deliveryCharge = $this->deliveryCharge($restaurant);
        $platformFee = (float) config('foodgo.pricing.platform_fee', 5);
        $gstAmount = round(max(0, $subtotal - $discount) * ($gstPercentage / 100), 2);
        $total = round(max(0, $subtotal - $discount) + $gstAmount + $deliveryCharge + $platformFee, 2);

        return [
            'subtotal' => round($subtotal, 2),
            'discount_amount' => round($discount, 2),
            'gst_percentage' => $gstPercentage,
            'gst_amount' => $gstAmount,
            'delivery_charge' => $deliveryCharge,
            'platform_fee' => $platformFee,
            'total_amount' => $total,
        ];
    }

    public function quoteForRestaurant(int $cartId, int $restaurantId, ?object $coupon = null): array
    {
        $restaurant = DB::table('restaurants')->where('id', $restaurantId)->first();

        return $this->quote($cartId, $restaurant, $coupon);
    }

    private function deliveryCharge(?object $restaurant): float
    {
        if (! $restaurant) {
            return (float) config('foodgo.pricing.default_delivery_charge', 40);
        }

        if (isset($restaurant->delivery_fee) && (float) $restaurant->delivery_fee > 0) {
            return (float) $restaurant->delivery_fee;
        }

        return (float) config('foodgo.pricing.default_delivery_charge', 40);
    }

    private function calculateDiscount(float $subtotal, object $coupon): float
    {
        if ($coupon->type === 'fixed') {
            return min((float) $coupon->value, $subtotal);
        }

        $discount = $subtotal * ((float) $coupon->value / 100);

        if (! empty($coupon->max_discount_amount)) {
            $discount = min($discount, (float) $coupon->max_discount_amount);
        }

        return round($discount, 2);
    }
}
