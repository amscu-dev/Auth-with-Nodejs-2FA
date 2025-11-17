"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import React, { useState } from "react";
import { MdOutlineDeleteOutline } from "react-icons/md";
import client from "@/services/index";
import { useTheme } from "next-themes";
import { PasskeyResponseSchema } from "@/schemas/passkey.validator";
import { startAuthentication, WebAuthnError } from "@simplewebauthn/browser";
import { hasUserHandle } from "@/lib/helpers";
import { toast } from "sonner";
import { Loader } from "lucide-react";

interface PasskeyItemProps {
  aaguid: {
    icon_dark: string;
    icon_light: string;
    name: string;
  };
  credentialid: string;
  createdAt: Date;
  lastUsed: Date;
  refetch: () => void;
  userid: string;
}

const PasskeyItem: React.FC<PasskeyItemProps> = ({
  aaguid: { icon_dark, icon_light, name },
  createdAt,
  lastUsed,
  refetch,
  credentialid,
  userid,
}) => {
  // SERVICE
  const { mutate: init, isPending: isPendingInit } =
    client.Passkey.RemovePasskeyInit.useMutation();
  const { mutate: verify, isPending: isPendingVerify } =
    client.Passkey.RemovePasskeyVerify.useMutation();
  // THEME
  const { resolvedTheme } = useTheme();
  // DISABLED STATE
  const [isAuthenticatingPasskey, setIsAuthenticatingPasskey] =
    useState<boolean>(false);
  const disabledState =
    isPendingInit || isPendingVerify || isAuthenticatingPasskey;
  // handle remove passkey
  const onRemovePasskey = async () => {
    await init(
      { userid, credentialid },
      {
        onSuccess: async (data) => {
          try {
            const {
              data: { publicKeyCredentialRequestOptions },
            } = PasskeyResponseSchema.signInInit.parse(data);
            try {
              setIsAuthenticatingPasskey(true);
              const credential = await startAuthentication({
                optionsJSON: {
                  ...publicKeyCredentialRequestOptions,
                },
              });

              if (!hasUserHandle(credential)) {
                toast.error(
                  "Unable to retrieve the user identifier. Please try again or sign in using your original authentication method."
                );
                return;
              }
              await verify(
                { data: credential, userid, credentialid },
                {
                  onSuccess: () => {
                    toast.success("Passkey removed successfully.");
                    refetch();
                  },
                  onError: () => {
                    setIsAuthenticatingPasskey(false);
                  },
                }
              );
            } catch (error) {
              setIsAuthenticatingPasskey(false);
              if (error instanceof WebAuthnError) {
                toast.error(error.message);
                console.error(error);
              } else {
                toast.error(
                  "There was an error processing your request please try again later"
                );
              }
            }
          } catch (error) {
            toast.error(
              "There was an error processing your request please try again later"
            );
            console.error(error);
          }
        },
      }
    );
  };
  return (
    <div className="flex border-b-[1px] border-slate-400 w-3/5 pb-3 gap-3 pt-4">
      <div className="w-10 aspect-square bg-muted-foreground/20 rounded-[3px] relative flex items-center justify-center">
        <Image
          fill
          src={resolvedTheme === "light" ? icon_light : icon_dark}
          alt="logo"
          className="object-contain p-[3px]"
        />
      </div>
      <div>
        <p className="text-sm font-mono tracking-wider font-semibold">{name}</p>
        <p className="text-[10px]">
          Created:{" "}
          {new Intl.DateTimeFormat("en", { dateStyle: "full" }).format(
            new Date(createdAt)
          )}
        </p>
        <p className="text-[10px]">
          Last used:{" "}
          {new Intl.DateTimeFormat("en", { dateStyle: "full" }).format(
            new Date(lastUsed)
          )}
        </p>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <Button
          disabled={disabledState}
          size="icon"
          variant="outline"
          className="shadow-none active:translate-x-0 active:translate-y-0 disabled:translate-x-0 disabled:translate-y-0 border-none hover:bg-primary text-primary hover:text-white disabled:bg-primary"
          onClick={onRemovePasskey}
        >
          {disabledState ? (
            <Loader className="animate-spin text-white" />
          ) : (
            <MdOutlineDeleteOutline />
          )}
        </Button>
      </div>
    </div>
  );
};

export default PasskeyItem;
