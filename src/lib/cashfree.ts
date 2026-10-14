// Thin client-side wrapper around Cashfree.js (v3), loaded on demand.

export interface CashfreeCheckoutResult {
  error?: { message?: string };
  paymentDetails?: { paymentMessage?: string };
  redirect?: boolean;
}

interface CashfreeInstance {
  checkout: (options: { paymentSessionId: string; redirectTarget?: "_modal" | "_self" | "_blank" }) => Promise<CashfreeCheckoutResult>;
}

declare global {
  interface Window {
    Cashfree?: (config: { mode: "sandbox" | "production" }) => CashfreeInstance;
  }
}

let scriptPromise: Promise<void> | null = null;

export function loadCashfreeScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Cashfree) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  const promise: Promise<void> = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Cashfree checkout script."));
    document.body.appendChild(script);
  }).catch((err: unknown) => {
    scriptPromise = null;
    throw err;
  });
  scriptPromise = promise;

  return promise;
}

/** Opens Cashfree's checkout as a modal and resolves once it closes or completes. */
export async function openCashfreeCheckout(
  paymentSessionId: string,
  mode: "sandbox" | "production"
): Promise<CashfreeCheckoutResult> {
  await loadCashfreeScript();
  if (!window.Cashfree) throw new Error("Cashfree checkout is unavailable.");
  const cashfree = window.Cashfree({ mode });
  return cashfree.checkout({ paymentSessionId, redirectTarget: "_modal" });
}
