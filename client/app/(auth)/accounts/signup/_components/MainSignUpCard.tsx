"use client";
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
import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FaGoogle } from "react-icons/fa";
import { FaGithub } from "react-icons/fa";
import { FaWandMagicSparkles } from "react-icons/fa6";
import { GoPasskeyFill } from "react-icons/go";
import FormInput from "@/components/form/FormInput";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { IoIosArrowRoundForward } from "react-icons/io";
import { HiViewGridAdd } from "react-icons/hi";
import client from "@/api/index";
import { RotatingLines } from "react-loader-spinner";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AuthRequestSchema } from "@/schemas/auth.validator";

interface MainSignUpCardProps {
  handleSignUpMethod: (method: string) => void;
  handleEmailAddress: (email: string) => void;
}

const MainSignUpCard: React.FC<MainSignUpCardProps> = ({
  handleSignUpMethod,
  handleEmailAddress,
}) => {
  const form = useForm<z.infer<typeof AuthRequestSchema.checkEmail>>({
    resolver: zodResolver(AuthRequestSchema.checkEmail),
    defaultValues: {
      email: "",
    },
    mode: "onTouched",
  });

  const { mutate: authenticateGithub, isPending: isPendingGithubAuth } =
    client.OIDC.GithubAuth.useMutation();
  const { mutate: authenticateGoogle, isPending: isPendingGoogleAuth } =
    client.OIDC.GoogleAuth.useMutation();
  const { mutate: checkEmail, isPending: isPendingCheckEmail } =
    client.PasswordAuth.CheckEmail.useMutation();

  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  const refInput = useRef<HTMLInputElement>(null);

  const disable =
    isPendingGithubAuth ||
    isPendingGoogleAuth ||
    isPendingCheckEmail ||
    isRedirecting;

  const handleGoogleAuth = async () => {
    await authenticateGoogle(undefined, {
      onSuccess: () => {
        setIsRedirecting(true);
        toast.loading("You will be redirected to Google for authentication…");
      },
    });
  };
  const handleGithubAuth = async () => {
    await authenticateGithub(undefined, {
      onSuccess: () => {
        setIsRedirecting(true);
        toast.loading("You will be redirected to Github for authentication…");
      },
    });
  };
  const onSubmit = async (
    data: z.infer<typeof AuthRequestSchema.checkEmail>
  ) => {
    await checkEmail(data, {
      onSuccess: (data) => {
        if (data.data.isNewEmail) {
          handleEmailAddress(data.data.email);
          handleSignUpMethod("password");
        } else {
          form.setError("email", {
            type: "custom",
            message: "An account with this email already exists.",
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
          Create an account
        </CardTitle>
        <CardDescription className="text-center sm:text-[12px] font-medium">
          Create your free account and enjoy all the benefits.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        {/* Button Stack */}
        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            className="w-full flex items-center disabled:bg-accent/90 disabled:text-card"
            size="lg"
            disabled={disable}
            onClick={handleGoogleAuth}
          >
            <FaGoogle /> Register with Google{" "}
            <RotatingLines
              visible={isPendingGoogleAuth}
              height="20"
              width="20"
              color="#ffffff"
              ariaLabel="mutating-dots-loading"
            />
          </Button>
          <Button
            variant="outline"
            className="w-full flex items-center disabled:bg-accent/90 disabled:text-card"
            disabled={disable}
            size="lg"
            onClick={handleGithubAuth}
          >
            <FaGithub /> Register with Github{" "}
            <RotatingLines
              visible={isPendingGithubAuth}
              height="20"
              width="20"
              color="#ffffff"
              ariaLabel="mutating-dots-loading"
              wrapperStyle={{}}
              wrapperClass=""
            />
          </Button>
          <Button
            variant="outline"
            className="w-full flex items-center disabled:bg-accent/90 disabled:text-card"
            disabled={disable}
            size="lg"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              handleSignUpMethod("magic-link");
            }}
          >
            <FaWandMagicSparkles /> Register with Magic Link
          </Button>
          <Button
            variant="outline"
            className="w-full flex items-center disabled:bg-accent/90 disabled:text-card"
            disabled={disable}
            size="lg"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              handleSignUpMethod("passkey");
            }}
          >
            <GoPasskeyFill /> Register with Passkey
          </Button>
        </div>
        {/* SEPARATOR */}
        <div className="w-full flex items-center justify-center gap-2 my-6">
          <div className="w-full h-[0.5px] bg-border" />
          <span className="text-muted-foreground text-[10px] text-nowrap">
            OR CONTINUE WITH
          </span>
          <div className="w-full h-[0.5px] bg-border" />
        </div>

        {/* FORM */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex items-center justify-center flex-col w-full gap-4">
              <FormInput
                name="email"
                label="Email"
                autoComplete="off"
                disabled={disable}
                type="email"
                ref={refInput}
                placeholder="Enter your email"
                formItemClass="w-full space-y-0"
                inputClass="text-sm"
              />
            </div>
            <div className="flex w-full items-center justify-center my-6">
              <Button
                className="w-full"
                size="lg"
                type="submit"
                disabled={disable}
              >
                Create an account
              </Button>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox id="terms-2" defaultChecked />
              <div className="grid gap-1">
                <Label htmlFor="terms-2" className="text-sm">
                  Accept terms and conditions
                </Label>
                <p className="text-muted-foreground text-[10px]">
                  By clicking this checkbox, you agree to the terms and
                  conditions.
                </p>
              </div>
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
            disabled={disable}
          >
            <Link href="/accounts/signin">Sign In</Link>
            <IoIosArrowRoundForward className="opacity-0 group-hover:opacity-100 transition-all duration-150 -translate-x-3 group-hover:translate-x-0" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default MainSignUpCard;
