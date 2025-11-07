"use client";
import { useState } from "react";
import MainSignUpCard from "./_components/MainSignUpCard";
import PasskeySignUpCard from "./_components/PasskeySignUpCard";
import MagicLinkSignUpCard from "./_components/MagicLinkSignUpCard";
import PasswordSignUpCard from "./_components/PasswordSignUpCard";

const SignUpPage = () => {
  const [signUpMethod, setSignUpMethod] = useState<string>("general");
  return (
    <div className="flex items-center justify-center w-full h-full px-5">
      {signUpMethod === "general" ? (
        <MainSignUpCard handleSignUpMethod={setSignUpMethod} />
      ) : null}
      {signUpMethod === "passkey" ? (
        <PasskeySignUpCard handleSignUpMethod={setSignUpMethod} />
      ) : null}
      {signUpMethod === "magic-link" ? (
        <MagicLinkSignUpCard handleSignUpMethod={setSignUpMethod} />
      ) : null}
      {signUpMethod === "password" ? (
        <PasswordSignUpCard handleSignUpMethod={setSignUpMethod} />
      ) : null}
    </div>
  );
};

export default SignUpPage;
