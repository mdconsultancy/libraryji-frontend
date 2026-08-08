// Thin client-side wrapper around Razorpay Checkout (checkout.js), loaded on demand.

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: "payment.failed", handler: (response: { error: { description?: string; reason?: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

let scriptPromise: Promise<void> | null = null;

export function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  const promise: Promise<void> = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout script."));
    document.body.appendChild(script);
  }).catch((err: unknown) => {
    // A failed load (network blip, ad-blocker) must not be cached forever —
    // otherwise every retry rejects instantly without even trying again.
    scriptPromise = null;
    throw err;
  });
  scriptPromise = promise;

  return promise;
}

export async function openRazorpayCheckout(
  options: RazorpayCheckoutOptions,
  onFailed?: (message: string) => void
) {
  await loadRazorpayScript();
  if (!window.Razorpay) throw new Error("Razorpay checkout is unavailable.");
  const instance = new window.Razorpay(options);
  if (onFailed) {
    instance.on("payment.failed", (response) => {
      onFailed(response.error?.description || response.error?.reason || "Payment failed. Please try again.");
    });
  }
  instance.open();
}
