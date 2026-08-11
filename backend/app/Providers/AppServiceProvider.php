<?php

namespace App\Providers;

use App\Models\User;
use App\Services\JwtService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\URL;
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
        // Hostinger (and most shared-hosting/CDN setups) terminate TLS in
        // front of PHP and don't reliably forward X-Forwarded-Proto, so
        // Laravel can end up generating "http://" signed URLs even though
        // APP_URL and the real inbound request are "https://". That scheme
        // mismatch changes the signature hash, so every temporaryUrl() ends
        // up failing hasValidRelativeSignature() with a 403. Force the
        // scheme from APP_URL so generated + validated URLs always agree.
        if (str_starts_with((string) config('app.url'), 'https://')) {
            URL::forceScheme('https');
        }

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
