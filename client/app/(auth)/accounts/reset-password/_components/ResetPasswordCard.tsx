"use client";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import client from "@/services/index";
import { useForm } from "react-hook-form";
import z from "zod";
import { AuthRequestSchema } from "@/schemas/auth.validator";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { HiViewGridAdd } from "react-icons/hi";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FormInput from "@/components/form/FormInput";
import { RotatingLines } from "react-loader-spinner";
import { IoIosArrowRoundForward } from "react-icons/io";
import { FaCheckCircle } from "react-icons/fa";
import { TbLockPassword } from "react-icons/tb";
import Link from "next/link";
import { toast } from "sonner";
import ResetPasswordErrorCard from "./ResetPasswordErrorCard";
import ResetPasswordCardFallback from "./ResetPasswordCardFallback";
interface ResetPasswordCardProps {}

const ResetPasswordCard: React.FC<ResetPasswordCardProps> = () => {
  // SEARCH PARAMS
  const searchParams = useSearchParams();
  const verificationCode = searchParams.get("code");
  const expirationDate = searchParams.get("exp");
  // NAVIGATION
  const router = useRouter();
  // SERVICE
  const { mutate: resetPassword, isPending: isResetingPassword } =
    client.PasswordAuth.ResetPassword.useMutation();
  // FORM STATE
  const form = useForm<z.infer<typeof AuthRequestSchema.password>>({
    resolver: zodResolver(AuthRequestSchema.password),
    defaultValues: {
      password: "",
    },
    mode: "onTouched",
  });
  // Password Reset State
  const [isResetSuccess, setIsResetSuccess] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isCheckingParams, setIsCheckingParams] = useState(true);
  const disabledState = isResetingPassword || isResetSuccess;

  // CHECK PARAMS
  useEffect(() => {
    if (!verificationCode || !expirationDate) {
      toast.error(
        "Invalid or missing password reset link. Please request a new one."
      );
      router.replace("/accounts/signin");
    } else {
      setIsCheckingParams(false);
    }
  }, [verificationCode, expirationDate, router, setIsCheckingParams]);

  // SUMBIT STATE
  const onSubmit = async ({
    password,
  }: z.infer<typeof AuthRequestSchema.password>) => {
    if (!verificationCode) {
      toast.error("Missing verification code!");
      return;
    }
    await resetPassword(
      { password, verificationCode },
      {
        onSuccess: () => {
          toast.success(
            "Password changed! You can now log in with the new one."
          );
          setIsResetSuccess(true);
        },
        onError: (error) => {
          if (error.response && error.response.data.message) {
            form.setError("password", { message: error.response.data.message });
            requestAnimationFrame(() => {
              form.setFocus("password");
            });
          }
        },
      }
    );
  };

  if (isCheckingParams) {
    return <ResetPasswordCardFallback />;
  }

  if (Date.now() > Number(expirationDate)) {
    return <ResetPasswordErrorCard />;
  }

  return (
    <div>
      <div className="flex items-center justify-center">
        <HiViewGridAdd className="text-4xl sm:text-5xl" />
      </div>
      <CardHeader className="pt-3 gap-3">
        <CardTitle className="text-xl sm:text-2xl text-center font-semibold">
          {isResetSuccess ? (
            <div>
              <span>Password changed successfully</span>
            </div>
          ) : (
            <div className="flex items-center justify-center sm:gap-3 gap-1">
              <TbLockPassword />
              <span>Change your password</span>
            </div>
          )}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm text-center">
          {isResetSuccess ? (
            <span>
              Your password has been updated. You can now use your new password
              to log in.
            </span>
          ) : (
            <span>
              Enter a new password for your account. Make sure it’s strong —
              include letters, numbers, and special characters.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="sm:flex-row flex-col flex items-stretch justify-center gap-4">
              <FormInput
                name="password"
                placeholder="Please enter your new password"
                inputClass="h-10 sm:h-full"
                inputContainerClass="h-full"
                disabled={disabledState}
                autoComplete="off"
                type={showPassword ? "text" : "password"}
              />
              <Button
                size="lg"
                disabled={disabledState}
                type="submit"
                className="group relative"
              >
                {!isResetSuccess ? <span>Reset</span> : null}

                <span className="absolute right-2">
                  <RotatingLines
                    visible={isResetingPassword}
                    height="20"
                    width="20"
                    color="#ffffff"
                    ariaLabel="mutating-dots-loading"
                  />
                </span>
                {!disabledState && (
                  <IoIosArrowRoundForward className="absolute right-2 opacity-0 group-hover:opacity-100 transition-all duration-150 -translate-x-3 group-hover:translate-x-0" />
                )}
                {isResetSuccess && <FaCheckCircle />}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="pb-0">
        {!isResetSuccess ? (
          <Button
            size="lg"
            variant="link"
            className="pl-0"
            disabled={isResetingPassword}
            onClick={() => setShowPassword((p) => !p)}
          >
            Show password
          </Button>
        ) : (
          <Button variant="secondary" className="w-full" size="lg">
            <Link href="/accounts/signin" replace>
              Take me to Login
            </Link>
          </Button>
        )}
      </CardFooter>
    </div>
  );
};

export default ResetPasswordCard;
