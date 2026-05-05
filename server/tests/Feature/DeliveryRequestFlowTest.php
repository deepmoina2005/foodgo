<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DeliveryRequestFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_first_accept_wins_and_delivery_flow_completes(): void
    {
        $vendorUser = $this->createUser('vendor@example.com', 'vendor', 'active');
        $customerUser = $this->createUser('customer@example.com', 'customer', 'active');
        $firstPartnerUser = $this->createUser('delivery1@example.com', 'delivery_partner', 'active');
        $secondPartnerUser = $this->createUser('delivery2@example.com', 'delivery_partner', 'active');

        $vendorId = DB::table('vendors')->insertGetId([
            'user_id' => $vendorUser->id,
            'store_name' => 'Pickup Flow Kitchen',
            'status' => 'approved',
            'documents_verified' => true,
            'commission_percentage' => 15,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $restaurantId = DB::table('restaurants')->insertGetId([
            'vendor_id' => $vendorId,
            'name' => 'Pickup Flow Kitchen',
            'slug' => 'pickup-flow-kitchen',
            'description' => 'Demo restaurant for request flow.',
            'area' => 'Downtown',
            'city' => 'Mumbai',
            'latitude' => 19.0760000,
            'longitude' => 72.8777000,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $firstPartnerId = DB::table('delivery_partners')->insertGetId([
            'user_id' => $firstPartnerUser->id,
            'full_name' => 'First Rider',
            'phone' => '9999999991',
            'vehicle_type' => 'Bike',
            'city' => 'Mumbai',
            'area' => 'Downtown',
            'latitude' => 19.0765000,
            'longitude' => 72.8780000,
            'kyc_status' => 'approved',
            'status' => 'approved',
            'is_available' => 1,
            'current_order_id' => null,
            'rating_average' => 4.8,
            'earnings_balance' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $secondPartnerId = DB::table('delivery_partners')->insertGetId([
            'user_id' => $secondPartnerUser->id,
            'full_name' => 'Second Rider',
            'phone' => '9999999992',
            'vehicle_type' => 'Scooter',
            'city' => 'Mumbai',
            'area' => 'Downtown',
            'latitude' => 19.0775000,
            'longitude' => 72.8795000,
            'kyc_status' => 'approved',
            'status' => 'approved',
            'is_available' => 1,
            'current_order_id' => null,
            'rating_average' => 4.6,
            'earnings_balance' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $orderId = DB::table('orders')->insertGetId([
            'order_number' => 'FDTEST0001',
            'user_id' => $customerUser->id,
            'customer_id' => $customerUser->id,
            'vendor_id' => $vendorId,
            'restaurant_id' => $restaurantId,
            'status' => 'placed',
            'order_status' => 'placed',
            'payment_status' => 'pending',
            'subtotal' => 500,
            'discount_amount' => 0,
            'gst_amount' => 0,
            'delivery_fee' => 29,
            'delivery_charge' => 29,
            'platform_fee' => 5,
            'commission_amount' => 75,
            'total_amount' => 529,
            'placed_at' => now()->subMinutes(10),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('payments')->insert([
            'order_id' => $orderId,
            'payment_method' => 'COD',
            'amount' => 529,
            'payment_status' => 'pending',
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Sanctum::actingAs($vendorUser, ['*']);
        $this->postJson("/api/vendor/orders/{$orderId}/accept")
            ->assertOk()
            ->assertJsonPath('message', 'Order accepted.');

        $this->assertDatabaseMissing('delivery_requests', [
            'order_id' => $orderId,
        ]);

        Sanctum::actingAs($vendorUser, ['*']);
        $this->patchJson("/api/vendor/orders/{$orderId}/status", ['status' => 'preparing'])
            ->assertOk()
            ->assertJsonPath('message', 'Order status updated.');

        $this->patchJson("/api/vendor/orders/{$orderId}/status", ['status' => 'ready'])
            ->assertOk()
            ->assertJsonPath('message', 'Order is ready. Pickup request sent to delivery partners.');

        $requestId = (int) DB::table('delivery_requests')->where('order_id', $orderId)->value('id');
        $this->assertNotSame(0, $requestId);
        $this->assertDatabaseHas('delivery_requests', [
            'id' => $requestId,
            'order_id' => $orderId,
            'status' => 'open',
        ]);

        Sanctum::actingAs($firstPartnerUser, ['*']);
        $this->postJson("/api/delivery/available-requests/{$requestId}/accept")
            ->assertOk()
            ->assertJsonPath('message', 'Pickup request accepted.');

        Sanctum::actingAs($secondPartnerUser, ['*']);
        $this->postJson("/api/delivery/available-requests/{$requestId}/accept")
            ->assertStatus(409)
            ->assertJsonPath('message', 'This delivery request has already been accepted by another partner.');

        Sanctum::actingAs($firstPartnerUser, ['*']);
        $this->patchJson("/api/delivery/orders/{$orderId}/pickup")
            ->assertOk()
            ->assertJsonPath('message', 'Pickup confirmed.');
        $this->patchJson("/api/delivery/orders/{$orderId}/status", ['status' => 'out_for_delivery'])
            ->assertOk()
            ->assertJsonPath('message', 'Delivery status updated.');
        $this->patchJson("/api/delivery/orders/{$orderId}/delivered")
            ->assertOk()
            ->assertJsonPath('message', 'Order marked as delivered.');

        $this->assertDatabaseHas('orders', [
            'id' => $orderId,
            'status' => 'delivered',
            'payment_status' => 'paid',
            'delivery_partner_id' => $firstPartnerId,
        ]);

        $this->assertDatabaseHas('delivery_assignments', [
            'order_id' => $orderId,
            'delivery_partner_id' => $firstPartnerId,
            'status' => 'delivered',
        ]);

        $this->assertDatabaseHas('delivery_partners', [
            'id' => $firstPartnerId,
            'is_available' => 1,
            'current_order_id' => null,
        ]);

        $this->assertDatabaseHas('payments', [
            'order_id' => $orderId,
            'payment_status' => 'paid',
        ]);
    }

    private function createUser(string $email, string $role, string $status): User
    {
        $id = DB::table('users')->insertGetId([
            'name' => ucfirst(explode('@', $email)[0]),
            'email' => $email,
            'password' => bcrypt('Password@123'),
            'role' => $role,
            'account_status' => $status,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return User::findOrFail($id);
    }
}
