<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class InternalSecretMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $secret = $request->header('X-Internal-Secret');

        if (!$secret || $secret !== config('services.internal.secret')) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        return $next($request);
    }
}