<?php

namespace App\Http\Middleware;

use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAccountIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return ApiResponse::error('Unauthenticated.', 401);
        }

        if (! in_array($user->account_status, ['active', 'approved'], true)) {
            return ApiResponse::error('Your account is not active.', 403, [
                'account_status' => $user->account_status,
            ]);
        }

        return $next($request);
    }
}
