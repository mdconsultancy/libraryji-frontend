"use client";

import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";

const Profile = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const canViewLibrary = usePermission("library", "view");
  const showLibraryInfo = (user?.role === "admin" || user?.role === "staff") && canViewLibrary;
  const showSubscription = user?.role === "admin" || user?.role === "staff";

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  return (
    <div className="relative group/menu">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <span className="h-10 w-10 hover:text-primary hover:bg-lightprimary rounded-full flex justify-center items-center cursor-pointer group-hover/menu:bg-lightprimary group-hover/menu:text-primary">
            <Image
              src="/images/profile/user-1.jpg"
              alt="Profile"
              height={35}
              width={35}
              className="rounded-full"
            />
          </span>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56 rounded-sm shadow-md p-2">
          {user && (
            <div className="px-3 py-2 border-b border-border mb-1">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-darklink truncate">{user.email}</p>
            </div>
          )}

          <DropdownMenuItem asChild>
            <Link
              href="/user-profile"
              className="px-3 py-2 flex items-center w-full gap-3 text-darkLink hover:bg-lightprimary hover:text-primary"
            >
              <Icon icon="solar:user-circle-outline" height={20} />
              My Profile
            </Link>
          </DropdownMenuItem>

          {showSubscription && (
            <DropdownMenuItem asChild>
              <Link
                href="/billing"
                className="px-3 py-2 flex items-center w-full gap-3 text-darkLink hover:bg-lightprimary hover:text-primary"
              >
                <Icon icon="solar:card-outline" height={20} />
                My Subscription
              </Link>
            </DropdownMenuItem>
          )}

          {showLibraryInfo && (
            <DropdownMenuItem asChild>
              <Link
                href="/settings"
                className="px-3 py-2 flex items-center w-full gap-3 text-darkLink hover:bg-lightprimary hover:text-primary"
              >
                <Icon icon="solar:buildings-3-outline" height={20} />
                Library Info
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem asChild>
            <Link
              href="/help"
              className="px-3 py-2 flex items-center w-full gap-3 text-darkLink hover:bg-lightprimary hover:text-primary"
            >
              <Icon icon="solar:question-circle-outline" height={20} />
              Help
            </Link>
          </DropdownMenuItem>

          <div className="p-3 pt-0">
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default Profile;
