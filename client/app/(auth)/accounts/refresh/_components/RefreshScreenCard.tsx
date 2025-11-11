"use client";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect } from "react";
import client from "@/api/index";
import RefreshScreenLoader from "./RefreshScreenLoader";
import { toast } from "sonner";

const RefreshScreenCard = () => {
  const searchParams = useSearchParams();
  const callbackURL = searchParams.get("callbackUrl");
  // NAVIGATION
  const router = useRouter();
  // SERVICE
  const { mutate: revalidateSession, isPending } =
    client.PasswordAuth.ResetToken.useMutation();

  useEffect(() => {
    const handleRevalidate = async () => {
      await revalidateSession(undefined, {
        onSuccess: () => {
          toast.success("Session successfully refreshed!");
          if (callbackURL) {
            router.replace(callbackURL);
          } else {
            router.replace("/home/dashboard");
          }
        },
        onError: () => {
          toast.error("Invalid session. Please login again.");
          router.replace("/accounts/signin");
        },
      });
    };
    handleRevalidate();
  }, [callbackURL, revalidateSession, router]);

  if (isPending) {
    return <RefreshScreenLoader />;
  }

  return <RefreshScreenLoader />;
};

export default RefreshScreenCard;
