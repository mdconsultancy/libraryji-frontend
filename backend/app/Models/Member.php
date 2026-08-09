<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Member extends Model
{
    use BelongsToTenant, HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id', 'user_id', 'member_code', 'name', 'email',
        'phone', 'photo_path', 'address', 'id_proof_type', 'id_proof_number',
        'id_proof_path', 'date_of_birth', 'gender', 'join_date', 'status', 'notes',
    ];

    // Raw storage paths are never sent to the client — photo_url/id_proof_url
    // (short-lived, signed) are how the frontend is allowed to view these files.
    protected $hidden = ['photo_path', 'id_proof_path'];

    protected $appends = ['photo_url', 'id_proof_url'];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'join_date' => 'date',
        ];
    }

    /**
     * Signed, time-limited URL to the private `local` disk (see
     * config/filesystems.php) — Laravel serves it through its built-in
     * signed `storage.local` route, which 403s without a valid signature.
     * Regenerated on every request the member is loaded in, so it's never
     * a long-lived shareable link, and never exposes the raw storage path.
     */
    protected function photoUrl(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->photo_path ? Storage::disk('local')->temporaryUrl($this->photo_path, now()->addMinutes(30)) : null,
        );
    }

    protected function idProofUrl(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->id_proof_path ? Storage::disk('local')->temporaryUrl($this->id_proof_path, now()->addMinutes(30)) : null,
        );
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(MemberSubscription::class);
    }

    public function activeSubscription()
    {
        return $this->hasOne(MemberSubscription::class)
            ->where('status', 'active')
            ->whereDate('end_date', '>=', now())
            ->latestOfMany();
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
