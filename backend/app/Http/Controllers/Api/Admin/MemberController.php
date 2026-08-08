<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Services\PlanLimitService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class MemberController extends Controller
{
    public function __construct(
        private PlanLimitService $planLimits,
    ) {}

    public function index(Request $request)
    {
        $members = Member::with(['activeSubscription.plan', 'activeSubscription.seat'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->search, function ($q) use ($request) {
                $q->where(function ($q2) use ($request) {
                    $q2->where('name', 'like', "%{$request->search}%")
                        ->orWhere('phone', 'like', "%{$request->search}%")
                        ->orWhere('member_code', 'like', "%{$request->search}%")
                        ->orWhere('email', 'like', "%{$request->search}%");
                });
            })
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15));

        return response()->json($members);
    }

    public function store(Request $request)
    {
        $tenant = $request->user()->currentTenant;

        if ($limit = $this->planLimits->limit($tenant, 'members')) {
            if ($this->planLimits->wouldExceed($tenant, 'members')) {
                return response()->json(['message' => $this->planLimits->limitMessage('members', $limit)], 422);
            }
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'required|string|max:20',
            'photo' => 'nullable|image|max:2048',
            'address' => 'nullable|string|max:500',
            'id_proof_type' => 'nullable|string|max:50',
            'id_proof_number' => 'nullable|string|max:100',
            'id_proof' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:4096',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|in:male,female,other',
            'join_date' => 'required|date',
            'status' => 'in:active,inactive,expired',
            'notes' => 'nullable|string',
        ]);

        $validated['member_code'] = $this->generateMemberCode();

        if ($request->hasFile('photo')) {
            $validated['photo_path'] = $request->file('photo')->store('members/photos', 'public');
        }

        if ($request->hasFile('id_proof')) {
            $validated['id_proof_path'] = $request->file('id_proof')->store('members/id_proofs', 'public');
        }

        $member = Member::create($validated);

        return response()->json($member, 201);
    }

    public function show(Request $request, Member $member)
    {
        $member->load([
            'activeSubscription.plan',
            'activeSubscription.seat',
            'subscriptions.plan',
            'subscriptions.seat',
            'attendances' => fn ($q) => $q->latest('date')->limit(10),
            'payments' => fn ($q) => $q->latest('paid_at')->limit(10),
        ]);

        return response()->json($member);
    }

    public function update(Request $request, Member $member)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'sometimes|required|string|max:20',
            'photo' => 'nullable|image|max:2048',
            'address' => 'nullable|string|max:500',
            'id_proof_type' => 'nullable|string|max:50',
            'id_proof_number' => 'nullable|string|max:100',
            'id_proof' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:4096',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|in:male,female,other',
            'join_date' => 'sometimes|required|date',
            'status' => 'in:active,inactive,expired',
            'notes' => 'nullable|string',
        ]);

        if ($request->hasFile('photo')) {
            if ($member->photo_path) {
                Storage::disk('public')->delete($member->photo_path);
            }
            $validated['photo_path'] = $request->file('photo')->store('members/photos', 'public');
        }

        if ($request->hasFile('id_proof')) {
            if ($member->id_proof_path) {
                Storage::disk('public')->delete($member->id_proof_path);
            }
            $validated['id_proof_path'] = $request->file('id_proof')->store('members/id_proofs', 'public');
        }

        $member->update($validated);

        return response()->json($member);
    }

    public function destroy(Request $request, Member $member)
    {
        $member->delete();

        return response()->json(['message' => 'Member deleted successfully.']);
    }

    private function generateMemberCode(): string
    {
        $tenantId = Auth::user()->current_tenant_id;
        $prefix = 'MEM';
        $count = Member::withoutGlobalScopes()->where('tenant_id', $tenantId)->count() + 1;

        return $prefix.'-'.str_pad((string) $count, 5, '0', STR_PAD_LEFT);
    }
}
