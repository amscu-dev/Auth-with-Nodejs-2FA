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
import client from "@/services/index";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { RotatingLines } from "react-loader-spinner";
import { IoIosArrowRoundForward } from "react-icons/io";
import { FaCheckCircle } from "react-icons/fa";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { env } from "@/env";

interface SignInMfaCardProps {
  on2MfaMethod: (method: "totp" | "backup-code") => void;
}

const SignInMfaCard: React.FC<SignInMfaCardProps> = ({ on2MfaMethod }) => {
  // NAVIGATION
  const router = useRouter();
  // SERVICES
  const { mutate: sendTOTP, isPending: isPendingTOTP } =
    client.Mfa.VerifyLogin.useMutation();
  // FORM STATE
  const form = useForm<z.infer<typeof MfaRequestSchema.verifyCodeLogin>>({
    resolver: zodResolver(MfaRequestSchema.verifyCodeLogin),
    defaultValues: {
      code: "",
    },
    mode: "onTouched",
  });

  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);

  // DISABLE STATE
  const disableState = isPendingTOTP || isRedirecting;
  // HANDLE FORM SUBMIT
  const onSumbit = async (
    formData: z.infer<typeof MfaRequestSchema.verifyCodeLogin>
  ) => {
    await sendTOTP(formData, {
      onSuccess: (data) => {
        if (data.data.nextStep === "OK") {
          setIsRedirecting(true);
          toast.success(
            "Authentication successful. You will be redirected to your dashboard ..."
          );
          router.replace(env.NEXT_PUBLIC_LOGIN_REDIRECT);
        }
      },
      onError: (error) => {
        if (error.status === 401 || error.status === 403) {
          setIsRedirecting(true);
          router.replace(env.NEXT_PUBLIC_FAILED_LOGIN_REDIRECT);
        }
        if (error.response && error.response.data.message) {
          form.setError("code", { message: error.response.data.message });
          form.setFocus("code");
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
          Enter verification code
        </CardTitle>
        <CardDescription className="text-center sm:text-[12px] font-medium">
          Enter the <span className="text-accent">6-digit code</span> from your
          authenticator.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSumbit)}>
            <div className="flex items-center justify-center flex-col gap-12">
              <FormField
                control={form.control}
                name="code"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormControl>
                      <InputOTP
                        maxLength={6}
                        inputMode="numeric"
                        pattern={REGEXP_ONLY_DIGITS}
                        autoFocus
                        disabled={disableState}
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
                    on2MfaMethod("backup-code");
                  }}
                >
                  Use a backup code instead.
                </Button>
                <Button
                  size="lg"
                  disabled={disableState}
                  className="group relative w-full"
                >
                  {!isRedirecting ? <span>Send</span> : null}

                  <span className="absolute right-2">
                    <RotatingLines
                      visible={isPendingTOTP}
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

export default SignInMfaCard;
