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
        Log::info('SSO callback full', [
            'url'         => $request->fullUrl(),
            'query_all'   => $request->query(),
            'state'       => $request->query('state'),
            'token'       => $request->query('token') ? 'ada' : 'tidak ada',
        ]);

        $state    = $request->query('state');
        $cacheKey = 'sso_state_' . $state;
        $found    = cache()->get($cacheKey);

        Log::info('SSO callback hit', [
            'state'     => $state,
            'cache_key' => $cacheKey,
            'found'     => $found,
        ]);

        if (!$state || !cache()->pull($cacheKey)) {
            return redirect(config('app.frontend_url') . '/login?error=invalid_state');
        }

        $handoffToken = $request->query('token');

        if (!$handoffToken) {
            return redirect(config('app.frontend_url') . '/login?error=missing_token');
        }

        try {
            $response = Http::post(config('services.sso.provider_url') . '/api/sso/verify', [
                'token'         => $handoffToken,
                'client_id'     => config('services.sso.client_id'),
                'client_secret' => config('services.sso.client_secret'),
            ]);

            Log::info('SSO verify response', [
                'status'     => $response->status(),
                'body'       => $response->body(),
                'verify_url' => config('services.sso.provider_url') . '/api/sso/verify',
            ]);

            if (!$response->successful() || !$response->json('valid')) {
                return redirect(config('app.frontend_url') . '/login?error=sso_failed');
            }

            $cu = $response->json('user');

            // Cari user HANYA by username
            $user = User::where('username', $cu['username'])->first();

            if (!$user) {
                // Username dari pilargroup tidak ditemukan di ticket → TOLAK
                Log::warning('SSO callback: username mismatch', [
                    'username' => $cu['username'],
                ]);

                return redirect(
                    config('services.sso.pilargroup_url') . '/dashboard'
                    . '?error=username_mismatch&client=' . config('services.sso.client_id')
                );
            }

            // User ketemu → update data saja, tidak create baru
            $user->update([
                'name'         => $cu['name'],
                'email'        => $cu['email']        ?? $user->email,
                'phone'        => $cu['phone']        ?? $user->phone,
                'job_position' => $cu['job_position'] ?? $user->job_position,
                'status'       => 'active',
            ]);

            $deviceName = 'sso-' . config('services.sso.client_id');
            $token      = $user->createToken($deviceName)->plainTextToken;
            $user->remember_token = $token;
            $user->save();

            // Simpan pg_token di cache, dikaitkan ke sanctum token
            $pgToken = $handoffToken;
            $pgCv = null;
            try {
                $parts = explode('.', $pgToken);
                if (count($parts) === 3) {
                    $payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);
                    $pgCv = $payload['cv'] ?? null;
                }
            } catch (\Exception $e) {}

            // Simpan di cache 5 menit
            cache()->put('pg_token_' . md5($token), [
                'pg_token' => $pgToken,
                'pg_cv'    => $pgCv,
            ], now()->addMinutes(5));

            $userData = urlencode(json_encode([
                'id'           => $user->id,
                'name'         => $user->name,
                'username'     => $user->username,
                'email'        => $user->email,
                'role'         => $user->role,
                'job_position' => $user->job_position,
                'phone'        => $user->phone,
                'status'       => $user->status,
            ]));

            // Redirect tanpa pg_token di URL
            return redirect(
                config('app.frontend_url') . '/sso-success'
                . '?token=' . $token
                . '&user=' . $userData
            );
        } catch (\Exception $e) {
            Log::error('SSO callback error', ['error' => $e->getMessage()]);
            return redirect(config('app.frontend_url') . '/login?error=sso_failed');
        }
    }
}