<?php

return [

    /*
    |--------------------------------------------------------------------------
    | JWT Signing Secret
    |--------------------------------------------------------------------------
    |
    | HS256 signing key for access tokens. Falls back to APP_KEY so this
    | works out of the box, but set a dedicated JWT_SECRET in production —
    | rotating APP_KEY for an unrelated reason would otherwise invalidate
    | every access token (and encrypted cookies/sessions) at the same time.
    |
    */

    'secret' => env('JWT_SECRET', env('APP_KEY')),

    /*
    |--------------------------------------------------------------------------
    | Access Token Lifetime
    |--------------------------------------------------------------------------
    |
    | Short-lived on purpose: an access token is self-contained and can't be
    | revoked before it expires, so it should never live long. The frontend
    | silently exchanges the refresh token for a new one when this runs out.
    |
    */

    'access_ttl_minutes' => (int) env('JWT_ACCESS_TTL_MINUTES', 15),

    /*
    |--------------------------------------------------------------------------
    | Refresh Token Lifetime
    |--------------------------------------------------------------------------
    |
    | This is what actually keeps someone "logged in" — persistent login
    | means this, not the access token TTL above. DB-backed and revocable
    | (see refresh_tokens table), unlike the access token.
    |
    */

    'refresh_ttl_minutes' => (int) env('JWT_REFRESH_TTL_MINUTES', 60 * 24 * 7),

];
