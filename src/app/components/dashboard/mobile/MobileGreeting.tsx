"use client";

import { Icon } from "@iconify/react";

const greetingFor = (hour: number) => {
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

/** Mobile dashboard hero card — greeting + today's date, mirrors the phone-app reference layout. */
const MobileGreeting = ({ name }: { name?: string }) => {
  const today = new Date();

  return (
    <div className="rounded-2xl bg-violet-500/20 dark:bg-violet-500/15 p-5 flex items-center justify-between gap-4 overflow-hidden">
      <div>
        <p className="text-sm text-darklink">{greetingFor(today.getHours())},</p>
        <p className="text-xl font-bold text-dark dark:text-white">{name || "Admin"} 👋</p>
        <p className="text-xs text-darklink mt-1">Here&apos;s what&apos;s happening in your library today.</p>
      </div>
      <div className="shrink-0 h-16 w-16 rounded-full bg-violet-500 flex items-center justify-center">
        <Icon icon="solar:library-bold-duotone" width={34} height={34} className="text-white" />
      </div>
    </div>
  );
};

export default MobileGreeting;
