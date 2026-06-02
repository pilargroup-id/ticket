<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class SSOController extends Controller
{
    /**
     * GET /api/auth/sso-url
     * Dipanggil React untuk dapat URL redirect ke pilargroup
     */
    public function getSsoUrl(Request $request)
    {
        $state       = Str::random(40);
        $redirectUri = config('services.sso.redirect_uri');

        cache()->put('sso_state_' . $state, true, now()->addMinutes(10));

        $ssoParams = http_build_query([
            'client_id'    => config('services.sso.client_id'),
            'redirect_uri' => $redirectUri,
            'state'        => $state,
        ]);

        $loginUrl = config('services.sso.pilargroup_url') . '/login?sso_authorize=1&' . $ssoParams;

        return response()->json([
            'url'          => $loginUrl,
            'state'        => $state,
            'redirect_uri' => $redirectUri,
        ]);
    }

    public function getPgToken(Request $request)
    {
        $sanctumToken = $request->bearerToken();
        $cacheKey = 'pg_token_' . md5($sanctumToken);
        
        $data = cache()->get($cacheKey);
        
        if (!$data) {
            return response()->json(['pg_token' => null, 'pg_cv' => null]);
        }

        cache()->forget($cacheKey);

        return response()->json($data);
    }

    /**
     * GET /api/auth/callback?token=xxx&state=xxx
     * Pilargroup redirect ke sini setelah user login
     * Karena ini API route tapi diakses via browser redirect,
     * kita return redirect ke frontend dengan token
     */
    public function callback(Request $request)
    {
        \Log::warning('SSOController callback accessed - this endpoint is deprecated', [
            'url' => $request->fullUrl(),
        ]);

        return response()->json([
            'error' => 'SSO callback deprecated. Use JWT token directly from pilargroup SSO.',
            'message' => 'Auth flow is now stateless. Frontend should handle JWT token from pilargroup directly.',
        ], 403);
    }
}