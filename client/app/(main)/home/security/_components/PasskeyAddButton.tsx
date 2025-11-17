import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import React, { useState } from "react";
import client from "@/services/index";
import { useAuthContext } from "@/context/auth-provider";
import { PasskeyResponseSchema } from "@/schemas/passkey.validator";
import { startRegistration, WebAuthnError } from "@simplewebauthn/browser";
import { toast } from "sonner";
interface PasskeyAddButtonProps {
  buttonClass?: string;
  refetchPasskeys: () => void;
}

const PasskeyAddButton: React.FC<PasskeyAddButtonProps> = ({
  buttonClass,
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
              setIsCreatingPasskey(true);
              const credential = await startRegistration({
                optionsJSON: {
                  ...publicKeyOpts,
                },
              });
              await verify(
                { data: credential, userid: user._id },
                {
                  onSuccess: () => {
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
    <Button
      className={buttonClass}
      size="sm"
      onClick={handleAddPasskey}
      disabled={disabledState}
    >
      {disabledState ? (
        <Loader className="animate-spin text-white" />
      ) : (
        "Add Passkey"
      )}
    </Button>
  );
};

export default PasskeyAddButton;
