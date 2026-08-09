<?php

namespace App\Providers;

use App\Models\User;
use App\Services\JwtService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // The "jwt" guard (config/auth.php): authenticates a request purely
        // by verifying the bearer access token's signature/expiry — no
        // session, no DB lookup for the token itself (only for loading the
        // user row it names). Invalid/expired/missing token -> null, which
        // the `auth:jwt` middleware turns into the standard 401 response.
        Auth::viaRequest('jwt', function (Request $request) {
            $token = $request->bearerToken();

            if (! $token) {
                return null;
            }

            $claims = app(JwtService::class)->decodeAccessToken($token);

            if (! $claims || empty($claims['sub'])) {
                return null;
            }

            return User::find($claims['sub']);
        });
    }
}
