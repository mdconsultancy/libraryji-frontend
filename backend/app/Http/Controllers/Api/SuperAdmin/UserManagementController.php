<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserManagementController extends Controller
{
    /**
     * Every library-owning (admin) user, with every Library they belong to
     * (via `tenant_user`, not a single `tenant`) plus each Library's plan
     * and resource counts, for the super-admin's User Management list.
     */
    public function index(Request $request)
    {
        $users = User::where('role', 'admin')
            ->withCount('tenants')
            ->with(['tenants' => function ($q) {
                $q->with('activeSubscription.plan')
                    ->withCount(['halls', 'seats', 'members']);
            }])
            ->when($request->search, function ($q) use ($request) {
                $q->where(function ($q2) use ($request) {
                    $q2->where('name', 'like', "%{$request->search}%")
                        ->orWhere('email', 'like', "%{$request->search}%")
                        ->orWhereHas('tenants', fn ($q3) => $q3->where('tenants.name', 'like', "%{$request->search}%"));
                });
            })
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15));

        return response()->json($users);
    }

    /**
     * Complete drill-down for one library owner: every Library they belong
     * to (with their role in each), each Library's halls (with seat counts),
     * membership plans, and subscription history.
     */
    public function show(User $user)
    {
        $user->load([
            'tenants.halls' => fn ($q) => $q->withCount('seats'),
            'tenants.subscriptions.plan',
            'tenants.membershipPlans',
        ]);

        $user->tenants->each->loadCount(['seats', 'members']);

        return response()->json($user);
    }
}
