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
import React from "react";
import { useForm } from "react-hook-form";
import FormInput from "@/components/form/FormInput";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { IoIosArrowRoundForward } from "react-icons/io";
import { HiViewGridAdd } from "react-icons/hi";
import { FaUserShield } from "react-icons/fa";
import z from "zod";
import client from "@/api/index";
import { RotatingLines } from "react-loader-spinner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { AuthRequestSchema } from "@/schemas/auth.validator";
interface PasswordSignUpCardProps {
  handleSignUpMethod: (method: string) => void;
  curentEmail: string;
}

const PasswordSignUpCard: React.FC<PasswordSignUpCardProps> = ({
  curentEmail,
  handleSignUpMethod,
}) => {
  const router = useRouter();

  const form = useForm<z.infer<typeof AuthRequestSchema.signUp>>({
    resolver: zodResolver(AuthRequestSchema.signUp),
    defaultValues: {
      email: curentEmail,
      name: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  });

  const { mutate: signUp, isPending: isPendingRegistration } =
    client.PasswordAuth.SignUp.useMutation();

  const onSubmit = async (
    formData: z.infer<typeof AuthRequestSchema.signUp>
  ) => {
    await signUp(formData, {
      onSuccess: () => {
        router.push(
          `/accounts/signup/verify-email?email=${encodeURIComponent(formData.email)}`
        );
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
                disabled={true}
                placeholder="Please enter your email"
                formItemClass="w-full space-y-0"
                type="email"
                inputClass="text-sm bg-accent shadow-none text-black disabled:opacity-100 disabled:bg-accent/50 border-none"
              />
              <FormInput
                name="name"
                label="Full name"
                disabled={isPendingRegistration}
                placeholder="Please enter your full name"
                formItemClass="w-full space-y-0"
                inputClass="text-sm"
              />
              <FormInput
                name="password"
                label="Password"
                disabled={isPendingRegistration}
                placeholder="Please enter your full name"
                formItemClass="w-full space-y-0"
                type="password"
                inputClass="text-sm"
              />
              <FormInput
                name="confirmPassword"
                label="Confirm Password"
                disabled={isPendingRegistration}
                placeholder="Please enter your full name"
                formItemClass="w-full space-y-0"
                inputClass="text-sm"
                type="password"
              />
            </div>
            <div>
              <div className="flex items-center justify-end">
                <Button
                  variant="link"
                  className="px-0 group text-[10px] font-light text-end"
                  onClick={() => handleSignUpMethod("general")}
                  disabled={isPendingRegistration}
                >
                  <IoIosArrowRoundForward className="opacity-0 group-hover:opacity-100 transition-all duration-150 -translate-x-3 group-hover:translate-x-0" />
                  Choose another registration method
                </Button>
              </div>
            </div>
            <div className="flex w-full items-center justify-center mb-4">
              <Button
                className="w-full"
                size="lg"
                disabled={isPendingRegistration}
              >
                <FaUserShield /> Create an account{" "}
                <RotatingLines
                  visible={isPendingRegistration}
                  height="20"
                  width="20"
                  color="#ffffff"
                  ariaLabel="mutating-dots-loading"
                />
              </Button>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms-2"
                defaultChecked
                disabled={isPendingRegistration}
              />
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
            disabled={isPendingRegistration}
          >
            <Link href="/accounts/signin">Sign In</Link>
            <IoIosArrowRoundForward className="opacity-0 group-hover:opacity-100 transition-all duration-150 -translate-x-3 group-hover:translate-x-0" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default PasswordSignUpCard;
