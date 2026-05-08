<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class InternalSyncController extends Controller
{
    /**
     * POST /api/internal/sync-user
     * Dipanggil oleh pilargroup untuk create atau update user di ticket
     */
    public function syncUser(Request $request)
    {
        $request->validate([
            'username'     => 'required|string',
            'old_username' => 'nullable|string',
            'name'         => 'required|string',
            'email'        => 'nullable|email',
            'phone'        => 'nullable|string',
            'job_position' => 'nullable|string',
            'department'   => 'nullable|string',
        ]);

        try {
            // Lookup by old_username dulu, fallback ke username baru
            $lookupUsername = $request->input('old_username') ?? $request->input('username');
            $user = User::where('username', $lookupUsername)->first();

            // Resolve department_id dari nama department
            $departmentId = null;
            if ($request->filled('department')) {
                $dept = \DB::table('departments')
                    ->whereRaw('LOWER(name) = ?', [strtolower(trim($request->department))])
                    ->first();

                if ($dept) {
                    $departmentId = $dept->id;
                } else {
                    Log::warning('InternalSync: department tidak ditemukan di ticket', [
                        'department' => $request->department,
                    ]);
                }
            }

            if ($user) {
                // UPDATE user existing
                $updateData = [
                    'username'     => $request->username, // update ke username baru
                    'name'         => $request->name,
                    'email'        => $request->email,
                    'phone'        => $request->phone,
                    'job_position' => $request->job_position,
                ];

                if (!is_null($departmentId)) {
                    $updateData['department_id'] = $departmentId;
                }

                $user->update($updateData);

                Log::info('InternalSync: user updated', [
                    'old_username' => $lookupUsername,
                    'new_username' => $request->username,
                ]);

                return response()->json([
                    'message' => 'User updated successfully',
                    'action'  => 'updated',
                ]);

            } else {
                // CREATE user baru — hanya kalau memang belum ada sama sekali
                $user = User::create([
                    'name'          => $request->name,
                    'username'      => $request->username,
                    'email'         => $request->email,
                    'phone'         => $request->phone,
                    'job_position'  => $request->job_position,
                    'department_id' => $departmentId,
                    'role'          => 'user',
                    'status'        => 'active',
                    'password'      => Hash::make(Str::random(32)),
                ]);

                Log::info('InternalSync: user created', ['username' => $request->username]);

                return response()->json([
                    'message' => 'User created successfully',
                    'action'  => 'created',
                ], 201);
            }

        } catch (\Exception $e) {
            Log::error('InternalSync error', [
                'error'    => $e->getMessage(),
                'username' => $request->username ?? null,
            ]);

            return response()->json([
                'message' => 'Sync failed',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    public function forceLogout(Request $request)
    {
        $username = $request->input('username');

        if (!$username) {
            return response()->json(['message' => 'username required'], 422);
        }

        try {
            $user = User::where('username', $username)->first();

            if (!$user) {
                Log::warning('forceLogout: user not found', ['username' => $username]);
                return response()->json(['message' => 'User not found', 'action' => 'skipped'], 404);
            }

            $user->tokens()->delete();
            $user->remember_token = null;
            $user->save();

            Log::info('forceLogout: tokens revoked', ['username' => $username]);

            return response()->json(['message' => 'Tokens revoked', 'action' => 'logged_out']);

        } catch (\Exception $e) {
            Log::error('forceLogout error', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed', 'error' => $e->getMessage()], 500);
        }
    }

    public function deleteUser(string $username)
    {
        try {
            $user = User::where('username', $username)->first();

            if (!$user) {
                Log::warning('InternalSync: user tidak ditemukan saat delete', [
                    'username' => $username,
                ]);

                return response()->json([
                    'message' => 'User not found',
                    'action'  => 'skipped',
                ], 404);
            }

            $user->forceDelete();

            Log::info('InternalSync: user deleted', ['username' => $username]);

            return response()->json([
                'message' => 'User deleted successfully',
                'action'  => 'deleted',
            ]);

        } catch (\Exception $e) {
            Log::error('InternalSync delete error', [
                'username' => $username,
                'error'    => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Delete failed',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
}