"use client";
import { Button } from "@/components/ui/button";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import React, { useState } from "react";
import { HiViewGridAdd } from "react-icons/hi";
import { IoIosArrowRoundForward } from "react-icons/io";
import { TbMailX } from "react-icons/tb";
import client from "@/services/index";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RotatingLines } from "react-loader-spinner";
import { FaCheckCircle } from "react-icons/fa";

interface EmailErrorVerificationCardProps {
  message: string;
  email: string;
}

const EmailErrorVerificationCard: React.FC<EmailErrorVerificationCardProps> = ({
  message,
  email,
}) => {
  // NAVIGATION
  const router = useRouter();
  // SERVICE
  const { mutate: resendEmail, isPending } =
    client.PasswordAuth.ResendEmail.useMutation();
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);

  const disabledState = isPending || isRedirecting;
  const handleEmailResend = async () => {
    await resendEmail(
      { email },
      {
        onSuccess: () => {
          setIsRedirecting(true);
          toast.success("Verification email sent successfully!");
          router.push(
            `/accounts/signup/verify-email?email=${encodeURIComponent(email)}`
          );
        },
      }
    );
  };
  return (
    <div>
      <div className="flex w-full items-center justify-center">
        <HiViewGridAdd className="text-3xl sm:text-s6xl mt-2" />
      </div>
      <CardHeader>
        <CardTitle className="sm:text-xl text-center font-semibold  flex items-center justify-center gap-3 mb-4 text-base">
          <TbMailX className="text-primary sm:text-3xl text-xl" />
          Email could not be verified
        </CardTitle>
        <CardDescription className="text-center text-xs font-medium sm:text-sm">
          {message}
        </CardDescription>
      </CardHeader>
      <div className="flex items-center justify-center">
        <Button
          variant="link"
          size="lg"
          disabled={disabledState}
          className="group font-semibold relative"
          onClick={handleEmailResend}
        >
          {!isRedirecting ? <span>Resend verification link</span> : null}

          <span className="absolute right-2">
            <RotatingLines
              visible={isPending}
              height="20"
              width="20"
              color="#ffffff"
              ariaLabel="mutating-dots-loading"
            />
          </span>
          {!disabledState && (
            <IoIosArrowRoundForward className="absolute right-2 opacity-0 group-hover:opacity-100 transition-all duration-150 -translate-x-3 group-hover:translate-x-0" />
          )}
          {isRedirecting && <FaCheckCircle />}
        </Button>
      </div>
    </div>
  );
};

export default EmailErrorVerificationCard;
