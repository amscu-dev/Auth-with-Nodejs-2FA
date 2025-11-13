import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { FaKeycdn } from "react-icons/fa";
import { GrFingerPrint } from "react-icons/gr";
import { MdImportantDevices } from "react-icons/md";
import { AiOutlineSafetyCertificate } from "react-icons/ai";
import client from "@/api/index";
import { useAuthContext } from "@/context/auth-provider";
import { PasskeyResponseSchema } from "@/schemas/passkey.validator";
import { startRegistration, WebAuthnError } from "@simplewebauthn/browser";
import { toast } from "sonner";
interface PasskeysNotFoundCardProps {
  refetchPasskeys: () => void;
}

const PasskeysNotFoundCard: React.FC<PasskeysNotFoundCardProps> = ({
  refetchPasskeys,
}) => {
  // CONTEXT
  const { user } = useAuthContext();
  // SERVICES
  const { mutate: init, isPending: isPendingInit } =
    client.Passkey.AddPasskeyInit.useMutation();
  const { mutate: verify, isPending: isPendingVerify } =
    client.Passkey.AddPasskeyVerify.useMutation();
  // DISABLED STATE
  const [isCreatingPasskey, setIsCreatingPasskey] = useState<boolean>(false);
  const disabledState = isPendingInit || isPendingVerify || isCreatingPasskey;

  const handleAddPasskey = async () => {
    if (!user?._id) return;
    await init(
      { userid: user._id },
      {
        onSuccess: async (data) => {
          try {
            const {
              data: { publicKeyOpts },
            } = PasskeyResponseSchema.signUpInit.parse(data);
            try {
              console.log(publicKeyOpts);
              setIsCreatingPasskey(true);
              const credential = await startRegistration({
                optionsJSON: {
                  ...publicKeyOpts,
                },
              });
              console.log(credential);
              await verify(
                { data: credential, userid: user._id },
                {
                  onSuccess: (data) => {
                    console.log(data);
                    toast.success(
                      "Passkey has been successfully added! You can now log in without a password."
                    );
                    refetchPasskeys();
                  },
                  onError: () => {
                    setIsCreatingPasskey(false);
                  },
                }
              );
            } catch (error) {
              setIsCreatingPasskey(false);
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
    <div className="flex flex-col items-center justify-center  gap-6">
      <div>
        <FaKeycdn className="text-6xl text-muted-foreground/80" />
      </div>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-[min-content_max-content] gap-y-1 gap-x-2">
          <span className="place-self-center">
            <GrFingerPrint className="text-xl text-muted-foreground/90" />
          </span>
          <p className="text-sm font-semibold tracking-tighter text-muted-foreground/90 justify-self-start place-self-center">
            Log in without password
          </p>
          <p className="col-start-2 font-normal text-muted-foreground/60 text-xs">
            Instead of a password, log in using your face or fingerprint.
          </p>
        </div>
        <div className="grid grid-cols-[min-content_max-content] gap-y-1 gap-x-2">
          <span className="place-self-center">
            <MdImportantDevices className="text-xl text-muted-foreground/90" />
          </span>
          <p className="text-sm font-semibold tracking-tighter text-muted-foreground/90 justify-self-start place-self-center">
            Works on all of your devices
          </p>
          <p className="col-start-2 font-normal text-muted-foreground/60 text-xs">
            Use your passkeys to log in from any synced device.
          </p>
        </div>
        <div className="grid grid-cols-[min-content_max-content] gap-y-1 gap-x-2">
          <span className="place-self-center">
            <AiOutlineSafetyCertificate className="text-xl text-muted-foreground/90" />
          </span>
          <p className="text-sm font-semibold tracking-tighter text-muted-foreground/90 justify-self-start place-self-center">
            Keep your account safer
          </p>
          <p className="col-start-2 font-normal text-muted-foreground/60 text-xs">
            Get better protection from online attacks like pishing.
          </p>
        </div>
      </div>
      <Button
        className="w-full"
        size="sm"
        onClick={handleAddPasskey}
        disabled={disabledState}
      >
        Add Passkey
      </Button>
    </div>
  );
};

export default PasskeysNotFoundCard;
