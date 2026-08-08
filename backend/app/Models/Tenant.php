<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Tenant extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name', 'slug', 'library_code', 'email', 'phone', 'alternate_phone',
        'established_year', 'address', 'city', 'state', 'country', 'pincode',
        'gst_number', 'logo_path', 'timezone', 'status', 'trial_ends_at', 'meta',
    ];

    protected $appends = ['has_active_plan'];

    protected function casts(): array
    {
        return [
            'trial_ends_at' => 'datetime',
            'meta' => 'array',
        ];
    }

    /**
     * Every user (admin or staff) with access to this Library, via the
     * tenant_user membership pivot — not everyone whose *current* workspace
     * happens to be this Library (an admin with several Libraries may be
     * "in" a different one right now but still belongs here).
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'tenant_user')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function staff(): BelongsToMany
    {
        return $this->users()->wherePivot('role', 'staff');
    }

    public function admins(): BelongsToMany
    {
        return $this->users()->wherePivot('role', 'admin');
    }

    public function halls(): HasMany
    {
        return $this->hasMany(Hall::class);
    }

    public function seats(): HasMany
    {
        return $this->hasMany(Seat::class);
    }

    public function members(): HasMany
    {
        return $this->hasMany(Member::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(TenantSubscription::class);
    }

    public function activeSubscription()
    {
        return $this->hasOne(TenantSubscription::class)->whereIn('status', ['trialing', 'active'])->latestOfMany();
    }

    public function membershipPlans(): HasMany
    {
        return $this->hasMany(MembershipPlan::class);
    }

    protected function hasActivePlan(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->relationLoaded('activeSubscription')
                ? $this->activeSubscription !== null
                : $this->subscriptions()->whereIn('status', ['trialing', 'active'])->exists(),
        );
    }

    /**
     * Short, unique, uppercase, easy-to-type code (e.g. "A4X9K") used to scope
     * login to a single library. Excludes visually ambiguous characters
     * (0/O, 1/I) and retries on the rare collision.
     */
    public static function generateLibraryCode(): string
    {
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

        do {
            $code = collect(range(1, 5))
                ->map(fn () => $alphabet[random_int(0, strlen($alphabet) - 1)])
                ->implode('');
        } while (static::where('library_code', $code)->exists());

        return $code;
    }
}
