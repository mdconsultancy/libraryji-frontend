<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PlatformSetting;
use Illuminate\Support\Facades\Storage;

class PublicThemeController extends Controller
{
    /**
     * Branding safe to expose to anyone, including the pre-login screens —
     * the only place the Logo/Favicon uploaded in Admin Settings -> Theme
     * are read from. Deliberately only the public-safe subset of the
     * `theme` settings group (no custom_css or anything else an admin
     * might not expect unauthenticated visitors to see).
     */
    public function show()
    {
        $theme = PlatformSetting::getGroup('theme');

        return response()->json([
            'site_name' => PlatformSetting::getGroup('general')['site_name'] ?? 'LibraryJi',
            'logo_url' => $this->assetUrl($theme['logo_path'] ?? null),
            'favicon_url' => $this->assetUrl($theme['favicon_path'] ?? null),
            'primary_color' => $theme['primary_color'] ?? null,
            'secondary_color' => $theme['secondary_color'] ?? null,
        ]);
    }

    private function assetUrl(?string $path): ?string
    {
        return $path ? Storage::disk('public')->url($path) : null;
    }
}
