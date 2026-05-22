<?php

namespace App\Helpers;

use Illuminate\Http\Request;

class AuthHelper
{
    public static function userId(Request $request): ?string
    {
        return $request->auth_user_id;
    }

    public static function userName(Request $request): ?string
    {
        return $request->auth_name;
    }

    public static function isAdmin(Request $request): bool
    {
        return (bool) $request->auth_is_admin;
    }

    public static function check(Request $request): bool
    {
        return !empty($request->auth_user_id);
    }
}