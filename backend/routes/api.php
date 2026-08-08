<?php

use App\Http\Controllers\Api\Admin\AttendanceController;
use App\Http\Controllers\Api\Admin\BillingController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\ExpenseController;
use App\Http\Controllers\Api\Admin\HallController;
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
Route::get('/plans', [PublicPlanController::class, 'index']);
Route::get('/theme', [PublicThemeController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
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
        Route::post('select-plan/order', [PlanSelectionController::class, 'createOrder']);
        Route::post('select-plan/verify', [PlanSelectionController::class, 'verify']);
    });

    // Read-only billing history for the tenant's own SaaS subscription — admin & staff can view.
    Route::middleware(['role:admin,staff'])->get('admin/billing', [BillingController::class, 'index']);
    Route::middleware(['role:admin,staff'])->get('admin/plan-limits', [BillingController::class, 'limits']);

    // Tenant-scoped routes: accessible to admin & staff of an active tenant.
    Route::middleware(['tenant.active', 'role:admin,staff'])->prefix('admin')->group(function () {
        Route::apiResource('halls', HallController::class);

        Route::post('seats/bulk', [SeatController::class, 'bulkStore']);
        Route::apiResource('seats', SeatController::class);

        Route::apiResource('shifts', ShiftController::class);
        Route::apiResource('membership-plans', MembershipPlanController::class);

        Route::apiResource('members', MemberController::class);

        Route::post('subscriptions/{memberSubscription}/renew', [MemberSubscriptionController::class, 'renew']);
        Route::apiResource('subscriptions', MemberSubscriptionController::class)
            ->parameters(['subscriptions' => 'memberSubscription']);

        Route::post('attendance/check-in', [AttendanceController::class, 'checkIn']);
        Route::post('attendance/{attendance}/check-out', [AttendanceController::class, 'checkOut']);
        Route::apiResource('attendance', AttendanceController::class)->except(['store']);

        Route::apiResource('payments', PaymentController::class);
        Route::apiResource('expenses', ExpenseController::class);

        Route::get('dashboard/summary', [DashboardController::class, 'summary']);
        Route::get('dashboard/revenue-chart', [DashboardController::class, 'revenueChart']);
        Route::get('dashboard/attendance-chart', [DashboardController::class, 'attendanceChart']);
        Route::get('dashboard/expiring-memberships', [DashboardController::class, 'expiringMemberships']);
        Route::get('dashboard/recent-members', [DashboardController::class, 'recentMembers']);

        // Staff management and tenant settings are admin-only.
        Route::middleware('role:admin')->group(function () {
            Route::apiResource('staff', StaffController::class);
            Route::get('tenant-settings', [TenantSettingsController::class, 'show']);
            Route::put('tenant-settings', [TenantSettingsController::class, 'update']);
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
