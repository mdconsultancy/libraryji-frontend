<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\PlatformSetting;
use App\Services\PlanLimitService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class MemberController extends Controller
{
    public function __construct(
        private PlanLimitService $planLimits,
    ) {}

    /**
     * Photo size/format come from Admin Settings -> General
     * (`max_upload_size_mb`, `allowed_file_types`) instead of a hardcoded
     * rule, so a super admin can tighten/loosen it platform-wide without a
     * deploy. Falls back to the same 2MB/jpg,jpeg,png default the public
     * `/upload-limits` endpoint advertises to the frontend, so client and
     * server agree even when nothing has been configured yet.
     */
    private function photoValidationRule(): string
    {
        $general = PlatformSetting::getGroup('general');

        $maxMb = (int) ($general['max_upload_size_mb'] ?? 0);
        $maxKb = ($maxMb > 0 ? $maxMb : 2) * 1024;

        $extensions = collect(explode(',', $general['allowed_file_types'] ?? ''))
            ->map(fn ($ext) => strtolower(trim($ext, " .\t\n\r\0\x0B")))
            ->filter()
            ->implode(',');

        return 'nullable|file|mimes:'.($extensions !== '' ? $extensions : 'jpg,jpeg,png')."|max:{$maxKb}";
    }

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
            'photo' => $this->photoValidationRule(),
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

        // Private disk: member photos/ID proofs are personal data and must
        // not be web-accessible via a guessable /storage/... URL — served
        // instead through a signed route (see Member::photoUrl()/idProofUrl()).
        if ($request->hasFile('photo')) {
            $validated['photo_path'] = $request->file('photo')->store('members/photos', 'local');
        }

        if ($request->hasFile('id_proof')) {
            $validated['id_proof_path'] = $request->file('id_proof')->store('members/id_proofs', 'local');
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
            'photo' => $this->photoValidationRule(),
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
                Storage::disk('local')->delete($member->photo_path);
            }
            $validated['photo_path'] = $request->file('photo')->store('members/photos', 'local');
        }

        if ($request->hasFile('id_proof')) {
            if ($member->id_proof_path) {
                Storage::disk('local')->delete($member->id_proof_path);
            }
            $validated['id_proof_path'] = $request->file('id_proof')->store('members/id_proofs', 'local');
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
