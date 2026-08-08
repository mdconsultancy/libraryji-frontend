<?php

namespace App\Models\Concerns;

use App\Models\Scopes\TenantScope;
use Illuminate\Support\Facades\Auth;

trait BelongsToTenant
{
    public static function bootBelongsToTenant(): void
    {
        static::addGlobalScope(new TenantScope);

        static::creating(function ($model) {
            if (! $model->tenant_id && Auth::check() && Auth::user()->current_tenant_id) {
                $model->tenant_id = Auth::user()->current_tenant_id;
            }
        });
    }
}
