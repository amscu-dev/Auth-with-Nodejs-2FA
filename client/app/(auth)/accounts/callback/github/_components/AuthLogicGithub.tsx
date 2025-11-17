"use client";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import client from "@/services/index";
import { toast } from "sonner";
import GithubFallback from "./GithubFallback";
import { env } from "@/env";
interface AuthLogicGithubProps {}

const AuthLogicGithub: React.FC<AuthLogicGithubProps> = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { mutate: authGithub, isPending } =
    client.OIDC.GithubCallback.useMutation();
  const state = searchParams.get("state");
  const code = searchParams.get("code");

  React.useEffect(() => {
    if (!state || !code) {
      router.replace(env.NEXT_PUBLIC_FAILED_LOGIN_REDIRECT);
    } else {
      const run = async () => {
        await authGithub(
          { state, code },
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
              toast.error("Github login failed");
              router.replace(env.NEXT_PUBLIC_FAILED_LOGIN_REDIRECT);
            },
          }
        );
      };
      run();
    }
  }, [state, code, router, authGithub]);

  if (isPending) {
    return <GithubFallback />;
  }

  return <GithubFallback />;
};

export default AuthLogicGithub;
