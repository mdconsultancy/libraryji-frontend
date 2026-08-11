<?php

namespace App\Services;

use App\Models\Member;
use App\Models\Seat;
use App\Models\Tenant;

/**
 * Enforces the resource caps (max_seats/max_members/max_staff)
 * that come from the tenant's active SubscriptionPlan. A tenant with no
 * active plan has no limits recorded, so callers should already be blocked
 * from reaching these checks by the tenant.active middleware in that case —
 * this service just answers "is there room for one more?".
 */
class PlanLimitService
{
    private const RESOURCES = [
        'seats' => 'max_seats',
        'members' => 'max_members',
        'staff' => 'max_staff',
    ];

    private const UNLIMITED_RESOURCES = ['seats', 'members', 'staff'];

    /**
     * Returns null when unlimited or no plan limit applies, otherwise the max allowed.
     */
    public function limit(Tenant $tenant, string $resource): ?int
    {
        if (in_array($resource, self::UNLIMITED_RESOURCES, true)) {
            return null;
        }

        $plan = $tenant->activeSubscription?->plan;
        if (! $plan) {
            return null;
        }

        $column = self::RESOURCES[$resource] ?? null;

        return $column ? $plan->{$column} : null;
    }

    public function currentCount(Tenant $tenant, string $resource): int
    {
        return match ($resource) {
            'seats' => Seat::where('tenant_id', $tenant->id)->count(),
            'members' => Member::where('tenant_id', $tenant->id)->count(),
            // `role` exists on both `users` and the `tenant_user` pivot, so it
            // must be qualified here to avoid an ambiguous-column SQL error.
            'staff' => $tenant->users()->whereIn('users.role', ['admin', 'staff'])->count(),
            default => 0,
        };
    }

    /**
     * True when creating `additional` more of `resource` would exceed the plan limit.
     */
    public function wouldExceed(Tenant $tenant, string $resource, int $additional = 1): bool
    {
        $limit = $this->limit($tenant, $resource);
        if ($limit === null) {
            return false;
        }

        return $this->currentCount($tenant, $resource) + $additional > $limit;
    }

    public function limitMessage(string $resource, int $limit): string
    {
        $label = ucfirst($resource);

        return "Your plan allows a maximum of {$limit} {$label}. Upgrade your plan to add more.";
    }

    /**
     * Limit + current usage for every plan-limited resource, so the frontend
     * can disable an "Add" button proactively instead of only finding out
     * via a 422 after the user has already filled out the form.
     */
    public function summary(Tenant $tenant): array
    {
        $result = [];

        foreach (array_keys(self::RESOURCES) as $resource) {
            $limit = $this->limit($tenant, $resource);
            $used = $this->currentCount($tenant, $resource);

            $result[$resource] = [
                'limit' => $limit,
                'used' => $used,
                'remaining' => $limit === null ? null : max(0, $limit - $used),
                'exceeded' => $limit !== null && $used >= $limit,
            ];
        }

        return $result;
    }
}
