<?php

namespace App\Services;

use App\Models\RefreshToken;
use App\Models\User;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Throwable;

/**
 * Issues and verifies the access/refresh token pair that replaced Sanctum's
 * personal access tokens. Access tokens are short-lived, self-contained JWTs
 * (no DB lookup to authenticate a request); refresh tokens are long-lived,
 * opaque, and DB-backed so they — and only they — can actually be revoked.
 */
class JwtService
{
    private string $secret;

    private int $accessTtlMinutes;

    private int $refreshTtlMinutes;

    public function __construct()
    {
        $this->secret = (string) config('jwt.secret');
        $this->accessTtlMinutes = (int) config('jwt.access_ttl_minutes');
        $this->refreshTtlMinutes = (int) config('jwt.refresh_ttl_minutes');
    }

    public function issueAccessToken(User $user): array
    {
        $now = time();

        $token = JWT::encode([
            'sub' => $user->id,
            'iat' => $now,
            'exp' => $now + $this->accessTtlMinutes * 60,
        ], $this->secret, 'HS256');

        return ['access_token' => $token, 'expires_in' => $this->accessTtlMinutes * 60];
    }

    /**
     * The plaintext is returned once, at issuance, and never stored —
     * only its hash is, same principle as a password.
     */
    public function issueRefreshToken(User $user, Request $request): string
    {
        $plaintext = Str::random(64);

        RefreshToken::create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $plaintext),
            'expires_at' => now()->addMinutes($this->refreshTtlMinutes),
            'user_agent' => substr((string) $request->userAgent(), 0, 255),
            'ip_address' => $request->ip(),
        ]);

        return $plaintext;
    }

    public function issuePair(User $user, Request $request): array
    {
        return [
            ...$this->issueAccessToken($user),
            'refresh_token' => $this->issueRefreshToken($user, $request),
        ];
    }

    public function decodeAccessToken(string $token): ?array
    {
        try {
            return (array) JWT::decode($token, new Key($this->secret, 'HS256'));
        } catch (Throwable) {
            return null;
        }
    }

    public function findValidRefreshToken(string $plaintext): ?RefreshToken
    {
        $record = RefreshToken::where('token_hash', hash('sha256', $plaintext))->first();

        return $record && $record->isValid() ? $record : null;
    }

    /**
     * Rotation: redeeming a refresh token immediately revokes it and mints a
     * fresh pair, so the same refresh token can never be exchanged twice —
     * whoever redeems a given refresh token first "wins", making a replayed
     * stolen token detectable (the legitimate client's next refresh fails).
     */
    public function rotate(RefreshToken $refreshToken, Request $request): array
    {
        $refreshToken->update(['revoked_at' => now()]);

        return $this->issuePair($refreshToken->user, $request);
    }

    public function revoke(string $plaintext): void
    {
        RefreshToken::where('token_hash', hash('sha256', $plaintext))
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);
    }
}
