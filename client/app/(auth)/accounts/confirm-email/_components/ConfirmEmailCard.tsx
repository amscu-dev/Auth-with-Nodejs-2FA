"use client";
import React, { useEffect, useState } from "react";
import EmailVerifiedCard from "./EmailVerifiedCard";
import { useRouter, useSearchParams } from "next/navigation";
import client from "@/api/index";
import ConfirmEmailCardFallback from "./ConfirmEmailCardFallback";
import { toast } from "sonner";
import EmailErrorVerificationCard from "./EmailErrorVerificationCard";
interface ConfirmEmailCardProps {}

const ConfirmEmailCard: React.FC<ConfirmEmailCardProps> = () => {
  // SEARCH PARAMS
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const code = searchParams.get("code");
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const [isCheckingParams, setIsCheckingParams] = useState(true);
  // SERVICE
  const {
    mutate: verifyEmail,
    isPending,
    error,
  } = client.PasswordAuth.VerifyEmail.useMutation();
  // NAVIGATION
  const router = useRouter();
  useEffect(() => {
    if (!email || !code) {
      router.replace("/accounts/signin");
      return;
    } else {
      setIsCheckingParams(false);
      const handleVerifyEmail = async () => {
        await verifyEmail(
          { code },
          {
            onSuccess: () => {
              setIsEmailVerified(true);
              toast.success("Your email has been verified successfully!");
            },
          }
        );
      };
      handleVerifyEmail();
    }
  }, [email, code, router, verifyEmail]);

  if (isCheckingParams) {
    return <ConfirmEmailCardFallback />;
  }

  if (isPending) {
    return <ConfirmEmailCardFallback />;
  }

  if (error && !isEmailVerified) {
    if (
      error.response &&
      (error.response.data.errorCode === "AUTH_EMAIL_ALREADY_VERIFIED" ||
        error.response.data.errorCode ===
          "VERIFICATION_CODE_ERROR_CODE_CONSUMED")
    ) {
      toast.error(`${error.response.data.message}`);
      router.replace("/accounts/signin");
    }
    return (
      <EmailErrorVerificationCard
        message={error.response?.data.message || error.message}
        email={email!}
      />
    );
  }

  return <EmailVerifiedCard />;
};

export default ConfirmEmailCard;
