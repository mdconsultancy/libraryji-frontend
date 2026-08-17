import { Icon } from "@iconify/react";
import FullLogo from "@/app/(DashboardLayout)/layout/shared/logo/FullLogo";

interface AuthImagePanelProps {
  variant: "login" | "register";
}

const COPY = {
  login: {
    title: "Welcome back to your Library",
    subtitle: "Sign in to manage members, seats, fees and attendance — all from one dashboard.",
  },
  register: {
    title: "Start running your Library digitally",
    subtitle: "Set up seats, plans and members in minutes — no paperwork, no spreadsheets.",
  },
} as const;

/**
 * 60%-width decorative panel for the split login/register layout. There's no
 * real library photograph in the asset library, so this is an illustrated
 * bookshelf motif (gradient + book-spine stripes + a duotone library icon)
 * rather than a stock photo — swap the background for a real photo later by
 * replacing the two gradient/stripe layers below with an <Image>.
 */
export default function AuthImagePanel({ variant }: AuthImagePanelProps) {
  const copy = COPY[variant];

  return (
    <div className="relative hidden lg:flex lg:w-[60%] min-h-screen overflow-hidden bg-primary">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primaryemphasis to-dark" />

      {/* Bookshelf-spine stripes */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(255,255,255,0.9) 0px, rgba(255,255,255,0.9) 6px, transparent 6px, transparent 34px)",
        }}
      />
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.6) 2px, transparent 2px, transparent 120px)",
        }}
      />

      {/* Large duotone library icon watermark */}
      <Icon
        icon="solar:library-bold-duotone"
        className="absolute -right-16 -bottom-16 text-white/10"
        width={420}
        height={420}
      />

      <div className="relative z-10 flex flex-col justify-between w-full p-12 xl:p-16 text-white">
        <div className="bg-white rounded-lg px-3 py-2 w-fit">
          <FullLogo />
        </div>

        {/* Headings pick up `text-dark`/`dark:text-white` from the global h1-h6
            base style (see globals.css), which — being an explicit rule on the
            element itself — beats the `text-white` inherited from this
            container, so it needs to be set explicitly here too. */}
        <div className="max-w-md">
          <h2 className="text-3xl xl:text-4xl font-bold leading-tight mb-4 text-white">{copy.title}</h2>
          <p className="text-white/80 text-base leading-relaxed">{copy.subtitle}</p>
        </div>

        <div className="flex items-center gap-6 text-sm text-white/70">
          <div className="flex items-center gap-2">
            <Icon icon="solar:users-group-rounded-bold-duotone" width={20} height={20} />
            Member management
          </div>
          <div className="flex items-center gap-2">
            <Icon icon="solar:wallet-money-bold-duotone" width={20} height={20} />
            Fees & payments
          </div>
        </div>
      </div>
    </div>
  );
}
