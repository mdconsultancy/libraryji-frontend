<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserManagementController extends Controller
{
    /**
     * Every tenant-owning (library admin) user, with their library's plan
     * and resource counts, for the super-admin's User Management list.
     */
    public function index(Request $request)
    {
        $users = User::where('role', 'admin')
            ->with(['tenant' => function ($q) {
                $q->with('activeSubscription.plan')
                    ->withCount(['halls', 'seats', 'members']);
            }])
            ->when($request->search, function ($q) use ($request) {
                $q->where(function ($q2) use ($request) {
                    $q2->where('name', 'like', "%{$request->search}%")
                        ->orWhere('email', 'like', "%{$request->search}%")
                        ->orWhereHas('tenant', fn ($q3) => $q3->where('name', 'like', "%{$request->search}%"));
                });
            })
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15));

        return response()->json($users);
    }

    /**
     * Complete drill-down for one library owner: their library, its halls
     * (each with a seat count), membership plans, and subscription history.
     */
    public function show(User $user)
    {
        $user->load([
            'tenant.halls' => fn ($q) => $q->withCount('seats'),
            'tenant.subscriptions.plan',
            'tenant.membershipPlans',
        ])->loadMissing('tenant');

        $user->tenant?->loadCount(['seats', 'members']);

        return response()->json($user);
    }
}
