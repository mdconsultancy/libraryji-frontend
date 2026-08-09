<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\PlatformSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class SettingsController extends Controller
{
    /**
     * Groups this controller manages and which of their keys are sensitive
     * (encrypted at rest, masked when read back).
     */
    private const GROUPS = [
        'payment' => [
            'razorpay_enabled', 'razorpay_key_id', 'razorpay_key_secret', 'razorpay_webhook_secret',
            'stripe_enabled', 'stripe_publishable_key', 'stripe_secret_key',
            'currency', 'currency_symbol', 'tax_percentage', 'tax_label',
            'invoice_prefix', 'billing_cycle_default', 'company_name',
        ],
        'smtp' => [
            'mail_host', 'mail_port', 'mail_encryption', 'mail_username',
            'mail_password', 'mail_from_address', 'mail_from_name',
        ],
        'theme' => [
            'mode', 'primary_color', 'secondary_color', 'accent_color',
            'font_family', 'logo_path', 'favicon_path', 'custom_css',
        ],
        'admin_ui' => [
            'sidebar_color', 'navbar_color', 'dashboard_theme',
            'button_style', 'layout', 'border_radius', 'compact_mode',
        ],
        'security' => [
            'password_min_length', 'password_require_uppercase', 'password_require_number',
            'password_require_symbol', 'two_factor_required', 'session_timeout_minutes',
            'max_login_attempts', 'lockout_minutes', 'ip_whitelist', 'ip_blacklist',
            'api_rate_limit_per_minute',
        ],
        'general' => [
            'site_name', 'timezone', 'date_format', 'time_format', 'language',
            'max_upload_size_mb', 'allowed_file_types', 'system_notifications_enabled',
            'support_email', 'support_phone',
        ],
    ];

    /**
     * Keys that are logically booleans. Settings are stored as plain strings
     * (the platform_settings.value column is just text), so without this we
     * round-trip `true` as the string "1" — which then fails a strict
     * `=== true` check on the frontend and every toggle silently reverts to
     * "off" after a reload. Cast explicitly both ways instead of relying on
     * PHP's implicit string coercion.
     */
    private const BOOLEAN_KEYS = [
        'razorpay_enabled', 'stripe_enabled',
        'compact_mode',
        'password_require_uppercase', 'password_require_number', 'password_require_symbol', 'two_factor_required',
        'system_notifications_enabled',
    ];

    private const ENCRYPTED_KEYS = [
        'razorpay_key_secret', 'razorpay_webhook_secret', 'stripe_secret_key', 'mail_password',
    ];

    /**
     * Secrets are encrypted at rest (see PlatformSetting::setGroup) but are
     * returned to the client in full — only an authenticated super_admin can
     * reach these endpoints, and the frontend displays them behind a masked
     * password input with a reveal toggle, same as any other password field.
     * We deliberately do NOT send back a fixed placeholder like "••••••••"
     * instead of the real value: that previously caused the saved value to
     * look "empty"/gone after every save, and made it easy for the frontend
     * to accidentally round-trip the placeholder itself into a save.
     */
    public function show(string $group)
    {
        $this->ensureValidGroup($group);

        $values = $this->castBooleans($group, PlatformSetting::getGroup($group));

        return response()->json(['group' => $group, 'settings' => (object) $values]);
    }

    public function all()
    {
        $result = [];
        foreach (array_keys(self::GROUPS) as $group) {
            // Cast to stdClass so an empty group serializes as `{}`, not `[]` —
            // the frontend always expects an object per group and a bare `[]`
            // breaks that assumption once the user starts editing it.
            $result[$group] = (object) $this->castBooleans($group, PlatformSetting::getGroup($group));
        }

        return response()->json($result);
    }

    public function update(Request $request, string $group)
    {
        $this->ensureValidGroup($group);

        $allowedKeys = self::GROUPS[$group];
        $validator = Validator::make($request->all(), [
            'settings' => 'required|array',
        ]);
        $validator->validate();

        $incoming = collect($request->input('settings'))->only($allowedKeys)->toArray();

        foreach (self::BOOLEAN_KEYS as $key) {
            if (array_key_exists($key, $incoming)) {
                $incoming[$key] = filter_var($incoming[$key], FILTER_VALIDATE_BOOLEAN) ? '1' : '0';
            }
        }

        PlatformSetting::setGroup($group, $incoming, self::ENCRYPTED_KEYS);

        $values = $this->castBooleans($group, PlatformSetting::getGroup($group));

        return response()->json(['group' => $group, 'settings' => (object) $values]);
    }

    /**
     * Upload the platform logo or favicon. Settings themselves are plain
     * key/value strings, so a file field can't go through update() — this
     * stores the file and writes the resulting path straight into
     * platform_settings (group=theme), same as if it had been saved there.
     */
    public function uploadThemeAsset(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:logo,favicon',
            'file' => 'required|image|max:2048',
        ]);

        $key = $validated['type'] === 'logo' ? 'logo_path' : 'favicon_path';
        $existing = PlatformSetting::getGroup('theme')[$key] ?? null;

        $path = $request->file('file')->store('platform/theme', 'public');

        if ($existing) {
            Storage::disk('public')->delete($existing);
        }

        PlatformSetting::setGroup('theme', [$key => $path]);

        return response()->json([
            'key' => $key,
            'path' => $path,
            'url' => Storage::disk('public')->url($path),
        ]);
    }

    public function testEmail(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);

        $smtp = PlatformSetting::getGroup('smtp');

        if (empty($smtp['mail_host'])) {
            return response()->json(['message' => 'SMTP is not configured yet.'], 422);
        }

        try {
            config([
                'mail.mailers.smtp.host' => $smtp['mail_host'],
                'mail.mailers.smtp.port' => $smtp['mail_port'] ?? 587,
                'mail.mailers.smtp.encryption' => $smtp['mail_encryption'] ?? 'tls',
                'mail.mailers.smtp.username' => $smtp['mail_username'] ?? null,
                'mail.mailers.smtp.password' => $smtp['mail_password'] ?? null,
                'mail.from.address' => $smtp['mail_from_address'] ?? 'no-reply@libraryji.com',
                'mail.from.name' => $smtp['mail_from_name'] ?? 'LibraryJi',
            ]);

            Mail::raw('This is a test email from your LibraryJi platform settings.', function ($message) use ($validated, $smtp) {
                $message->to($validated['email'])
                    ->subject('LibraryJi Test Email');
            });

            return response()->json(['message' => 'Test email sent successfully.']);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to send test email: '.$e->getMessage()], 422);
        }
    }

    private function ensureValidGroup(string $group): void
    {
        abort_unless(array_key_exists($group, self::GROUPS), 404, 'Unknown settings group.');
    }

    private function castBooleans(string $group, array $values): array
    {
        foreach (self::BOOLEAN_KEYS as $key) {
            if (array_key_exists($key, $values)) {
                $values[$key] = filter_var($values[$key], FILTER_VALIDATE_BOOLEAN);
            }
        }

        return $values;
    }

    /**
     * Create a real Razorpay order from the stored credentials and hand back
     * everything the frontend's Checkout.js widget needs to actually open the
     * Razorpay payment popup against it — a true end-to-end connection test,
     * not just a silent API ping. Creating an order has no money movement
     * until someone pays it; with rzp_test_* keys nothing is ever charged.
     */
    public function testRazorpay(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:1',
        ]);

        $payment = PlatformSetting::getGroup('payment');

        if (empty($payment['razorpay_key_id']) || empty($payment['razorpay_key_secret'])) {
            return response()->json(['message' => 'Razorpay Key ID and Key Secret must be saved first.'], 422);
        }

        $currency = $payment['currency'] ?? 'INR';

        $response = Http::withBasicAuth($payment['razorpay_key_id'], $payment['razorpay_key_secret'])
            ->post('https://api.razorpay.com/v1/orders', [
                'amount' => (int) round($validated['amount'] * 100),
                'currency' => $currency,
                'receipt' => 'settings-test-'.now()->timestamp,
                'notes' => ['purpose' => 'LibraryJi platform settings connection test'],
            ]);

        if ($response->failed()) {
            $message = $response->json('error.description') ?? 'Razorpay rejected the request.';

            return response()->json(['message' => 'Razorpay test failed: '.$message], 422);
        }

        return response()->json([
            'key_id' => $payment['razorpay_key_id'],
            'is_live' => ! str_starts_with($payment['razorpay_key_id'], 'rzp_test_'),
            'order_id' => $response->json('id'),
            'amount' => $response->json('amount'),
            'currency' => $response->json('currency'),
            'company_name' => $payment['company_name'] ?? 'LibraryJi',
        ]);
    }
}
