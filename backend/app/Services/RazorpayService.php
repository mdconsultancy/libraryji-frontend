<?php

namespace App\Services;

use App\Models\PlatformSetting;
use Illuminate\Support\Facades\Http;

/**
 * Minimal Razorpay REST client (Orders API + payment signature verification).
 * Uses raw HTTP + HMAC rather than the razorpay/razorpay SDK to avoid adding
 * a composer dependency for what is, functionally, two API calls and one
 * hash comparison. Credentials come from Super Admin > Settings > Payment,
 * which already stores them (encrypted at rest for the secret).
 */
class RazorpayService
{
    private const API_BASE = 'https://api.razorpay.com/v1';

    public function isConfigured(): bool
    {
        $settings = PlatformSetting::getGroup('payment');

        return ! empty($settings['razorpay_enabled'])
            && ! empty($settings['razorpay_key_id'])
            && ! empty($settings['razorpay_key_secret']);
    }

    public function keyId(): ?string
    {
        return PlatformSetting::getGroup('payment')['razorpay_key_id'] ?? null;
    }

    private function keySecret(): ?string
    {
        return PlatformSetting::getGroup('payment')['razorpay_key_secret'] ?? null;
    }

    /**
     * Create a Razorpay order for the given amount (in the currency's base unit, e.g. rupees).
     * Returns the decoded Razorpay order payload, or null on failure.
     */
    public function createOrder(float $amount, string $receipt, array $notes = []): ?array
    {
        $response = Http::withBasicAuth($this->keyId(), $this->keySecret())
            ->asJson()
            ->post(self::API_BASE.'/orders', [
                'amount' => (int) round($amount * 100), // paise
                'currency' => 'INR',
                'receipt' => $receipt,
                'notes' => $notes,
            ]);

        return $response->successful() ? $response->json() : null;
    }

    /**
     * Verify the signature Razorpay returns after a successful checkout.
     * See: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/build-integration/#step-5-verify-payment-signature
     */
    public function verifySignature(string $orderId, string $paymentId, string $signature): bool
    {
        $secret = $this->keySecret();
        if (! $secret) {
            return false;
        }

        $expected = hash_hmac('sha256', $orderId.'|'.$paymentId, $secret);

        return hash_equals($expected, $signature);
    }
}
