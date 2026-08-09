<?php

use App\Http\Controllers\Api\Admin\AttendanceController;
use App\Http\Controllers\Api\Admin\BillingController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\ExpenseController;
use App\Http\Controllers\Api\Admin\HallController;
use App\Http\Controllers\Api\Admin\LeadController;
use App\Http\Controllers\Api\Admin\LibraryController;
use App\Http\Controllers\Api\Admin\MemberController;
use App\Http\Controllers\Api\Admin\MembershipPlanController;
use App\Http\Controllers\Api\Admin\MemberSubscriptionController;
use App\Http\Controllers\Api\Admin\PaymentController;
use App\Http\Controllers\Api\Admin\PlanSelectionController;
use App\Http\Controllers\Api\Admin\SeatController;
use App\Http\Controllers\Api\Admin\ShiftController;
use App\Http\Controllers\Api\Admin\StaffController;
use App\Http\Controllers\Api\Admin\TenantSettingsController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\PublicPlanController;
use App\Http\Controllers\Api\PublicThemeController;
use App\Http\Controllers\Api\SuperAdmin\AuditLogController;
use App\Http\Controllers\Api\SuperAdmin\DashboardController as SuperAdminDashboardController;
use App\Http\Controllers\Api\SuperAdmin\SettingsController;
use App\Http\Controllers\Api\SuperAdmin\SubscriptionController as SuperAdminSubscriptionController;
use App\Http\Controllers\Api\SuperAdmin\SubscriptionPlanController;
use App\Http\Controllers\Api\SuperAdmin\TenantController;
use App\Http\Controllers\Api\SuperAdmin\UserManagementController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
// Exchanges a still-valid refresh token for a new access/refresh pair.
// Deliberately outside auth:jwt — by the time this is called the access
// token has usually already expired, so there's nothing to authenticate
// the request with except the refresh token itself.
Route::post('/auth/refresh', [AuthController::class, 'refresh']);
Route::get('/plans', [PublicPlanController::class, 'index']);
Route::get('/theme', [PublicThemeController::class, 'show']);
Route::get('/upload-limits', [PublicThemeController::class, 'uploadLimits']);

