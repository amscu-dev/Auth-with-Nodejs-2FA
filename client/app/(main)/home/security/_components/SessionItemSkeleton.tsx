import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

const SessionItemSkeleton = () => {
  return (
    <div className="flex gap-2 py-2">
      <Skeleton className="h-10 w-10 rounded-[10px] bg-slate-300" />
      <Skeleton className="h-10 w-72 rounded-[10px] bg-slate-300" />
      <Skeleton className="h-10 w-20 rounded-[10px] bg-slate-300" />
    </div>
  );
};

export default SessionItemSkeleton;
