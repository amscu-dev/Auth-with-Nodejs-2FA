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
import FormInput from "@/components/form/FormInput";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { IoIosArrowRoundForward } from "react-icons/io";
import { HiViewGridAdd } from "react-icons/hi";
import { FaWandMagicSparkles } from "react-icons/fa6";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import client from "@/api/index";
import { RotatingLines } from "react-loader-spinner";
import { useRouter } from "next/navigation";
import { ErrorCode } from "@/types/enums/error-code.enum";
import { MagicLinkRequestSchema } from "@/schemas/magic-link.validator";
interface MagicLinkSignUpCardProps {
  handleSignUpMethod: (method: string) => void;
}

const MagicLinkSignUpCard: React.FC<MagicLinkSignUpCardProps> = ({
  handleSignUpMethod,
}) => {
  const router = useRouter();
  const { mutate: signUp, isPending: isPendingSignUp } =
    client.MagicLink.SignUp.useMutation();
  const form = useForm<z.infer<typeof MagicLinkRequestSchema.signUp>>({
    resolver: zodResolver(MagicLinkRequestSchema.signUp),
    defaultValues: {
      name: "",
      email: "",
    },
    mode: "onTouched",
  });
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  const disabledState = isPendingSignUp || isRedirecting;
  const onSubmit = async (
    formData: z.infer<typeof MagicLinkRequestSchema.signUp>
  ) => {
    await signUp(formData, {
      onSuccess: () => {
        setIsRedirecting(true);
        router.push(
          `/accounts/magic/email-sent?email=${encodeURIComponent(formData.email)}`
        );
      },
      onError: (err) => {
        if (err.response) {
          if (
            err.response.data.errorCode === ErrorCode.AUTH_EMAIL_ALREADY_EXISTS
          ) {
            form.setError("email", {
              type: "validate",
              message: "An account with this email already exists.",
            });
            requestAnimationFrame(() => {
              form.setFocus("email");
            });
          }
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex items-center justify-center flex-col w-full gap-4 mb-6">
              <FormInput
                name="email"
                label="Email"
                placeholder="Please enter your email"
                formItemClass="w-full space-y-0"
                inputClass="text-sm"
                type="email"
                disabled={disabledState}
                autoComplete="off"
              />
              <FormInput
                name="name"
                label="Full name"
                placeholder="Please enter your full name"
                formItemClass="w-full space-y-0"
                inputClass="text-sm"
                autoComplete="off"
                disabled={disabledState}
              />
            </div>
            <div>
              <div className="w-full h-[0.75px] mb-2 bg-gradient-to-r from-slate-200 via-slate-600 to-slate-200" />
              <p className="text-muted-foreground text-[10px] font-light">
                Check your inbox for a magic link — it lets you log in
                instantly. Just open the email and click the link to finish
                signing up.
              </p>
              <div className="flex items-center justify-end">
                <Button
                  variant="link"
                  className="px-0 group text-[10px] font-light text-end"
                  disabled={disabledState}
                  onClick={() => handleSignUpMethod("general")}
                >
                  <IoIosArrowRoundForward className="opacity-0 group-hover:opacity-100 transition-all duration-150 -translate-x-3 group-hover:translate-x-0" />
                  Choose another registration method
                </Button>
              </div>
            </div>
            <div className="flex w-full items-center justify-center my-6 mt-4">
              <Button
                className="w-full"
                size="lg"
                type="submit"
                disabled={disabledState}
              >
                <FaWandMagicSparkles /> Register with Magic Link{" "}
                <RotatingLines
                  visible={disabledState}
                  height="20"
                  width="20"
                  color="#ffffff"
                  ariaLabel="mutating-dots-loading"
                />
              </Button>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox id="terms-2" defaultChecked disabled={disabledState} />
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
            disabled={disabledState}
          >
            <Link href="/accounts/signin">Sign In</Link>
            <IoIosArrowRoundForward className="opacity-0 group-hover:opacity-100 transition-all duration-150 -translate-x-3 group-hover:translate-x-0" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default MagicLinkSignUpCard;
