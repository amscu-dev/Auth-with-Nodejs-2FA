"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { MfaRequestSchema } from "@/schemas/mfa.validator";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { HiViewGridAdd } from "react-icons/hi";
import z from "zod";
import client from "@/api/index";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { RotatingLines } from "react-loader-spinner";
import { IoIosArrowRoundForward } from "react-icons/io";
import { FaCheckCircle } from "react-icons/fa";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SignInBackupCodeCardProps {
  on2MfaMethod: (method: "totp" | "backup-code") => void;
}

const SignInBackupCodeCard: React.FC<SignInBackupCodeCardProps> = ({
  on2MfaMethod,
}) => {
  // NAVIGATION
  const router = useRouter();
  // SERVICES
  const { mutate: sendBackupCode, isPending: isPendingBackUpCode } =
    client.Mfa.BackUpCodeLogin.useMutation();
  // FORM STATE
  const form = useForm<z.infer<typeof MfaRequestSchema.loginWithBackupCode>>({
    resolver: zodResolver(MfaRequestSchema.loginWithBackupCode),
    defaultValues: {
      backupCode: "",
    },
    mode: "onTouched",
  });

  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);

  // DISABLE STATE
  const disableState = isPendingBackUpCode || isRedirecting;
  // HANDLE FORM SUBMIT
  const onSumbit = async (
    formData: z.infer<typeof MfaRequestSchema.loginWithBackupCode>
  ) => {
    await sendBackupCode(formData, {
      onSuccess: (data) => {
        if (data.data.nextStep === "OK") {
          setIsRedirecting(true);
          toast.success(
            "Authentication successful. You will be redirected to your dashboard ..."
          );
          router.replace("/home");
        }
      },
      onError: (error) => {
        if (error.status === 401 || error.status === 403) {
          setIsRedirecting(true);
          router.replace("/accounts/signin");
        }
        if (error.response && error.response.data.message) {
          form.setError("backupCode", { message: error.response.data.message });
          form.setFocus("backupCode");
        }
      },
    });
  };
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <div className="flex w-full items-center justify-center mb-2">
          <HiViewGridAdd size="3rem" />
        </div>
        <CardTitle className="sm:text-xl text-center font-semibold">
          Enter backup code
        </CardTitle>
        <CardDescription className="text-center sm:text-[12px] font-medium">
          Enter one of your{" "}
          <span className="text-accent">8-character backup codes</span> to
          verify your identity.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSumbit)}>
            <div className="flex items-center justify-center flex-col gap-12">
              <FormField
                control={form.control}
                name="backupCode"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormControl>
                      <InputOTP
                        maxLength={8}
                        pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                        autoFocus
                        disabled={disableState}
                        {...field}
                      >
                        <InputOTPGroup className="gap-0 text-accent font-bold">
                          <InputOTPSlot
                            index={0}
                            className="shadow-none border-r-0"
                          />
                          <InputOTPSlot
                            index={1}
                            className="shadow-none border-r-0"
                          />
                          <InputOTPSlot
                            index={2}
                            className="shadow-none border-r-0"
                          />
                          <InputOTPSlot
                            index={3}
                            className="shadow-none border-r-0"
                          />
                          <InputOTPSlot
                            index={4}
                            className="shadow-none border-r-0"
                          />
                          <InputOTPSlot
                            index={5}
                            className="shadow-none border-r-0"
                          />
                          <InputOTPSlot
                            index={6}
                            className="shadow-none border-r-0"
                          />
                          <InputOTPSlot index={7} className="shadow-none" />
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
                    <FieldError
                      id={`${field.name}-error`}
                      className={cn(
                        "bg-card border rounded-[4px] px-4 py-2 text-xs absolute bottom-0 z-50",
                        fieldState.invalid ? "show-error" : "hidden opacity-0"
                      )}
                      errors={[fieldState.error]}
                    />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between w-full">
                <Button
                  size="sm"
                  variant="link"
                  disabled={disableState}
                  onClick={() => {
                    on2MfaMethod("totp");
                  }}
                >
                  Use your authenticator code.
                </Button>
                <Button
                  size="lg"
                  disabled={disableState}
                  className="group relative w-full"
                >
                  {!isRedirecting ? <span>Send</span> : null}

                  <span className="absolute right-2">
                    <RotatingLines
                      visible={isPendingBackUpCode}
                      height="20"
                      width="20"
                      color="#ffffff"
                      ariaLabel="mutating-dots-loading"
                    />
                  </span>
                  {!disableState && (
                    <IoIosArrowRoundForward className="absolute right-8 opacity-0 group-hover:opacity-100 transition-all duration-150 -translate-x-3 group-hover:translate-x-0" />
                  )}
                  {isRedirecting && <FaCheckCircle />}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default SignInBackupCodeCard;
