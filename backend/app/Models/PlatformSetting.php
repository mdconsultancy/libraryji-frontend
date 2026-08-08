<?php

namespace App\Models;

use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

class PlatformSetting extends Model
{
    protected $fillable = ['group', 'key', 'value', 'is_encrypted'];

    protected function casts(): array
    {
        return [
            'is_encrypted' => 'boolean',
        ];
    }

    public static function getGroup(string $group): array
    {
        return static::where('group', $group)->get()->mapWithKeys(function ($setting) {
            if (! $setting->is_encrypted || ! $setting->value) {
                return [$setting->key => $setting->value];
            }

            // A row can end up with ciphertext that no longer decrypts (APP_KEY
            // rotated, or the value was edited directly in the database) —
            // without this guard, one bad row throws and takes down the whole
            // settings screen (every group, since all() loops over all of them).
            // Treat it as unset instead of fatally erroring the request.
            try {
                $value = decrypt($setting->value);
            } catch (DecryptException $e) {
                Log::warning('Unable to decrypt platform setting, treating as unset.', [
                    'group' => $setting->group,
                    'key' => $setting->key,
                ]);
                $value = null;
            }

            return [$setting->key => $value];
        })->toArray();
    }

    public static function setGroup(string $group, array $values, array $encryptedKeys = []): void
    {
        foreach ($values as $key => $value) {
            $isEncrypted = in_array($key, $encryptedKeys, true);
            static::updateOrCreate(
                ['group' => $group, 'key' => $key],
                [
                    'value' => $isEncrypted && $value !== null ? encrypt($value) : $value,
                    'is_encrypted' => $isEncrypted,
                ]
            );
        }
    }
}
