"use client";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import { HiViewGridAdd } from "react-icons/hi";
import { IoIosArrowRoundForward } from "react-icons/io";
import client from "@/api/index";
import { toast } from "sonner";
import { RotatingLines } from "react-loader-spinner";
import { FaCheckCircle } from "react-icons/fa";

interface EmailCardProps {}

const EmailCard: React.FC<EmailCardProps> = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMailSent, setIsMailSent] = useState<boolean>(false);
  const { mutate: resendMail, isPending } =
    client.PasswordAuth.ResendEmail.useMutation();
  const email = searchParams.get("email");
  const name = searchParams.get("name");

  if (!email || !name) {
    router.push("/accounts/signup");
  }
  const handleResend = async () => {
    await resendMail(
      {
        email: email!,
      },
      {
        onSuccess: () => {
          toast.success(
            "We`ve resent the verification email to your inbox. Please check your email and click the link to confirm your account."
          );
          setIsMailSent(true);
        },
      }
    );
  };
  return (
    <div className="flex flex-col items-center h-full">
      <div className="flex w-full items-center justify-center sm:mb-6 sm:mt-3 mt-0">
        <HiViewGridAdd className="text-3xl sm:text-6xl" />
      </div>
      <h1 className="text-xl sm:text-3xl font-semibold sm:mb-4 mb-4">
        Please verify your email
      </h1>
      <div className="flex flex-col items-center gap-0 sm:gap-1 sm:text-sm  text-[10px] text-muted-foreground sm:mb-12 mb-3 px-4 sm:px-0 text-center">
        <p>
          We&apos;ve sent an email to{" "}
          <span className="font-bold text-primary">{email}</span> with your
          verification link.
        </p>
        <p>Check your inbox and click the link to confirm your account.</p>
      </div>
      <div className="flex items-center justify-center w-full gap-2 sm:text-base text-xs">
        <p className="text-muted-foreground font-medium tracking-wide">
          Haven&apos;t received the email yet?
        </p>
        <Button
          variant="link"
          className="px-0 group font-semibold sm:text-base text-xs"
          onClick={handleResend}
          disabled={isPending || isMailSent}
        >
          Resend
          {isPending ? (
            <RotatingLines
              visible={isPending}
              height="20"
              width="20"
              color="#ff5151"
              ariaLabel="mutating-dots-loading"
            />
          ) : isMailSent ? (
            <FaCheckCircle className="text-green-500" />
          ) : (
            <IoIosArrowRoundForward className="opacity-0 group-hover:opacity-100 transition-all duration-150 -translate-x-3 group-hover:translate-x-0" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default EmailCard;
