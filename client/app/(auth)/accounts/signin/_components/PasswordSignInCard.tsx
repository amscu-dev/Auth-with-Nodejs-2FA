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
import { HiViewGridAdd } from "react-icons/hi";
import { IoIosArrowRoundForward } from "react-icons/io";
import { RiLockPasswordLine } from "react-icons/ri";
import { RotatingLines } from "react-loader-spinner";
import client from "@/api/index";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useRouter } from "next/navigation";
import { AuthRequestSchema } from "@/schemas/auth.validator";
import { env } from "@/env";

interface PasswordSignInCardProps {
  handleSignInMethod: (method: string) => void;
  userEmail: string;
}

const PasswordSignInCard: React.FC<PasswordSignInCardProps> = ({
  userEmail,
}) => {
  // ROUTING
  const router = useRouter();
  // SERVICE
  const { mutate: signIn, isPending: isPendingSignIn } =
    client.PasswordAuth.SignIn.useMutation();
  // FORM STATE
  const form = useForm<z.infer<typeof AuthRequestSchema.signIn>>({
    resolver: zodResolver(AuthRequestSchema.signIn),
    defaultValues: {
      email: userEmail,
      password: "",
    },
    mode: "onTouched",
  });
  // REDIRECT STATE
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);

  // DISABLED STATE
  const disabled = isRedirecting || isPendingSignIn;
  const onSubmit = async (
    formData: z.infer<typeof AuthRequestSchema.signIn>
  ) => {
    await signIn(formData, {
      onSuccess: ({ data: { nextStep } }) => {
        setIsRedirecting(true);
        if (nextStep === "OK") {
          router.push(env.NEXT_PUBLIC_LOGIN_REDIRECT);
        }
        if (nextStep === "CONFIRM_SIGN_UP") {
          router.push(
            `/accounts/signup/verify-email?email=${encodeURIComponent(formData.email)}`
          );
        }
        if (nextStep === "MFA_REQUIRED") {
          router.push("/accounts/signin/mfa");
        }
      },
      onError: (error) => {
        if (error.response?.data.errorCode === "ACCESS_FORBIDDEN") {
          form.setError("password", {
            message:
              "Please add a password-based login method in your account settings first. (choose forgot password)",
          });
          requestAnimationFrame(() => {
            form.setFocus("password");
          });
        }
        if (error.response?.data.errorCode === "AUTH_INVALID_CREDENTIALS") {
          form.setError("password", {
            message: "Invalid password, please try again",
          });
          requestAnimationFrame(() => {
            form.setFocus("password");
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
          Sign in to your account
        </CardTitle>
        <CardDescription className="text-center sm:text-[12px] font-medium">
          Enter your password to{" "}
          <span className="text-accent">access your account</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex items-center justify-center flex-col w-full gap-4 mb-1">
              <FormInput
                name="email"
                disabled={true}
                placeholder="Please enter your email"
                formItemClass="w-full space-y-0"
                type="email"
                inputClass="text-sm bg-accent shadow-none text-black disabled:opacity-100 disabled:bg-accent/50 border-none"
              />
              <FormInput
                name="password"
                label="Password"
                placeholder="Please enter your password"
                formItemClass="w-full space-y-0"
                type="password"
                disabled={disabled}
                inputClass="text-sm"
              />
            </div>
            <div className="flex items-center justify-end mb-4">
              <Button
                variant="link"
                className="px-0 group text-[10px] font-light text-end"
                disabled={disabled}
              >
                <IoIosArrowRoundForward className="opacity-0 group-hover:opacity-100 transition-all duration-150 -translate-x-3 group-hover:translate-x-0" />
                <Link href="/accounts/forgot-password">Forgot password ?</Link>
              </Button>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                className="w-full"
                size="lg"
                name="password"
                disabled={disabled}
                type="submit"
              >
                <RiLockPasswordLine />
                Continue with password{" "}
                <RotatingLines
                  visible={disabled}
                  height="20"
                  width="20"
                  color="#ffffff"
                  ariaLabel="mutating-dots-loading"
                />
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="pb-2">
        <div className="flex items-center justify-center w-full gap-2 sm:text-[12px]">
          <p className="text-muted-foreground font-normal">
            Already have an account?
          </p>
          <Button
            variant="link"
            className="px-0 group font-semibold sm:text-[12px]"
            disabled={disabled}
          >
            <Link href="/accounts/signup">Sign Up</Link>
            <IoIosArrowRoundForward className="opacity-0 group-hover:opacity-100 transition-all duration-150 -translate-x-3 group-hover:translate-x-0" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default PasswordSignInCard;
