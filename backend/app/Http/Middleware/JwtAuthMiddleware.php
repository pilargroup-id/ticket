<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\TokenExpiredException;
use Tymon\JWTAuth\Exceptions\TokenInvalidException;
use Tymon\JWTAuth\Exceptions\JWTException;

class JwtAuthMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        \Log::info('JwtAuthMiddleware hit', ['url' => $request->fullUrl()]);
        
        $token = $request->bearerToken();
        
        if ($token) {
            // 1. Check if there is a cached pg_token (JWT) mapped to this Sanctum token
            $cached = cache()->get('pg_token_' . md5($token));
            if ($cached && isset($cached['pg_token'])) {
                try {
                    JWTAuth::setToken($cached['pg_token']);
                    $payload = JWTAuth::getPayload();

                    $departmentId = $payload->get('department_id');
                    $isAdmin = $departmentId == 8;

                    $request->merge([
                        'auth_user_id'    => $payload->get('sub'),
                        'auth_username'   => $payload->get('username'),
                        'auth_name'       => $payload->get('name'),
                        'auth_is_admin'   => $isAdmin,
                        'auth_dept_id'    => $departmentId,
                        'auth_dept_name'  => $payload->get('department'),
                        'auth_company_id' => $payload->get('company_id'),
                        'auth_company'    => $payload->get('company'),
                        'auth_job'        => $payload->get('job_position'),
                        'auth_apps'       => $payload->get('apps') ?? [],
                    ]);

                    $user = \App\Models\User::find($payload->get('sub'));
                    if ($user) {
                        \Illuminate\Support\Facades\Auth::setUser($user);
                    }

                    return $next($request);
                } catch (\Exception $e) {
                    \Log::warning('Failed to parse cached pg_token', ['error' => $e->getMessage()]);
                }
            }

            // 2. Try to authenticate via Sanctum (e.g. devLogin or expired cache but valid session)
            try {
                $user = \Illuminate\Support\Facades\Auth::guard('sanctum')->user();
                if ($user) {
                    $department = $user->department;
                    $isAdmin = $user->role === 'admin' || $user->department_id == 8;

                    $request->merge([
                        'auth_user_id'    => $user->id,
                        'auth_username'   => $user->username,
                        'auth_name'       => $user->name,
                        'auth_is_admin'   => $isAdmin,
                        'auth_dept_id'    => $user->department_id,
                        'auth_dept_name'  => $department ? $department->name : null,
                        'auth_company_id' => 1,
                        'auth_company'    => 'Pilar Group',
                        'auth_job'        => $user->job_position,
                        'auth_apps'       => ['MyTickets', 'Tickets'],
                    ]);

                    \Illuminate\Support\Facades\Auth::setUser($user);

                    return $next($request);
                }
            } catch (\Exception $e) {
                \Log::warning('Failed Sanctum authentication fallback', ['error' => $e->getMessage()]);
            }
        }

        // 3. Fallback to direct JWT token validation (original behavior)
        try {
            $payload = JWTAuth::parseToken()->getPayload();

            $departmentId = $payload->get('department_id');
            $isAdmin = $departmentId == 8;

            $request->merge([
                'auth_user_id'    => $payload->get('sub'),
                'auth_username'   => $payload->get('username'),
                'auth_name'       => $payload->get('name'),
                'auth_is_admin'   => $isAdmin,
                'auth_dept_id'    => $departmentId,
                'auth_dept_name'  => $payload->get('department'),
                'auth_company_id' => $payload->get('company_id'),
                'auth_company'    => $payload->get('company'),
                'auth_job'        => $payload->get('job_position'),
                'auth_apps'       => $payload->get('apps') ?? [],
            ]);

        } catch (TokenExpiredException $e) {
            return response()->json(['message' => 'Token expired'], 401);
        } catch (TokenInvalidException $e) {
            return response()->json(['message' => 'Token invalid'], 401);
        } catch (JWTException $e) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        if (isset($payload)) {
            $user = \App\Models\User::find($payload->get('sub'));
            if ($user) {
                \Illuminate\Support\Facades\Auth::setUser($user);
            }
        }

        return $next($request);
    }
}