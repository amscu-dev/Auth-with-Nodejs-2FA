import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { IoShieldCheckmarkSharp } from "react-icons/io5";
import client from "@/api/index";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import z from "zod";
import { MfaRequestSchema } from "@/schemas/mfa.validator";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS, REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { FieldError } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { Loader } from "lucide-react";
import { useAuthContext } from "@/context/auth-provider";
import { toast } from "sonner";

interface DisableMfaProps {}
const DisableMfa: React.FC<DisableMfaProps> = () => {
  // AUTH CONTEXT
  const { refetch } = useAuthContext();
  // SERVICE
  const { mutate: disableMfaWithTotpCode, isPending: isPendingDisableMfaTOTP } =
    client.Mfa.Revoke.useMutation();
  const {
    mutate: disableMfaWithBackupCode,
    isPending: isPendingDisableMfaBackupCode,
  } = client.Mfa.BackUpCodeConsume.useMutation();
  // FORM STATE
  const totpForm = useForm<z.infer<typeof MfaRequestSchema.revoke>>({
    resolver: zodResolver(MfaRequestSchema.revoke),
    defaultValues: {
      code: "",
    },
    mode: "onTouched",
  });
  const backupForm = useForm<
    z.infer<typeof MfaRequestSchema.disableWithBackupCode>
  >({
    resolver: zodResolver(MfaRequestSchema.disableWithBackupCode),
    defaultValues: {
      backupCode: "",
    },
    mode: "onTouched",
  });

  // OTHER STATE
  const [mfaDisabledMethod, setMfaDisabledMethod] = useState<"mfa" | "backup">(
    "mfa"
  );
  // DIALOG LOGIC
  const [open, setOpen] = useState<boolean>(false);

  // HANDLE SUBMIT
  const onSubmitCode = async ({
    code,
  }: z.infer<typeof MfaRequestSchema.revoke>) => {
    await disableMfaWithTotpCode(
      { code },
      {
        onSuccess: () => {
          refetch();
          toast.success(
            "Two-Factor Authentication has been successfully disabled!"
          );
          setOpen(false);
        },
        onError: (error) => {
          if (error.response && error.response.data.message) {
            totpForm.setError("code", { message: error.response.data.message });
          }
        },
      }
    );
  };
  const onSubmitBackup = async ({
    backupCode,
  }: z.infer<typeof MfaRequestSchema.disableWithBackupCode>) => {
    await disableMfaWithBackupCode(
      { backupCode },
      {
        onSuccess: () => {
          refetch();
          toast.success(
            "Two-Factor Authentication has been successfully disabled!"
          );
          setOpen(false);
        },
        onError: (error) => {
          if (error.response && error.response.data.message) {
            backupForm.setError("backupCode", {
              message: error.response.data.message,
            });
          }
        },
      }
    );
  };

  return (
    <>
      <div className="flex items-center justify-center gap-1">
        <span className="text-sm font-bold">Enabled</span>
        <IoShieldCheckmarkSharp className="text-green-600" />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="ml-5 w-52" variant="secondary">
            Disable
          </Button>
        </DialogTrigger>
        <DialogContent
          className="w-full max-w-md gap-0 pt-10"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {mfaDisabledMethod === "mfa" ? (
            // TOTP FORM
            <>
              <DialogHeader className="pb-6 mb-6">
                <DialogTitle className="font-bold text-xl">
                  Disable Two-Factor Authentication (TOTP)
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground/70">
                  Enter the 6-digit code from your authenticator app to confirm
                  that you want to disable Two-Factor Authentication on your
                  account.
                </DialogDescription>
              </DialogHeader>
              <Form {...totpForm}>
                <form
                  key="TOTP-FORM"
                  onSubmit={totpForm.handleSubmit(onSubmitCode)}
                >
                  <FormField
                    control={totpForm.control}
                    name="code"
                    render={({ field, fieldState }) => (
                      <FormItem className="flex items-center justify-center">
                        <FormControl>
                          <InputOTP
                            maxLength={6}
                            inputMode="numeric"
                            autoFocus={false}
                            pattern={REGEXP_ONLY_DIGITS}
                            disabled={isPendingDisableMfaTOTP}
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
                            "bg-card border rounded-[4px] px-4 py-2 text-xs absolute bottom-0 left-12 translate-y-[120%] z-50",
                            fieldState.invalid ? "" : "hidden opacity-0"
                          )}
                          errors={[fieldState.error]}
                        />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center justify-end 2xl:mt-8 gap-4  mt-24">
                    <Button
                      variant="link"
                      className="text-xs font-light"
                      disabled={isPendingDisableMfaTOTP}
                      type="button"
                      onClick={() => {
                        totpForm.reset();
                        setMfaDisabledMethod("backup");
                      }}
                    >
                      Use backup code instead
                    </Button>
                    <DialogClose asChild>
                      <Button
                        variant="outline"
                        disabled={isPendingDisableMfaTOTP}
                        onClick={() => totpForm.reset()}
                      >
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button
                      className="w-32"
                      disabled={isPendingDisableMfaTOTP}
                      type="submit"
                    >
                      {isPendingDisableMfaTOTP ? (
                        <Loader className="animate-spin text-primary" />
                      ) : (
                        "Disable"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </>
          ) : (
            // BACKUP FORM
            <>
              <DialogHeader className="pb-6 mb-6">
                <DialogTitle className="font-bold text-xl">
                  Disable 2FA with Backup Code
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground/70">
                  Enter one of your previously saved backup codes to disable
                  Two-Factor Authentication. Use this option only if you no
                  longer have access to your authenticator app. Once completed,
                  your account will no longer require MFA at sign-in.
                </DialogDescription>
              </DialogHeader>
              <Form {...backupForm}>
                <form
                  key="BACKUP-FORM"
                  onSubmit={backupForm.handleSubmit(onSubmitBackup)}
                >
                  <FormField
                    control={backupForm.control}
                    name="backupCode"
                    render={({ field, fieldState }) => (
                      <FormItem className="flex items-center justify-center">
                        <FormControl>
                          <InputOTP
                            maxLength={8}
                            autoFocus={false}
                            pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                            disabled={isPendingDisableMfaBackupCode}
                            {...field}
                          >
                            <InputOTPGroup className="gap-2 text-accent font-bold">
                              <InputOTPSlot index={0} className="border" />
                              <InputOTPSlot index={1} className="border" />
                              <InputOTPSlot index={2} className="border" />
                              <InputOTPSlot index={3} className="border" />
                              <InputOTPSlot index={4} className="border" />
                              <InputOTPSlot index={5} className="border" />
                              <InputOTPSlot index={6} className="border" />
                              <InputOTPSlot index={7} className="border" />
                            </InputOTPGroup>
                          </InputOTP>
                        </FormControl>
                        <FieldError
                          id={`${field.name}-error`}
                          className={cn(
                            "bg-card border rounded-[4px] px-4 py-2 text-xs absolute bottom-0 left-12 translate-y-[120%] z-50",
                            fieldState.invalid ? "" : "hidden opacity-0"
                          )}
                          errors={[fieldState.error]}
                        />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center justify-end 2xl:mt-8 gap-4  mt-24">
                    <Button
                      variant="link"
                      className="text-xs font-light"
                      disabled={isPendingDisableMfaBackupCode}
                      type="button"
                      onClick={() => {
                        backupForm.reset();
                        setMfaDisabledMethod("mfa");
                      }}
                    >
                      Use authenticator
                    </Button>
                    <DialogClose asChild>
                      <Button
                        variant="outline"
                        disabled={isPendingDisableMfaBackupCode}
                        onClick={() => backupForm.reset()}
                      >
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button
                      className="w-32"
                      disabled={isPendingDisableMfaBackupCode}
                      type="submit"
                    >
                      {isPendingDisableMfaBackupCode ? (
                        <Loader className="animate-spin text-primary" />
                      ) : (
                        "Disable"
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

export default DisableMfa;
