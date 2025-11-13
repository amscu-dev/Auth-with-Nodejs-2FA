"use client";
import React from "react";
import { FiUser } from "react-icons/fi";

import { useAuthContext } from "@/context/auth-provider";
import { Skeleton } from "@/components/ui/skeleton";

interface HomeSidebarHeaderProps {}

const EmailSkeleton = () => {
  return (
    <Skeleton className="rounded-full w-full h-[12px] bg-slate-300 leading-none" />
  );
};

const HomeSidebarHeader: React.FC<HomeSidebarHeaderProps> = () => {
  const { user, isLoading } = useAuthContext();
  return (
    <div className="px-2 py-2 border-b w-full">
      <div className="overflow-hidden bg-sidebar px-2 py-3 flex items-center gap-2">
        <span>
          <FiUser className="text-xs text-accent" />
        </span>
        {isLoading ? (
          <EmailSkeleton />
        ) : (
          <span className="text-xs font-mono font-medium leading-none truncate">
            {user?.email}
          </span>
        )}
      </div>
    </div>
  );
};

export default HomeSidebarHeader;
