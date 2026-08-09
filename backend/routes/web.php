<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/', function () {
    return view('welcome');
});

/**
 * Serves both the `public` and `local` disks under `/media` instead of the
 * conventional `/storage` prefix. On this host (Hostinger), the panel's WAF
 * blanket-blocks any request path starting with `/storage/` (same as
 * `.env`) before it ever reaches PHP — a bare `/storage` 404s fine, but
 * `/storage/<anything>` 403s regardless of whether the file exists, symlink
 * or no symlink. `/media` isn't on that blocklist, so route file serving
 * through here instead. See config/filesystems.php `public.url`, which must
 * match this prefix.
 *
 * This route is also what `Storage::disk('local')->temporaryUrl()` resolves
 * to (it shares the framework's `storage.local` route name) — member
 * photos/ID proofs live on the private `local` disk specifically so they're
 * only reachable via a signed URL, so that branch must verify the signature
 * before serving. Files on the `public` disk (tenant logos, etc.) are meant
 * to be publicly reachable and were never signed.
 */
Route::get('/media/{path}', function (\Illuminate\Http\Request $request, string $path) {
    if (Storage::disk('local')->exists($path)) {
        // Laravel's LocalFilesystemAdapter::temporaryUrl() signs with
        // absolute: false (see vendor/laravel/framework .../LocalFilesystemAdapter.php),
        // so validation must use the same relative mode — hasValidSignature()'s
        // absolute-by-default check computes a different hash and always fails.
        if (! $request->hasValidRelativeSignature()) {
            abort(403);
        }

        return Storage::disk('local')->response($path);
    }

    if (Storage::disk('public')->exists($path)) {
        return Storage::disk('public')->response($path);
    }

    abort(404);
})->where('path', '.*')->name('storage.local');
