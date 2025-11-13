"use client";
import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MdOutlineDashboardCustomize } from "react-icons/md";
import { MdOutlineSecurity } from "react-icons/md";
interface HomeSidebarContentProps {}

const HomeSidebarContent: React.FC<HomeSidebarContentProps> = () => {
  const pathname = usePathname();

  return (
    <div className="px-2 py-6 w-full">
      <div className="flex flex-col items-center justify-center gap-2">
        <Button
          className="w-full relative"
          variant={pathname === "/home/dashboard" ? "default" : "ghost"}
          asChild
        >
          <Link href="/home/dashboard">
            <MdOutlineDashboardCustomize className="hidden sm:block absolute top-1/2 -translate-y-1/2 -translate-x-12" />
            Dashboard
          </Link>
        </Button>
        <Button
          className="w-full relative"
          variant={pathname === "/home/security" ? "default" : "ghost"}
          asChild
        >
          <Link href="/home/security">
            <MdOutlineSecurity className="hidden sm:block absolute top-1/2 -translate-y-1/2 -translate-x-10" />
            Security
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default HomeSidebarContent;
