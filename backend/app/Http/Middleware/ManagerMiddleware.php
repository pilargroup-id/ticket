<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ManagerMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!\App\Helpers\AuthHelper::check($request)) {
            return response()->json(['message' => "Unauthorize"], 401);
        }

        $user = \App\Models\User::find($request->auth_user_id);
        if (!$user || $user->role !== 'manager') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return $next($request);
    }
}
