<?php

namespace App\Services;

use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthService extends BaseApiService
{
    public function register(array $data)
    {
        return DB::transaction(function () use ($data) {
            $role = $data['role'];
            $accountStatus = $role === 'customer' ? 'active' : 'pending';

            $userId = DB::table('users')->insertGetId([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'password' => Hash::make($data['password']),
                'role' => $role,
                'account_status' => $accountStatus,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            if ($role === 'vendor') {
                DB::table('vendors')->insert([
                    'user_id' => $userId,
                    'store_name' => $data['name'],
                    'status' => 'pending',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $this->notifyUsersByRole('admin', 'vendor_registered', 'Vendor registration', "{$data['name']} has applied as a vendor.", [
                    'user_id' => $userId,
                    'role' => $role,
                ]);
            }

            if ($role === 'delivery_partner') {
                DB::table('delivery_partners')->insert([
                    'user_id' => $userId,
                    'full_name' => $data['name'],
                    'phone' => $data['phone'] ?? null,
                    'status' => 'pending',
                    'kyc_status' => 'pending',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $this->notifyUsersByRole('admin', 'delivery_registered', 'Delivery partner registration', "{$data['name']} has applied as a delivery partner.", [
                    'user_id' => $userId,
                    'role' => $role,
                ]);
            }

            $token = $this->issueToken($userId, $role.'-token');

            return ApiResponse::success('Registration completed.', [
                'user' => $this->userPayload($userId),
                'token' => $token,
            ], 201);
        });
    }

    public function login(array $data)
    {
        $user = DB::table('users')->where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return ApiResponse::error('Invalid email or password.', 422);
        }

        if ($user->account_status === 'blocked' || $user->account_status === 'suspended' || $user->account_status === 'rejected') {
            return ApiResponse::error('Account is not allowed to login.', 403, [
                'account_status' => $user->account_status,
            ]);
        }

        if (! empty($data['role']) && $user->role !== $data['role']) {
            return ApiResponse::error('Selected role does not match the account.', 422);
        }

        DB::table('personal_access_tokens')
            ->where('tokenable_type', 'App\\Models\\User')
            ->where('tokenable_id', $user->id)
            ->delete();

        $token = $this->issueToken((int) $user->id, $user->role.'-token');

        return ApiResponse::success('Login successful.', [
            'user' => $this->userPayload((int) $user->id),
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $token = $request->bearerToken();

        if ($token) {
            DB::table('personal_access_tokens')->where('token', hash('sha256', $token))->delete();
        }

        return ApiResponse::success('Logged out successfully.');
    }

    public function me()
    {
        return ApiResponse::success('Profile loaded.', [
            'user' => $this->userPayload($this->userId()),
        ]);
    }

    public function profile(array $data, Request $request)
    {
        $current = DB::table('users')->where('id', $this->userId())->first();
        $avatarPath = $request->file('avatar') ? $this->storeFile($request->file('avatar'), 'avatars') : $current?->avatar;

        DB::table('users')
            ->where('id', $this->userId())
            ->update([
                'name' => $data['name'],
                'phone' => $data['phone'] ?? null,
                'avatar' => $avatarPath,
                'updated_at' => now(),
            ]);

        return ApiResponse::success('Profile updated.', [
            'user' => $this->userPayload($this->userId()),
        ]);
    }

    public function changePassword(array $data)
    {
        $user = DB::table('users')->where('id', $this->userId())->first();

        if (! Hash::check($data['current_password'], $user->password)) {
            return ApiResponse::error('Current password is incorrect.', 422);
        }

        DB::table('users')
            ->where('id', $this->userId())
            ->update([
                'password' => Hash::make($data['password']),
                'updated_at' => now(),
            ]);

        return ApiResponse::success('Password updated.');
    }

    private function userPayload(int $userId): array
    {
        $user = DB::table('users')->where('id', $userId)->first();

        $payload = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'account_status' => $user->account_status,
            'avatar' => $user->avatar,
        ];

        if ($user->role === 'vendor') {
            $payload['vendor'] = DB::table('vendors')->where('user_id', $user->id)->first();
            $payload['restaurant'] = DB::table('restaurants')->join('vendors', 'vendors.id', '=', 'restaurants.vendor_id')
                ->where('vendors.user_id', $user->id)
                ->select('restaurants.*')
                ->first();
        }

        if ($user->role === 'delivery_partner') {
            $payload['delivery_partner'] = DB::table('delivery_partners')->where('user_id', $user->id)->first();
        }

        return $payload;
    }

    private function issueToken(int $userId, string $name): string
    {
        $plainTextToken = Str::random(40);

        DB::table('personal_access_tokens')->insert([
            'tokenable_type' => 'App\\Models\\User',
            'tokenable_id' => $userId,
            'name' => $name,
            'token' => hash('sha256', $plainTextToken),
            'abilities' => json_encode(['*']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $plainTextToken;
    }
}
