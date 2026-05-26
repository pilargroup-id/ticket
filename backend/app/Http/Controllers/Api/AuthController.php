<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginStoreRequest;
use App\Http\Requests\Auth\RegisterStoreRequest;
use App\Http\Resources\UsersResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

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
    if (!\App\Helpers\AuthHelper::isAdmin(request())) {
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

    public function devLogin(Request $request)
    {
    Log::info('devLogin hit', [
        'username' => $request->input('username'),
        'password' => $request->input('password'),
        'config_username' => config('services.dev.mock_username'),
        'config_password' => config('services.dev.mock_password'),
        'env' => app()->environment(),
    ]);
    
        // Hanya aktif di environment local/development
        if (app()->environment('production')) {
            return response()->json(['message' => 'Not available'], 404);
        }

        $username = $request->input('username');
        $password = $request->input('password');

        // Validasi dari .env
        if (
            $username !== config('services.dev.mock_username') ||
            $password !== config('services.dev.mock_password')
        ) {
            return response()->json(['message' => 'Invalid mock credentials'], 401);
        }

        // Cari user di DB berdasarkan username
        $user = User::where('username', $username)->first();

        if (!$user) {
            return response()->json(['message' => 'User not found in database'], 404);
        }

        $token = $user->createToken('dev-mock')->plainTextToken;
        $user->remember_token = $token;
        $user->save();

        return response()->json([
            'access_token' => $token,
            'user'         => new UsersResource($user),
        ]);
    }
}
