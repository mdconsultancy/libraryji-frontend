<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\StorageUsageService;
use Illuminate\Http\Request;

class UserManagementController extends Controller
{
    public function __construct(private readonly StorageUsageService $storage) {}

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

        // Storage isn't columns on any table (it's computed from files on
        // disk + information_schema), so it's added after pagination rather
        // than selected/eager-loaded — one estimate per already-paginated row.
        $users->getCollection()->transform(function (User $user) {
            $usage = $this->storage->forTenants($user->tenants);
            $user->db_storage_mb = StorageUsageService::bytesToMb($usage['db_bytes']);
            $user->media_storage_mb = StorageUsageService::bytesToMb($usage['media_bytes']);

            return $user;
        });

        return response()->json($users);
    }

    /**
     * Complete drill-down for one library owner: every Library they belong
     * to (with their role in each), each Library's halls (with seat counts),
     * membership plans, subscription history, expense totals, and a
     * database/media storage estimate per Library plus an overall total.
     */
    public function show(User $user)
    {
        $user->load([
            'tenants.halls' => fn ($q) => $q->withCount('seats'),
            'tenants.subscriptions.plan',
            'tenants.membershipPlans',
        ]);

        $user->tenants->each->loadCount(['seats', 'members', 'expenses']);
        $user->tenants->each->loadSum('expenses', 'amount');

        $totalDbBytes = 0;
        $totalMediaBytes = 0;

        $user->tenants->each(function ($tenant) use (&$totalDbBytes, &$totalMediaBytes) {
            $usage = $this->storage->forTenant($tenant);
            $tenant->db_storage_mb = StorageUsageService::bytesToMb($usage['db_bytes']);
            $tenant->media_storage_mb = StorageUsageService::bytesToMb($usage['media_bytes']);
            $totalDbBytes += $usage['db_bytes'];
            $totalMediaBytes += $usage['media_bytes'];
        });

        $user->db_storage_mb = StorageUsageService::bytesToMb($totalDbBytes);
        $user->media_storage_mb = StorageUsageService::bytesToMb($totalMediaBytes);

        return response()->json($user);
    }

    /**
     * Deletes a library-owning user, but only once every Library they belong
     * to is empty of real data — deleting the user would otherwise orphan
     * (or, via any FK cascade, silently wipe) member records, payment
     * history, seats, halls, and staff accounts that belong to the tenant,
     * not the individual admin who happened to create it.
     */
    public function destroy(User $user)
    {
        $hasActiveData = $user->tenants()
            ->where(function ($q) {
                $q->has('members')
                    ->orHas('seats')
                    ->orHas('halls')
                    ->orHas('expenses')
                    ->orHas('staff');
            })
            ->exists();

        if ($hasActiveData) {
            return response()->json([
                'message' => 'This user has active library data. Please delete/clean up tenant data first.',
            ], 422);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully.']);
    }
}
