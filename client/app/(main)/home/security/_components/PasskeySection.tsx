"use client";
import React from "react";
import { GoPasskeyFill } from "react-icons/go";
import client from "@/api/index";
import { useAuthContext } from "@/context/auth-provider";
import PasskeysNotFoundCard from "./PasskeysNotFoundCard";
import PasskeyItem from "./PasskeyItem";
import { Skeleton } from "@/components/ui/skeleton";
import PasskeyAddButton from "./PasskeyAddButton";
interface PasskeySectionProps {}

const PasskeySection: React.FC<PasskeySectionProps> = () => {
  // USER CONTEXT
  const { user } = useAuthContext();
  // SERVICE
  const { data, isLoading, refetch } = client.Passkey.GetAll.useQuery(
    user?._id || ""
  );
  // DERIVED STATE
  const passkeys = data?.data?.passkeys ?? [];
  const userHasPasskeys = passkeys.length > 0;
  return (
    <div className="flex flex-col overflow-y-auto w-full flex-1 gap-4">
      <div className="flex items-center justify-start gap-2 w-3/5">
        <GoPasskeyFill className="text-muted-foreground/90" />
        <h1 className="text-base font-semibold">Passkey (Biometrics)</h1>
        {userHasPasskeys ? (
          <PasskeyAddButton
            buttonClass="w-24 ml-auto"
            refetchPasskeys={refetch}
          />
        ) : null}
      </div>
      {isLoading ? (
        <div className="flex flex-col gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex h-14 w-3/5">
              <Skeleton className="h-full w-10 mr-3 rounded-[14px] bg-slate-300" />
              <Skeleton className="h-full w-44 mr-12 rounded-[14px] bg-slate-300" />
              <Skeleton className="h-full w-8 mr-6 rounded-[14px] bg-slate-300" />
            </div>
          ))}
        </div>
      ) : userHasPasskeys ? (
        <div className="h-80 w-full flex flex-col py-2 overflow-y-auto">
          {passkeys.map((passkey) => (
            <PasskeyItem
              key={passkey.credentialId}
              aaguid={passkey.aaguid}
              credentialid={passkey.credentialId}
              createdAt={passkey.createdAt}
              lastUsed={passkey.lastUsed}
              refetch={refetch}
              userid={user?._id || ""}
            />
          ))}
        </div>
      ) : (
        <div className="w-full flex-1 flex items-center justify-center ">
          <PasskeysNotFoundCard refetchPasskeys={refetch} />
        </div>
      )}
    </div>
  );
};

export default PasskeySection;
