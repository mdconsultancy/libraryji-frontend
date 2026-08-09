<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/', function () {
    return view('welcome');
});

/**
 * Fallback for serving the `public` disk when the `public/storage` symlink
 * (created by `storage:link`) doesn't work — common on shared hosting where
 * the document root isn't the Laravel `public/` folder or symlinks are
 * blocked. Only reached if the webserver couldn't resolve the path itself.
 */
Route::get('/storage/{path}', function (string $path) {
    if (! Storage::disk('public')->exists($path)) {
        abort(404);
    }

    return Storage::disk('public')->response($path);
})->where('path', '.*')->name('storage.local');
