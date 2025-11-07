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
import React, { useState } from "react";
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
interface MainSignUpCardProps {
  handleSignUpMethod: (method: string) => void;
}

const MainSignUpCard: React.FC<MainSignUpCardProps> = ({
  handleSignUpMethod,
}) => {
  const { mutate: authenticateGithub, isPending: isPendingGithubAuth } =
    client.OIDC.GithubAuth.useMutation();
  const { mutate: authenticateGoogle, isPending: isPendingGoogleAuth } =
    client.OIDC.GoogleAuth.useMutation();
  const form = useForm();

  const handleGoogleAuth = () => {
    authenticateGoogle();
  };
  const handleGithubAuth = () => {
    authenticateGithub();
  };
  const onSubmit = () => {};
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="w-full flex items-center disabled:bg-accent/90 disabled:text-card"
                size="lg"
                disabled={isPendingGoogleAuth || isPendingGithubAuth}
                onClick={handleGoogleAuth}
              >
                <FaGoogle /> Register with Google{" "}
                <RotatingLines
                  visible={isPendingGoogleAuth}
                  height="20"
                  width="20"
                  color="#ffffff"
                  ariaLabel="mutating-dots-loading"
                  wrapperStyle={{}}
                  wrapperClass=""
                />
              </Button>
              <div></div>
              <Button
                variant="outline"
                className="w-full flex items-center disabled:bg-accent/90 disabled:text-card"
                disabled={isPendingGoogleAuth || isPendingGithubAuth}
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
                disabled={isPendingGoogleAuth || isPendingGithubAuth}
                size="lg"
                onClick={() => handleSignUpMethod("magic-link")}
              >
                <FaWandMagicSparkles /> Register with Magic Link
              </Button>
              <Button
                variant="outline"
                className="w-full flex items-center disabled:bg-accent/90 disabled:text-card"
                disabled={isPendingGoogleAuth || isPendingGithubAuth}
                size="lg"
                onClick={() => handleSignUpMethod("passkey")}
              >
                <GoPasskeyFill /> Register with Passkey
              </Button>
            </div>
            <div className="w-full flex items-center justify-center gap-2 my-6">
              <div className="w-full h-[0.5px] bg-border" />
              <span className="text-muted-foreground text-[10px] text-nowrap">
                OR CONTINUE WITH
              </span>
              <div className="w-full h-[0.5px] bg-border" />
            </div>
            <div className="flex items-center justify-center flex-col w-full gap-4">
              <FormInput
                name="email"
                label="Email"
                placeholder="Enter your email"
                formItemClass="w-full space-y-0"
                inputClass="text-sm"
              />
            </div>
            <div className="flex w-full items-center justify-center my-6">
              <Button
                className="w-full"
                size="lg"
                disabled={isPendingGoogleAuth || isPendingGithubAuth}
                onClick={() => handleSignUpMethod("password")}
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
