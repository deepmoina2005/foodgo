<?php

namespace App\Http\Middleware;

use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return ApiResponse::error('Unauthenticated.', 401);
        }

        $allowedRoles = array_filter(array_map('trim', explode(',', implode(',', $roles))));

        if ($allowedRoles && ! in_array($user->role, $allowedRoles, true)) {
            return ApiResponse::error('You are not authorized for this resource.', 403);
        }

        return $next($request);
    }
}
