"use client";
import FormInput from "@/components/form/FormInput";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import Link from "next/link";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { HiViewGridAdd } from "react-icons/hi";
import { IoIosArrowRoundForward } from "react-icons/io";
import client from "@/api/index";
import { RotatingLines } from "react-loader-spinner";
import { FaCheckCircle } from "react-icons/fa";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AuthRequestSchema } from "@/schemas/auth.validator";
interface ForgotPasswordCardProps {}

const ForgotPasswordCard: React.FC<ForgotPasswordCardProps> = () => {
  // NAVIGATION
  const router = useRouter();
  // SERVICES
  const { mutate: sendMail, isPending: isSendingEmail } =
    client.PasswordAuth.ForgotPassword.useMutation();
  // FORM STATE
  const form = useForm<z.infer<typeof AuthRequestSchema.forgotPassword>>({
    resolver: zodResolver(AuthRequestSchema.forgotPassword),
    mode: "onTouched",
    defaultValues: { email: "" },
  });
  // DISABLE STATE
  const [isEmailSent, setIsEmailSent] = useState<boolean>(false);
  const disableState = isEmailSent || isSendingEmail;
  // FORM SUBMIT LOGIC
  const onSumbit = async (
    formData: z.infer<typeof AuthRequestSchema.forgotPassword>
  ) => {
    await sendMail(formData, {
      onSuccess: ({ data: { nextStep } }) => {
        if (nextStep === "OK") {
          toast.success(
            "Email sent! Follow the instructions to reset your password."
          );
          setIsEmailSent(true);
        }
        if (nextStep === "MFA_REQUIRED") {
          router.replace("/forgot-password/mfa");
        }
      },
      onError: (error) => {
        if (
          error.response &&
          error.response.data.errorCode === "AUTH_USER_NOT_FOUND"
        ) {
          form.setError("email", {
            message: "Email not found. Please register!",
          });
          requestAnimationFrame(() => {
            form.setFocus("email");
          });
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
          {!isEmailSent ? (
            <span>Forgot your password?</span>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <FaCheckCircle className="animate-bounce" />
              <span className="">Check your inbox</span>
            </div>
          )}
        </CardTitle>
        <CardDescription className="text-center sm:text-[12px] font-medium">
          {!isEmailSent ? (
            <span>
              Enter your registered email below to receive password reset
              instructions.
            </span>
          ) : (
            <span>
              We’ve sent a password reset link to your email. Check your inbox
              to proceed.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSumbit)}>
            <div className="flex items-stretch justify-center gap-4">
              <FormInput
                name="email"
                placeholder="email"
                inputClass="h-full"
                inputContainerClass="h-full"
                disabled={disableState}
                autoComplete="off"
              />
              <Button
                size="lg"
                disabled={disableState}
                className="group relative"
              >
                {!isEmailSent ? <span>Send</span> : null}

                <span className="absolute right-2">
                  <RotatingLines
                    visible={isSendingEmail}
                    height="20"
                    width="20"
                    color="#ffffff"
                    ariaLabel="mutating-dots-loading"
                  />
                </span>
                {!disableState && (
                  <IoIosArrowRoundForward className="absolute right-2 opacity-0 group-hover:opacity-100 transition-all duration-150 -translate-x-3 group-hover:translate-x-0" />
                )}
                {isEmailSent && <FaCheckCircle />}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="pb-2">
        <div className="flex items-center justify-center w-full gap-2 sm:text-[12px]">
          <p className="text-muted-foreground font-normal">
            Remeber your password?
          </p>
          <Button
            variant="link"
            className="px-0 group font-semibold sm:text-[12px]"
            disabled={isSendingEmail}
          >
            <Link href="/accounts/signin">Sign In</Link>
            <IoIosArrowRoundForward className="opacity-0 group-hover:opacity-100 transition-all duration-150 -translate-x-3 group-hover:translate-x-0" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ForgotPasswordCard;
