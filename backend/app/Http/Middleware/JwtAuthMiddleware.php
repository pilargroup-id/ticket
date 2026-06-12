<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
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

        if (!$token) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $authContext = $this->resolveAuthContext($token);

        if (!$authContext) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $request->merge($authContext['data']);

        if (!empty($authContext['user'])) {
            $request->setUserResolver(fn () => $authContext['user']);
        }

        if (!empty($authContext['token_model'])) {
            $request->attributes->set('auth_token_model', $authContext['token_model']);
        }

        \Log::info('JwtAuthMiddleware success', [
            'user_id'    => $authContext['data']['auth_user_id'] ?? null,
            'username'   => $authContext['data']['auth_username'] ?? null,
            'department' => $authContext['data']['auth_dept_name'] ?? null,
        ]);

        return $next($request);
    }

    private function resolveAuthContext(string $token): ?array
    {
        $sanctumToken = PersonalAccessToken::findToken($token);

        if ($sanctumToken && $sanctumToken->tokenable instanceof User) {
            $user = $sanctumToken->tokenable->loadMissing('department.location');

            return [
                'user' => $user,
                'token_model' => $sanctumToken,
                'data' => $this->buildAuthDataFromUser($user),
            ];
        }

        try {
            $payload = JWTAuth::setToken($token)->getPayload();
        } catch (TokenExpiredException $e) {
            \Log::warning('JWT token expired');
            return null;
        } catch (TokenInvalidException $e) {
            \Log::warning('JWT token invalid');
            return null;
        } catch (JWTException $e) {
            \Log::warning('JWT exception', ['error' => $e->getMessage()]);
            return null;
        } catch (\Throwable $e) {
            \Log::error('Unexpected error in JwtAuthMiddleware', ['error' => $e->getMessage()]);
            return null;
        }

        $user = null;

        try {
            $username = $payload->get('username');

            if ($username) {
                $user = User::with('department.location')
                    ->where('username', $username)
                    ->first();
            }
        } catch (\Throwable $e) {
            \Log::warning('Local ticket user lookup failed, fallback to PG payload', [
                'error' => $e->getMessage(),
                'sub' => $payload->get('sub'),
                'username' => $payload->get('username'),
            ]);
        }

        return [
            'user' => $user,
            'data' => $this->buildAuthDataFromPayload($payload, $user),
        ];
    }

    private function buildAuthDataFromUser(User $user): array
    {
        return [
            'auth_user_id'    => $user->getKey(),
            'auth_username'   => $user->username,
            'auth_name'       => $user->name,
            'auth_is_admin'   => $this->isAdminUser($user),
            'auth_dept_id'    => $user->resolvedDepartmentId(),
            'auth_dept_name'  => $user->resolvedDepartmentName(),
            'auth_company_id' => null,
            'auth_company'    => null,
            'auth_job'        => $user->job_position,
            'auth_apps'       => [],
        ];
    }

    private function buildAuthDataFromPayload($payload, ?User $user = null): array
    {
        $departmentId = $user?->resolvedDepartmentId() ?? $payload->get('department_id');
        $departmentName = $user?->resolvedDepartmentName() ?? $payload->get('department');
        $jobPosition = $user?->job_position ?? $payload->get('job_position');

        return [
            'auth_user_id'    => $user?->getKey() ?? $payload->get('sub'),
            'auth_username'   => $user?->username ?? $payload->get('username'),
            'auth_name'       => $user?->name ?? $payload->get('name'),
            'auth_is_admin'   => $this->isAdminUser($user, $departmentId, $payload),
            'auth_dept_id'    => $departmentId,
            'auth_dept_name'  => $departmentName,
            'auth_company_id' => $payload->get('company_id'),
            'auth_company'    => $payload->get('company'),
            'auth_job'        => $jobPosition,
            'auth_apps'       => $payload->get('apps') ?? [],
        ];
    }

    private function isAdminUser(?User $user = null, mixed $departmentId = null, mixed $payload = null): bool
    {
        if ($user) {
            return $user->isAdminUser();
        }

        $role = $payload?->get('role');

        return $role === 'admin' || (int) $departmentId === 8;
    }
}