Route::middleware('auth:jwt')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);

    // Library/workspace switching — admin-only; staff is rejected inside the
    // controller even for a library it does have a membership for.
    Route::post('/auth/select-library', [AuthController::class, 'selectLibrary']);

    // Plan selection / Razorpay checkout: reachable as soon as the tenant admin
    // is authenticated, regardless of whether a plan is active yet — this is
    // what activates one (used for both post-registration payment and
    // reactivating a suspended/trial-expired tenant).
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::post('select-plan/trial', [PlanSelectionController::class, 'startTrial']);
        Route::post('select-plan/order', [PlanSelectionController::class, 'createOrder']);
        Route::post('select-plan/verify', [PlanSelectionController::class, 'verify']);

        // Account-wide Library count/limit + adding an additional Library.
        // Deliberately not behind `tenant.active` — these operate on the
        // admin's account as a whole, not the currently selected workspace,
        // so a suspended *current* Library must never block them.
        Route::get('libraries-summary', [LibraryController::class, 'summary']);
        Route::post('libraries', [LibraryController::class, 'store']);
    });

    // Read-only billing history for the tenant's own SaaS subscription — admin & staff can view.
    Route::middleware(['role:admin,staff'])->get('admin/billing', [BillingController::class, 'index']);
    Route::middleware(['role:admin,staff'])->get('admin/plan-limits', [BillingController::class, 'limits']);

    // Tenant-scoped routes: accessible to admin & staff of an active tenant.
    Route::middleware(['tenant.active', 'role:admin,staff'])->prefix('admin')->group(function () {
        // Halls, Members, Payments, and Library (tenant-settings) are the
        // granular-permission modules — every verb is broken out individually
        // (an apiResource line can't carry a different `permission:` per
        // action) and gated by `permission:{module},{action}`. Admin/
        // super_admin always pass; only staff is actually restricted by what
        // was configured on their tenant_user row for this Library.
        Route::middleware('permission:halls,view')->get('halls', [HallController::class, 'index']);
        Route::middleware('permission:halls,view')->get('halls/{hall}', [HallController::class, 'show']);
        Route::middleware('permission:halls,add')->post('halls', [HallController::class, 'store']);
        Route::middleware('permission:halls,edit')->put('halls/{hall}', [HallController::class, 'update']);
        Route::middleware('permission:halls,edit')->patch('halls/{hall}', [HallController::class, 'update']);
        Route::middleware('permission:halls,delete')->delete('halls/{hall}', [HallController::class, 'destroy']);

        Route::post('seats/bulk', [SeatController::class, 'bulkStore']);
        Route::apiResource('seats', SeatController::class);

        Route::apiResource('shifts', ShiftController::class);

        // Membership Plans is staff-managed only — the Library Admin no
        // longer creates/manages these at all (product decision), so this
        // narrows the group's blanket admin,staff access down to staff.
        Route::middleware('role:staff')->group(function () {
            Route::apiResource('membership-plans', MembershipPlanController::class);
        });

        // Must be registered before members/{member} — otherwise "trashed" is
        // matched as the {member} id parameter instead of this literal path.
        Route::middleware('permission:members,view')->get('members/trashed', [MemberController::class, 'trashed']);
        Route::middleware('permission:members,delete')->post('members/{member}/restore', [MemberController::class, 'restore']);

        Route::middleware('permission:members,view')->get('members', [MemberController::class, 'index']);
        Route::middleware('permission:members,view')->get('members/{member}', [MemberController::class, 'show']);
        Route::middleware('permission:members,add')->post('members', [MemberController::class, 'store']);
        Route::middleware('permission:members,edit')->put('members/{member}', [MemberController::class, 'update']);
        Route::middleware('permission:members,edit')->patch('members/{member}', [MemberController::class, 'update']);
        Route::middleware('permission:members,delete')->delete('members/{member}', [MemberController::class, 'destroy']);

        Route::middleware('permission:members,view')->get('leads', [LeadController::class, 'index']);
        Route::middleware('permission:members,view')->get('leads/{lead}', [LeadController::class, 'show']);
        Route::middleware('permission:members,add')->post('leads', [LeadController::class, 'store']);
        Route::middleware('permission:members,edit')->put('leads/{lead}', [LeadController::class, 'update']);
        Route::middleware('permission:members,edit')->patch('leads/{lead}', [LeadController::class, 'update']);
        Route::middleware('permission:members,delete')->delete('leads/{lead}', [LeadController::class, 'destroy']);

        Route::post('subscriptions/{memberSubscription}/renew', [MemberSubscriptionController::class, 'renew']);
        Route::apiResource('subscriptions', MemberSubscriptionController::class)
            ->parameters(['subscriptions' => 'memberSubscription']);

        Route::post('attendance/check-in', [AttendanceController::class, 'checkIn']);
        Route::post('attendance/{attendance}/check-out', [AttendanceController::class, 'checkOut']);
        Route::apiResource('attendance', AttendanceController::class)->except(['store']);

        Route::middleware('permission:payments,view')->get('payments', [PaymentController::class, 'index']);
        Route::middleware('permission:payments,view')->get('payments/{payment}', [PaymentController::class, 'show']);
        Route::middleware('permission:payments,add')->post('payments', [PaymentController::class, 'store']);
        Route::middleware('permission:payments,edit')->put('payments/{payment}', [PaymentController::class, 'update']);
        Route::middleware('permission:payments,edit')->patch('payments/{payment}', [PaymentController::class, 'update']);
        Route::middleware('permission:payments,delete')->delete('payments/{payment}', [PaymentController::class, 'destroy']);

        Route::apiResource('expenses', ExpenseController::class);

        Route::get('dashboard/summary', [DashboardController::class, 'summary']);
        Route::get('dashboard/revenue-chart', [DashboardController::class, 'revenueChart']);
        Route::get('dashboard/attendance-chart', [DashboardController::class, 'attendanceChart']);
        Route::get('dashboard/expiring-memberships', [DashboardController::class, 'expiringMemberships']);
        Route::get('dashboard/recent-members', [DashboardController::class, 'recentMembers']);
        Route::get('dashboard/recent-activity', [DashboardController::class, 'recentActivity']);

        // Library module: view/edit only (it's a single settings resource per
        // Library, no add/delete concept). Staff can now reach it too, but
        // only with the matching permission — previously admin-only outright.
        Route::middleware('permission:library,view')->get('tenant-settings', [TenantSettingsController::class, 'show']);
        Route::middleware('permission:library,edit')->put('tenant-settings', [TenantSettingsController::class, 'update']);

        // Staff management stays admin-only — staff must never manage other
        // staff accounts or grant/revoke permissions, regardless of what
        // permissions they hold on the four modules above.
        Route::middleware('role:admin')->group(function () {
            Route::apiResource('staff', StaffController::class);
        });
    });

    // Platform-level routes: super admin only.
    Route::middleware('role:super_admin')->prefix('super-admin')->group(function () {
        Route::post('tenants/{tenant}/suspend', [TenantController::class, 'suspend']);
        Route::post('tenants/{tenant}/activate', [TenantController::class, 'activate']);
        Route::post('tenants/{tenant}/regenerate-code', [TenantController::class, 'regenerateCode']);
        Route::apiResource('tenants', TenantController::class);

        Route::apiResource('subscription-plans', SubscriptionPlanController::class)
            ->parameters(['subscription-plans' => 'subscriptionPlan']);

        Route::get('settings', [SettingsController::class, 'all']);
        Route::get('settings/{group}', [SettingsController::class, 'show']);
        Route::put('settings/{group}', [SettingsController::class, 'update']);
        Route::post('settings/smtp/test-email', [SettingsController::class, 'testEmail']);
        Route::post('settings/payment/test-razorpay', [SettingsController::class, 'testRazorpay']);
        Route::post('settings/theme/upload', [SettingsController::class, 'uploadThemeAsset']);

        Route::apiResource('audit-logs', AuditLogController::class)->only(['index', 'show']);

        // Platform-wide read-only views across all tenants.
        Route::get('subscriptions', [SuperAdminSubscriptionController::class, 'index']);

        Route::get('users', [UserManagementController::class, 'index']);
        Route::get('users/{user}', [UserManagementController::class, 'show']);

        Route::get('dashboard/summary', [SuperAdminDashboardController::class, 'summary']);
        Route::get('dashboard/tenant-growth-chart', [SuperAdminDashboardController::class, 'tenantGrowthChart']);
        Route::get('dashboard/revenue-chart', [SuperAdminDashboardController::class, 'revenueChart']);
    });
});
