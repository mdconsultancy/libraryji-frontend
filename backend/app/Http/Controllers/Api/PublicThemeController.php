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

    /**
     * Upload constraints from Admin Settings -> General, read by every image
     * upload field (member photos, etc.) so client-side validation matches
     * what the backend will actually accept — without this being public,
     * the frontend would have no way to know the configured limits before
     * submitting. Not sensitive: just a max size and a list of extensions.
     */
    public function uploadLimits()
    {
        $general = PlatformSetting::getGroup('general');

        $maxMb = (int) ($general['max_upload_size_mb'] ?? 0);
        $extensions = collect(explode(',', $general['allowed_file_types'] ?? ''))
            ->map(fn ($ext) => strtolower(trim($ext, " .\t\n\r\0\x0B")))
            ->filter()
            ->values();

        return response()->json([
            'max_upload_size_mb' => $maxMb > 0 ? $maxMb : 2,
            'allowed_extensions' => $extensions->isNotEmpty() ? $extensions : collect(['jpg', 'jpeg', 'png']),
        ]);
    }

    private function assetUrl(?string $path): ?string
    {
        return $path ? Storage::disk('public')->url($path) : null;
    }
}
