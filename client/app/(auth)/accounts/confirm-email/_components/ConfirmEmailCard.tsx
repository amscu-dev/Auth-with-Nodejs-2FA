"use client";
import React, { useEffect } from "react";
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
      router.replace("/acccounts/signin");
      return;
    }
    const handleVerifyEmail = async () => {
      await verifyEmail(
        { code },
        {
          onSuccess: () => {
            toast.success("Your email has been verified successfully!");
          },
        }
      );
    };
    handleVerifyEmail();
  }, [email, code, router, verifyEmail]);

  if (isPending) {
    return <ConfirmEmailCardFallback />;
  }

  if (error) {
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
