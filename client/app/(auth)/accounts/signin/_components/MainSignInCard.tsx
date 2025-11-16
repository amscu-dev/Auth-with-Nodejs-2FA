import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import client from "@/api/index";
import z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HiViewGridAdd } from "react-icons/hi";
import { Form } from "@/components/ui/form";
import FormInput from "@/components/form/FormInput";
import { Button } from "@/components/ui/button";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { RotatingLines } from "react-loader-spinner";
import { GoPasskeyFill } from "react-icons/go";
import Link from "next/link";
import { RiLockPasswordLine } from "react-icons/ri";
import { IoIosArrowRoundForward } from "react-icons/io";
import { FaWandMagicSparkles } from "react-icons/fa6";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { startAuthentication, WebAuthnError } from "@simplewebauthn/browser";
import { hasUserHandle } from "@/lib/helpers";
import { PasskeyResponseSchema } from "@/schemas/passkey.validator";
import { AuthRequestSchema } from "@/schemas/auth.validator";
import { env } from "@/env";

interface MainSignInCardProps {
  handleSignInMethod: (method: string) => void;
  handleEmailAddress: (email: string) => void;
}

const MainSignInCard: React.FC<MainSignInCardProps> = ({
  handleSignInMethod,
  handleEmailAddress,
}) => {
  // NAVIGATION
  const router = useRouter();
  // SERVICES
  const { mutate: authenticateGithub, isPending: isPendingGithubAuth } =
    client.OIDC.GithubAuth.useMutation();
  const { mutate: authenticateGoogle, isPending: isPendingGoogleAuth } =
    client.OIDC.GoogleAuth.useMutation();
  const { mutate: checkEmail, isPending: isPendingCheckEmail } =
    client.PasswordAuth.CheckEmail.useMutation();
  const { mutate: authenticateMagicLink, isPending: isPendingMagicLink } =
    client.MagicLink.SignIn.useMutation();
  const { mutate: authenticateInitPasskey, isPending: isPendingInitPasskey } =
    client.Passkey.SignInInit.useMutation();
  const {
    mutate: authenticateVerifyPasskey,
    isPending: isPendingVerifyPasskey,
  } = client.Passkey.SignInVerify.useMutation();

  // REDIRECT STATE
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  const [isAuthenticatingPasskey, setIsAuthenticatingPasskey] =
    useState<boolean>(false);
  // FORM STATE
  const form = useForm<z.infer<typeof AuthRequestSchema.checkEmail>>({
    resolver: zodResolver(AuthRequestSchema.checkEmail),
    defaultValues: {
      email: "",
    },
    mode: "onTouched",
  });

  // DISABLE STATE
  const disable =
    isPendingGithubAuth ||
    isPendingGoogleAuth ||
    isPendingCheckEmail ||
    isPendingMagicLink ||
    isPendingInitPasskey ||
    isPendingVerifyPasskey ||
    isRedirecting ||
    isAuthenticatingPasskey;

  // FORM SUBMISSION
  const onSubmit = async (
    formData: z.infer<typeof AuthRequestSchema.checkEmail>,
    e: React.FormEvent<HTMLFormElement>
  ) => {
    // EVENT CAST
    if (!(e.nativeEvent instanceof SubmitEvent)) return;
    const submitter = e?.nativeEvent?.submitter as HTMLButtonElement;
    if (!submitter?.name) return;
    const buttonType = submitter.name;
    // HANDLING DIFERENT CASES
    if (buttonType === "password") {
      await checkEmail(formData, {
        onSuccess: (data) => {
          if (!data.data.isNewEmail) {
            handleEmailAddress(data.data.email);
            handleSignInMethod("password");
          } else {
            form.setError("email", {
              type: "custom",
              message: "Seems you do not have an account.",
            });
            requestAnimationFrame(() => {
              form.setFocus("email");
            });
          }
        },
      });
    }
    if (buttonType === "magic") {
      await authenticateMagicLink(formData, {
        onError: (err) => {
          if (err.response?.data.errorCode === "AUTH_USER_NOT_FOUND") {
            form.setError("email", {
              type: "custom",
              message: "Seems you do not have an account.",
            });
            requestAnimationFrame(() => {
              form.setFocus("email");
            });
          }
        },
        onSuccess: (data) => {
          if ((data.data.nextStep = "CHECK_EMAIL_FOR_MAGIC_LINK")) {
            setIsRedirecting(true);
            router.push(
              `/accounts/magic/email-sent?email=${encodeURIComponent(formData.email)}`
            );
          }
        },
      });
    }
  };

  // GOOGLE AUTH LOGIC
  const handleGoogleAuth = async () => {
    await authenticateGoogle(undefined, {
      onSuccess: (data) => {
        if (!data.data.url) {
          toast.error(
            "Could not initiate Google authentication. Please try again."
          );
          return;
        }
        if (data.data.url) {
          setIsRedirecting(true);
          toast.loading("You will be redirected to Google for authentication…");
          window.location.href = data.data.url;
        }
      },
    });
  };

  // GITHUB AUTH LOGIC
  const handleGithubAuth = async () => {
    await authenticateGithub(undefined, {
      onSuccess: (data) => {
        if (!data.data.url) {
          toast.error(
            "Could not initiate Github authentication. Please try again."
          );
          return;
        }
        if (data.data.url) {
          setIsRedirecting(true);
          toast.loading("You will be redirected to Github for authentication…");
          window.location.href = data.data.url;
        }
      },
    });
  };

  // PASSKEY AUTH LOGINC
  const handlePasskeyAuth = async () => {
    await authenticateInitPasskey(undefined, {
      onSuccess: async (data) => {
        try {
          const {
            data: { publicKeyCredentialRequestOptions },
          } = PasskeyResponseSchema.signInInit.parse(data);
          try {
            setIsAuthenticatingPasskey(true);
            const credential = await startAuthentication({
              optionsJSON: {
                ...publicKeyCredentialRequestOptions,
              },
            });
            if (!hasUserHandle(credential)) {
              toast.error(
                "Unable to retrieve the user identifier. Please try again or sign in using your original authentication method."
              );
              return;
            }
            await authenticateVerifyPasskey(credential, {
              onSuccess: (verifyData) => {
                setIsRedirecting(true);
                if (verifyData.data.nextStep === "OK") {
                  router.replace(env.NEXT_PUBLIC_LOGIN_REDIRECT);
                  toast.success("Welcome back! You're now signed in.");
                }
                if (verifyData.data.nextStep === "CONFIRM_SIGN_UP") {
                  router.push(
                    `/accounts/signup/verify-email?email=${encodeURIComponent(verifyData.data.email)}`
                  );
                }
              },
              onError: () => {
                setIsRedirecting(false);
                setIsAuthenticatingPasskey(false);
              },
            });
          } catch (error) {
            setIsRedirecting(false);
            setIsAuthenticatingPasskey(false);
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
          Welcome back
        </CardTitle>
        <CardDescription className="text-center sm:text-[12px] font-medium">
          Please sign in or{" "}
          <span className="text-accent">register a new account</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit((data) => onSubmit(data, e))();
            }}
          >
            <div className="flex items-center justify-center flex-col w-full gap-4 mb-1">
              <FormInput
                name="email"
                label="Please enter your email"
                autoComplete="off"
                disabled={disable}
                type="email"
                placeholder="john.doe@gmail.com"
                formItemClass="w-full space-y-0"
                inputClass="text-sm"
              />
            </div>
            <div className="flex items-center justify-end mb-4">
              <Button
                variant="link"
                className="px-0 group text-[10px] font-light text-end"
                disabled={disable}
              >
                <IoIosArrowRoundForward className="opacity-0 group-hover:opacity-100 transition-all duration-150 -translate-x-3 group-hover:translate-x-0" />
                <Link href="/accounts/forgot-password">Forgot password ?</Link>
              </Button>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                className="w-full"
                size="lg"
                disabled={disable}
                name="password"
                type="submit"
              >
                <RiLockPasswordLine />
                Continue with password{" "}
                <RotatingLines
                  visible={isPendingCheckEmail}
                  height="20"
                  width="20"
                  color="#ffffff"
                  ariaLabel="mutating-dots-loading"
                />
              </Button>
              <Button
                variant="outline"
                className="w-full flex items-center disabled:bg-accent/90 disabled:text-card"
                size="lg"
                disabled={disable}
                name="magic"
                type="submit"
              >
                <FaWandMagicSparkles /> Continue with email{" "}
                <RotatingLines
                  visible={isPendingMagicLink}
                  height="20"
                  width="20"
                  color="#ffffff"
                  ariaLabel="mutating-dots-loading"
                />
              </Button>
            </div>
          </form>
        </Form>
        {/* SEPARATOR */}
        <div className="w-full flex items-center justify-center gap-2 my-6">
          <div className="w-full h-[0.5px] bg-border" />
          <span className="text-muted-foreground text-[10px] text-nowrap">
            OR CONTINUE WITH
          </span>
          <div className="w-full h-[0.5px] bg-border" />
        </div>
        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            className="w-full flex items-center disabled:bg-accent/90 disabled:text-card"
            size="lg"
            disabled={disable}
            name="google"
            onClick={handleGoogleAuth}
          >
            <FaGoogle /> Continue with Google{" "}
            <RotatingLines
              visible={isPendingGoogleAuth}
              height="20"
              width="20"
              color="#ffffff"
              ariaLabel="mutating-dots-loading"
            />
          </Button>
          <Button
            variant="outline"
            className="w-full flex items-center disabled:bg-accent/90 disabled:text-card"
            size="lg"
            disabled={disable}
            name="github"
            onClick={handleGithubAuth}
          >
            <FaGithub /> Continue with Github{" "}
            <RotatingLines
              visible={isPendingGithubAuth}
              height="20"
              width="20"
              color="#ffffff"
              ariaLabel="mutating-dots-loading"
            />
          </Button>
          <Button
            variant="outline"
            className="w-full flex items-center disabled:bg-accent/90 disabled:text-card"
            size="lg"
            disabled={disable}
            name="passkey"
            onClick={handlePasskeyAuth}
          >
            <GoPasskeyFill /> Continue with Passkey{" "}
            <RotatingLines
              visible={isPendingCheckEmail}
              height="20"
              width="20"
              color="#ffffff"
              ariaLabel="mutating-dots-loading"
            />
          </Button>
        </div>
      </CardContent>
      <CardFooter className="pb-2">
        <div className="flex items-center justify-center w-full gap-2 sm:text-[12px]">
          <p className="text-muted-foreground font-normal">
            Already have an account?
          </p>
          <Button
            variant="link"
            className="px-0 group font-semibold sm:text-[12px]"
            disabled={disable}
          >
            <Link href="/accounts/signup">Sign Up</Link>
            <IoIosArrowRoundForward className="opacity-0 group-hover:opacity-100 transition-all duration-150 -translate-x-3 group-hover:translate-x-0" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default MainSignInCard;
