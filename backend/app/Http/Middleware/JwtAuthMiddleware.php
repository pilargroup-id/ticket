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

        return $next($request);
    }
}