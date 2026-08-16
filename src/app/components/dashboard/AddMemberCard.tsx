"use client";
import Link from "next/link";
import { Icon } from "@iconify/react";

/** Dashboard quick-action card — jumps to the Members page with the Add Member wizard already open (?add=1). */
const AddMemberCard = () => {
  return (
    <div className="rounded-xl h-full shadow-xs bg-[#16A34A]/20 border border-[#16A34A]/20 dark:bg-[#16A34A]/15 dark:border-[#16A34A]/20 p-6 relative w-full flex flex-col">
      <div className="flex items-center gap-4 mb-4">
        <div className="h-12 w-12 rounded-full bg-[#16A34A] flex items-center justify-center shrink-0">
          <Icon icon="solar:user-plus-bold-duotone" width={24} height={24} className="text-white" />
        </div>
        <div>
          <p className="text-lg font-semibold text-dark dark:text-white">Add Member</p>
          <p className="text-xs text-darklink mt-0.5">Register a new student</p>
        </div>
      </div>

      <Link
        href="/members?add=1"
        className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-md bg-[#16A34A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#16A34A]/90 transition-colors"
      >
        <Icon icon="solar:add-circle-linear" width={18} height={18} />
        Add Member
      </Link>
    </div>
  );
};

export default AddMemberCard;
