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
import { BsQrCodeScan } from "react-icons/bs";
import { HiViewGridAdd } from "react-icons/hi";
import z from "zod";
import {
  passkeySignUpInitMutationFnBody,
  passkeySignUpInitResponseBody,
} from "@/schemas/passkey-authentication-module.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import client from "@/api/index";
import { ErrorCode } from "@/types/enums/error-code.enum";
import { startRegistration, WebAuthnError } from "@simplewebauthn/browser";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PasskeySignUpCardProps {
  handleSignUpMethod: (method: string) => void;
}

const PasskeySignUpCard: React.FC<PasskeySignUpCardProps> = ({
  handleSignUpMethod,
}) => {
  const { mutate: signUpInit, isPending: isPendingSignUpInit } =
    client.Passkey.SignUpInit.useMutation();
  const { mutate: signUpVerify, isPending: isPendingSignUpVerify } =
    client.Passkey.SignUpVerify.useMutation();
  const [isCreatingPasskey, setIsCreatingPasskey] = useState<boolean>(false);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  const router = useRouter();
  const disableState =
    isPendingSignUpInit ||
    isPendingSignUpVerify ||
    isCreatingPasskey ||
    isRedirecting;

  const form = useForm<z.infer<typeof passkeySignUpInitMutationFnBody>>({
    resolver: zodResolver(passkeySignUpInitMutationFnBody),
    mode: "onTouched",
    defaultValues: {
      email: "",
      name: "",
    },
  });
  const onSubmit = async (
    data: z.infer<typeof passkeySignUpInitMutationFnBody>
  ) => {
    await signUpInit(data, {
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
      onSuccess: async (data) => {
        try {
          const {
            data: { publicKeyOpts },
          } = passkeySignUpInitResponseBody.parse(data);
          try {
            setIsCreatingPasskey(true);
            const credential = await startRegistration({
              optionsJSON: {
                ...publicKeyOpts,
              },
            });

            await signUpVerify(credential, {
              onSuccess: (data) => {
                setIsRedirecting(true);
                router.push(
                  `/accounts/signup/verify-email?email=${encodeURIComponent(data.data.user?.email || "")}&name=${encodeURIComponent(data.data.user?.name || "")}`
                );
              },
            });
          } catch (error) {
            setIsRedirecting(false);
            setIsCreatingPasskey(false);
            if (error instanceof WebAuthnError) {
              toast.error(error.message);
              console.error(error);
            } else {
              toast.error(
                "There was an error processing your request please try again later"
              );
            }
          }
        } catch (error) {
          toast.error(
            "There was an error processing your request please try again later"
          );
          console.error(error);
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
                type="email"
                disabled={disableState}
                placeholder="Please enter your email"
                formItemClass="w-full space-y-0"
                inputClass="text-sm"
              />
              <FormInput
                name="name"
                label="Full name"
                type="text"
                disabled={disableState}
                placeholder="Please enter your full name"
                formItemClass="w-full space-y-0"
                inputClass="text-sm"
              />
            </div>
            <div>
              <div className="w-full h-[0.75px] mb-2 bg-gradient-to-r from-slate-200 via-slate-600 to-slate-200" />
              <p className="text-muted-foreground text-[10px] font-light">
                For your registration to be complete, you must successfully
                create a private passkey on your device. Make sure the process
                finishes without interruptions.
              </p>
              <div className="flex items-center justify-end">
                <Button
                  variant="link"
                  className="px-0 group text-[10px] font-light text-end"
                  disabled={disableState}
                  onClick={() => handleSignUpMethod("general")}
                >
                  <IoIosArrowRoundForward className="opacity-0 group-hover:opacity-100 transition-all duration-150 -translate-x-3 group-hover:translate-x-0" />
                  Choose another registration method
                </Button>
              </div>
            </div>
            <div className="flex w-full items-center justify-center my-6 mt-4">
              <Button className="w-full" size="lg" disabled={disableState}>
                <BsQrCodeScan /> Register with Passkey
              </Button>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox id="terms-2" defaultChecked disabled={disableState} />
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
            disabled={disableState}
          >
            <Link href="/accounts/signin">Sign In</Link>
            <IoIosArrowRoundForward className="opacity-0 group-hover:opacity-100 transition-all duration-150 -translate-x-3 group-hover:translate-x-0" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default PasskeySignUpCard;
