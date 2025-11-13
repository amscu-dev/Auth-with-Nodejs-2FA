"use client";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import client from "@/api/index";
import { toast } from "sonner";
import GoogleFallback from "./GoogleFallback";
import { env } from "@/env";

interface AuthLogicGoogleProps {}

const AuthLogicGoogle: React.FC<AuthLogicGoogleProps> = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { mutate: authGoogle, isPending } =
    client.OIDC.GoogleCallback.useMutation();
  const state = searchParams.get("state");
  const code = searchParams.get("code");
  const scope = searchParams.get("scope");

  React.useEffect(() => {
    if (!state || !code || !scope) {
      router.replace(env.NEXT_PUBLIC_FAILED_LOGIN_REDIRECT);
    } else {
      const run = async () => {
        await authGoogle(
          { state, code },
          {
            onSuccess: () => {
              toast.success(
                "You have successfully logged in! Redirecting to the main page..."
              );
              setTimeout(() => {
                router.replace(env.NEXT_PUBLIC_LOGIN_REDIRECT);
              }, 1000);
            },
            onError: () => {
              toast.error("Google login failed");
              router.replace(env.NEXT_PUBLIC_FAILED_LOGIN_REDIRECT);
            },
          }
        );
      };
      run();
    }
  }, [state, code, scope, router, authGoogle]);

  if (isPending) {
    return <GoogleFallback />;
  }

  return <GoogleFallback />;
};

export default AuthLogicGoogle;
