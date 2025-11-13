"use client";
import { useAuthContext } from "@/context/auth-provider";
import React from "react";
import { MdOutlineQrCodeScanner } from "react-icons/md";
import { Skeleton } from "@/components/ui/skeleton";
import EnableMfa from "./EnableMfa";
import DisableMfa from "./DisableMfa";
interface MfaSectionProps {}

const MfaSection: React.FC<MfaSectionProps> = () => {
  const { user, isLoading, isFetching } = useAuthContext();
  const hasMfa = user?.userPreferences.enable2FA;
  return (
    <>
      <div className="flex items-center justify-start gap-2">
        <MdOutlineQrCodeScanner />
        <h1 className="text-base font-semibold">Two-Factor Authentication</h1>
      </div>
      <div className="flex  gap-3 items-center h-9">
        <p className="text-xs text-muted-foreground ">
          Use an authenticator app such as Google Authenticator to add an extra
          layer of security to your account and protect your transactions.
        </p>
        {isLoading || isFetching ? (
          <>
            <div className="flex items-center justify-center  gap-5 h-full">
              <Skeleton className="w-[125px]  h-full rounded-full bg-slate-300" />
              <Skeleton className="w-[100px]  h-full rounded-full bg-slate-300" />
            </div>
          </>
        ) : hasMfa ? (
          <DisableMfa />
        ) : (
          <EnableMfa />
        )}
      </div>
    </>
  );
};

export default MfaSection;
