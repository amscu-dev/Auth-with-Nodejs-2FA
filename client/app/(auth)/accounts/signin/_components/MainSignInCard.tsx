import { authCheckEmailMutationFnBody } from "@/schemas/password-authentication-module.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
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
import { IoIosArrowRoundForward } from "react-icons/io";
import { FaWandMagicSparkles } from "react-icons/fa6";
import { useRouter } from "next/navigation";

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

  // FORM STATE
  const form = useForm<z.infer<typeof authCheckEmailMutationFnBody>>({
    resolver: zodResolver(authCheckEmailMutationFnBody),
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
    isPendingVerifyPasskey;

  const onSubmit = async (
    data: z.infer<typeof authCheckEmailMutationFnBody>,
    e: React.FormEvent<HTMLFormElement>
  ) => {
    // EVENT CAST
    if (!(e.nativeEvent instanceof SubmitEvent)) return;
    const submitter = e?.nativeEvent?.submitter as HTMLButtonElement;
    if (!submitter?.name) return;
    const buttonType = submitter.name;
    // HANDLING DIFERENT CASES
    if (buttonType === "password") {
      await checkEmail(data, {
        onSuccess: (data) => {
          if (data.data.isNewEmail) {
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
      await authenticateMagicLink(data, {
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
            router.push("/accounts/magic/email-sent");
          }
        },
      });
    }
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
            <div className="flex items-center justify-center flex-col w-full gap-4 mb-10">
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
            <div className="flex flex-col gap-3">
              <Button
                className="w-full"
                size="lg"
                disabled={disable}
                name="password"
                type="submit"
              >
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
                // onClick={(e) => {
                //   console.log(e);
                // }}
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
