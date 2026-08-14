"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";

/** Shown when the tenant's trial has expired — data stays browsable, but
 *  writes are blocked both here (useReadOnly()-gated buttons) and on the
 *  backend (EnsureTenantIsActive), so this always tells the truth about
 *  what a click will do. */
export default function ReadOnlyBanner() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-lighterror text-error px-6 py-3 mx-3 mt-3 rounded-xl">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon icon="solar:lock-linear" width={18} height={18} />
        Your subscription has expired. You can view your data, but adding or editing is disabled until you renew.
      </div>
      <Link href="/billing" className="shrink-0 rounded-md bg-error text-white text-sm font-semibold px-4 py-1.5 hover:opacity-90">
        Renew Subscription
      </Link>
    </div>
  );
}
