import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import React, { useId, useState } from "react";
import { TbXboxXFilled } from "react-icons/tb";
import client from "@/api/index";
import { Loader } from "lucide-react";
import Image from "next/image";
import { FiCopy } from "react-icons/fi";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { MfaRequestSchema } from "@/schemas/mfa.validator";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { FieldError } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { CiCircleInfo } from "react-icons/ci";
import { FaCircleCheck } from "react-icons/fa6";
import { toast } from "sonner";
import { useAuthContext } from "@/context/auth-provider";

interface EnableMfaProps {}
const EnableMfa: React.FC<EnableMfaProps> = () => {
  // userSession for refetch
  const { refetch } = useAuthContext();
  // SERVICE
  const {
    data: setupData,
    mutate: enableMfa,
    isPending: isPendingMfa,
  } = client.Mfa.Setup.useMutation();
  const {
    data: verifySetupData,
    mutate: verifyMfa,
    isPending: isPendingMfaVerifySetup,
  } = client.Mfa.VerifySetup.useMutation();
  // DIALOG LOGIC
  const [open, setOpen] = useState<boolean>(false);
  const dialogId = useId();
  // FORM STATE
  const form = useForm<z.infer<typeof MfaRequestSchema.verifySetup>>({
    resolver: zodResolver(MfaRequestSchema.verifySetup),
    defaultValues: {
      code: "",
    },
    mode: "onTouched",
  });
  // OTHER STATE
  const [copiedSecret, setCopiedSecret] = useState<boolean>(false);
  const [copiedCodes, setCopiedCodes] = useState<boolean>(false);
  // DISABLED STATE
  const [isMfaEnabled, setMfaEnabled] = useState<boolean>(false);
  const disabledState = isPendingMfaVerifySetup || isMfaEnabled;
  const handleEnableMfa = async () => {
    await enableMfa(undefined, {
      onSuccess: (data) => {
        setOpen(true);
        console.log(data);
      },
    });
  };

  const onSubmit = ({ code }: z.infer<typeof MfaRequestSchema.verifySetup>) => {
    verifyMfa(
      { code },
      {
        onSuccess: () => {
          toast.success(
            "Two-Factor Authentication has been successfully enabled!"
          );
          setMfaEnabled(true);
        },
        onError: (error) => {
          if (error.response?.data?.message) {
            form.setError("code", { message: error.response.data.message });
          }
        },
      }
    );
  };

  const handleCopyCodes = async () => {
    const codes = verifySetupData?.data.userPreferences.backupCodes.join(", ");
    if (!codes) {
      return;
    }
    await navigator.clipboard.writeText(codes);
    setCopiedCodes(true);
    setTimeout(() => {
      setCopiedCodes(false);
    }, 3000);
  };
  const handleCopySecret = async () => {
    const secret = setupData?.data.secret;
    if (!secret) {
      return;
    }
    await navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => {
      setCopiedSecret(false);
    }, 3000);
  };
  return (
    <>
      <div className="flex items-center justify-center gap-1">
        <span className="text-sm font-bold">Disabled</span>
        <TbXboxXFilled className="text-primary" />
      </div>
      <Button
        disabled={isPendingMfa}
        className="ml-5 w-52"
        variant="secondary"
        aria-haspopup="dialog"
        aria-controls={dialogId}
        aria-expanded={open}
        onClick={handleEnableMfa}
      >
        {isPendingMfa ? (
          <Loader className="animate-spin text-primary" />
        ) : (
          "Enable"
        )}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent id={dialogId} className="w-full max-w-sm gap-0">
          <DialogHeader className="pb-6">
            <DialogTitle className="font-bold text-xl">
              {!isMfaEnabled
                ? "Turn on 2-Step Verification"
                : "Two factor backup codes"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Prevent widespread cyberattacks with simple 2FA.
            </DialogDescription>
          </DialogHeader>
          <div className="w-full h-[0.5px] bg-border/40 mb-6" />
          {isMfaEnabled ? (
            <>
              <h2 className="font-bold text-accent text-sm">STEP 3</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Backup codes are used to access your account in the event that
                you cannot receive two-factor authentication. For security
                reason every code can only be used once.
              </p>
              <div className="bg-border/5 grid grid-cols-2 gap-4 px-2 py-4 mb-6">
                {verifySetupData?.data.userPreferences.backupCodes.map(
                  (code) => (
                    <p
                      className="text-center font-mono tracking-widest"
                      key={code}
                    >
                      {code}
                    </p>
                  )
                )}
                <div
                  className="flex items-center justify-between  col-span-2  bg-border/30 rounded-[10px] pl-4
                "
                >
                  <span>
                    <CiCircleInfo />
                  </span>
                  <p className="text-[10px]">
                    Store your backup codes in a secure place.
                  </p>
                  <Button
                    variant="ghost"
                    className="rounded-[10px] disabled:translate-x-0 disabled:translate-y-0
                  active:translate-x-0 active:translate-y-0 group"
                    onClick={handleCopyCodes}
                  >
                    {copiedCodes ? (
                      <FaCircleCheck className="text-green-700 group-hover:text-white" />
                    ) : (
                      <FiCopy />
                    )}
                  </Button>
                </div>
              </div>
              <DialogClose
                asChild
                onClick={() => {
                  refetch();
                  form.reset();
                }}
              >
                <Button className="w-full">Finish</Button>
              </DialogClose>
            </>
          ) : (
            <>
              <h2 className="font-bold text-accent text-sm">STEP 1</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Open the authenticator and choose scan barcode.
              </p>
              <div className="flex items-center justify-center w-full aspect-video relative mb-4">
                <div className="w-1/2 aspect-square border border-muted-foreground/30 rounded-[10px] p-1 relative">
                  <Image
                    fill
                    className="object-contain rounded-[10px]"
                    src={setupData?.data.qrImageUrl || ""}
                    alt="qr code"
                  />
                </div>

                <div className="bg-gradient-to-b from-accent/25 to-sky-50/25 absolute w-full bottom-0 slide-top-back border-t-2 border-accent"></div>
              </div>
              {/* Separator */}
              <div className="w-full flex items-center justify-center gap-2 my-6">
                <div className="w-full h-[0.5px] bg-border/40" />
                <span className="text-muted-foreground text-xs text-nowrap font-semibold">
                  OR enter the code manually
                </span>
                <div className="w-full h-[0.5px] bg-border/40" />
              </div>
              {/* CODE */}
              <div className="flex items-center gap-2 mb-6">
                <div className="border border-border/40 rounded-[10px] h-full flex items-center justify-center px-4 py-1 w-full bg-border/5">
                  <p className="font-mono tracking-widest">
                    {setupData?.data.secret}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  className="border border-border/40 rounded-[10px]
                  disabled:translate-x-0 disabled:translate-y-0
                  active:translate-x-0 active:translate-y-0 group"
                  onClick={handleCopySecret}
                >
                  {copiedSecret ? (
                    <FaCircleCheck className="text-green-700 group-hover:text-white" />
                  ) : (
                    <FiCopy />
                  )}
                </Button>
              </div>
              <div className="w-full h-[0.5px] bg-border/40 mb-6" />
              <h2 className="font-bold text-accent text-sm">STEP 2</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Enter the 6-digit code from authenticator application.
              </p>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field, fieldState }) => (
                      <FormItem className="flex items-center justify-center">
                        <FormControl>
                          <InputOTP
                            maxLength={6}
                            inputMode="numeric"
                            pattern={REGEXP_ONLY_DIGITS}
                            disabled={disabledState}
                            {...field}
                          >
                            <InputOTPGroup className="gap-4  text-accent font-bold">
                              <InputOTPSlot index={0} className="border" />
                              <InputOTPSlot index={1} className="border" />
                              <InputOTPSlot index={2} className="border" />
                              <InputOTPSlot index={3} className="border" />
                              <InputOTPSlot index={4} className="border" />
                              <InputOTPSlot index={5} className="border" />
                            </InputOTPGroup>
                          </InputOTP>
                        </FormControl>
                        <FieldError
                          id={`${field.name}-error`}
                          className={cn(
                            "bg-card border rounded-[4px] px-4 py-2 text-xs absolute top-0 left-4 -translate-y-[110%] z-50",
                            fieldState.invalid ? "" : "hidden opacity-0"
                          )}
                          errors={[fieldState.error]}
                        />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center justify-end mt-4 2xl:mt-8 gap-4">
                    <DialogClose asChild>
                      <Button
                        variant="outline"
                        disabled={disabledState}
                        onClick={() => form.reset()}
                      >
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button
                      className="w-32"
                      disabled={disabledState}
                      type="submit"
                    >
                      {disabledState ? (
                        <Loader className="animate-spin text-primary" />
                      ) : (
                        "Setup"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EnableMfa;
