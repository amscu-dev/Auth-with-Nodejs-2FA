"use client";
import { Button } from "@/components/ui/button";
import React from "react";
import { GrLogout } from "react-icons/gr";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import client from "@/api/index";
import { Loader } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { env } from "@/env";

interface HomeSidebarFooterProps {}

const HomeSidebarFooter: React.FC<HomeSidebarFooterProps> = () => {
  // NAVIGATION
  const router = useRouter();
  // SERVICE
  const { mutate: logout, isPending: isLoggingOut } =
    client.PasswordAuth.Logout.useMutation();

  const handleLogout = async () => {
    await logout(undefined, {
      onSuccess: () => {
        toast.success("You have been logged out successfully.");
        router.replace(env.NEXT_PUBLIC_LOGOUT_REDIRECT);
      },
    });
  };
  return (
    <div className="px-2 pb-5 mt-auto w-full">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button className="w-full relative" variant="outline">
            <GrLogout className="hidden sm:block absolute top-1/2 -translate-y-1/2 -translate-x-10" />
            Logout
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log Out of Your Account?</AlertDialogTitle>
            <AlertDialogDescription className="">
              Are you sure you want to log out? You will be signed out from this
              device, but your account and data will remain safe. You can log in
              again at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isLoggingOut}
              className="w-full sm:w-20"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleLogout()}
              disabled={isLoggingOut}
              className="w-full sm:w-28"
            >
              Logout
              {isLoggingOut ? (
                <Loader className="animate-spin absolute left-3" />
              ) : null}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HomeSidebarFooter;
