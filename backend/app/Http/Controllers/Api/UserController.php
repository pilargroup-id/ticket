<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterStoreByAdminRequest;
use App\Http\Requests\User\UserUpdateRequest;
use App\Http\Resources\UsersResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
    {
        $users = User::with('department.location')->latest()->get();

        return response()->json([
            'message' => 'Users fetched successfully',
            'data'    => UsersResource::collection($users),
        ], 200);
    }

    public function developer()
    {
        $developer = User::where('role', 'admin')->with('department.location')->latest()->get();

        return response()->json([
            'message' => 'Users fetched successfully',
            'data'    => UsersResource::collection($developer),
        ], 200);
    }

    public function registerByAdmin(RegisterStoreByAdminRequest $request)
    {
        $userData = $request->validated();
        $userData['status'] = 'active';

        // ✅ kalau request ini bisa bikin password, pastiin hash juga
        if (isset($userData['password']) && $userData['password']) {
            $userData['password'] = Hash::make($userData['password']);
        }

        $user = User::create($userData);

        return response()->json([
            'message' => 'User registered successfully by admin',
            'data'    => new UsersResource($user),
        ], 201);
    }

    public function supportIndex()
    {
        $users = User::where('role', 'admin')->where('status', 'active')->get();

        return response()->json([
            'message' => 'Support users fetched successfully',
            'data'    => UsersResource::collection($users),
        ], 200);
    }

    public function me(Request $request)
    {
        return response()->json([
            'message' => 'User profile fetched successfully',
            'data'    => [
                'id'           => $request->auth_user_id,
                'name'         => $request->auth_name,
                'username'     => $request->auth_username,
                'is_admin'     => $request->auth_is_admin,
                'department_id'=> $request->auth_dept_id,
                'department'   => $request->auth_dept_name,
                'company_id'   => $request->auth_company_id,
                'company'      => $request->auth_company,
                'job_position' => $request->auth_job,
                'apps'         => $request->auth_apps,
            ]
        ], 200);
    }

    public function update(UserUpdateRequest $request, $id)
    {
        $user = User::findOrFail($id);
        $userData = $request->validated();

        if (isset($userData['password']) && $userData['password']) {
            // ✅ revoke token kalau password diganti
            $user->tokens()->delete();

            // ✅ hash password
            $userData['password'] = Hash::make($userData['password']);
        } else {
            // kalau null/empty, jangan overwrite password
            unset($userData['password']);
        }

        $user->update($userData);

        return response()->json([
            'message' => 'User updated successfully. Please login again if password was changed',
            'data'    => new UsersResource($user),
        ], 200);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully',
        ], 200);
    }

    public function supports()
    {
        $users = User::where('role', 'admin')->get();

        return response()->json([
            'message' => 'Support list',
            'data' => UsersResource::collection($users),
        ], 200);
    }
}
