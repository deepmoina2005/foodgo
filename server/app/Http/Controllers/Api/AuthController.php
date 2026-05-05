<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Auth\ChangePasswordRequest;
use App\Http\Requests\Api\Auth\LoginRequest;
use App\Http\Requests\Api\Auth\ProfileRequest;
use App\Http\Requests\Api\Auth\RegisterRequest;
use App\Services\AuthService;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(private readonly AuthService $authService)
    {
    }

    public function register(RegisterRequest $request)
    {
        return $this->authService->register($request->validated());
    }

    public function login(LoginRequest $request)
    {
        return $this->authService->login($request->validated());
    }

    public function logout(Request $request)
    {
        return $this->authService->logout($request);
    }

    public function me()
    {
        return $this->authService->me();
    }

    public function profile(ProfileRequest $request)
    {
        return $this->authService->profile($request->validated(), $request);
    }

    public function changePassword(ChangePasswordRequest $request)
    {
        return $this->authService->changePassword($request->validated());
    }
}
