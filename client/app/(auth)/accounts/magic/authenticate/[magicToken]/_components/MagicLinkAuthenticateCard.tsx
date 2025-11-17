"use client";
import React, { useEffect } from "react";
import MagicLinkAuthenticateFallback from "./MagicLinkAuthenticateFallback";
import client from "@/api/index";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { env } from "@/env";

interface MagicLinkAuthenticateCardProps {}

const MagicLinkAuthenticateCard: React.FC<
  MagicLinkAuthenticateCardProps
> = () => {
  // SERVICE
  const { mutate: authenticateToken, isPending: isPendingAuthentication } =
    client.MagicLink.Authenticate.useMutation();

  // NAVIGATION
  const router = useRouter();

  // COLECT PARAMS
  const { magicToken } = useParams<{ magicToken: string }>();

  // VALIDATION LOGIC
  useEffect(() => {
    if (!magicToken) {
      toast.error(
        "We couldn’t find your magic token. Please open the login link from your email again."
      );
      setTimeout(() => {
        router.replace(env.NEXT_PUBLIC_FAILED_LOGIN_REDIRECT);
      }, 500);
      return;
    }

    const handleAuthentication = async () => {
      await authenticateToken(
        { token: magicToken },
        {
          onSuccess: () => {
            toast.success(
              "You have successfully logged in! Redirecting to the main page..."
            );
            setTimeout(() => {
              router.replace(env.NEXT_PUBLIC_LOGIN_REDIRECT);
            }, 500);
          },
          onError: () => {
            toast.error(
              "This magic link is invalid or has expired. Please request a new ones"
            );
            setTimeout(() => {
              router.replace(env.NEXT_PUBLIC_FAILED_LOGIN_REDIRECT);
            }, 500);
          },
        }
      );
    };
    handleAuthentication();
  }, [magicToken, router, authenticateToken]);

  if (isPendingAuthentication) {
    return <MagicLinkAuthenticateFallback />;
  }

  return <MagicLinkAuthenticateFallback />;
};

export default MagicLinkAuthenticateCard;
