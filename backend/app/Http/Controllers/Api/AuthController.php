<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginStoreRequest;
use App\Http\Requests\Auth\RegisterStoreRequest;
use App\Http\Resources\UsersResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(LoginStoreRequest $request)
    {
        $credentials = $request->validated();

        if (!Auth::attempt($credentials)) {
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }

        $user = Auth::user();

        if ($user->status !== 'active') {
            Auth::logout();
            return response()->json([
                'message' => 'User account is inactive'
            ], 403);
        }

        $deviceName = $request->header('User-Agent') ?? 'unknown';
        $token = $user->createToken($deviceName)->plainTextToken;
        $user->remember_token = $token;
        $user->save();

        return response()->json([
            'message'      => 'Login successful',
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'user' => new UsersResource($user)
        ], 200);
    }

    public function register(RegisterStoreRequest $request)
    {
        $userData = $request->validated();
        $userData['status'] = 'inactive';

        $user = User::create($userData);

        return response()->json([
            'message' => 'User registered successfully',
            'data'    => new UsersResource($user),
        ], 201);
    }

public function approveUser($id)
{
    // optional: admin only
    if (!auth()->check() || auth()->user()->role !== 'admin') {
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    $user = User::findOrFail($id);
    $user->status = 'active';
    $user->save();

    return response()->json([
        'message' => 'User approved successfully',
        'data'    => new UsersResource($user->fresh()),
    ], 200);
}


    public function logout(Request $request)
    {
        $user = $request->user();
        $user->tokens()->delete();
        $user->remember_token = null;
        $user->save();

        return response()->json([
            'message' => 'Logout successful',
        ], 200);
    }
}
