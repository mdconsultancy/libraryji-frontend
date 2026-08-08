<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

class TenantScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        if (! Auth::check()) {
            return;
        }

        $user = Auth::user();

        if ($user->role === 'super_admin') {
            return;
        }

        if ($user->current_tenant_id) {
            $builder->where($model->getTable().'.tenant_id', $user->current_tenant_id);
        }
    }
}
