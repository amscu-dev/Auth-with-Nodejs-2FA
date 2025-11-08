"use client";
import React, { useState } from "react";
import MainSignInCard from "./_components/MainSignInCard";
import PasswordSignInCard from "./_components/PasswordSignInCard";

interface SignInPageProps {}

const SignInPage: React.FC<SignInPageProps> = () => {
  const [signInMethod, setSignInMethod] = useState<string>("general");
  const [userEmail, setUserEmail] = useState<string>("");
  return (
    <div className="flex items-center justify-center w-full h-full px-5">
      {signInMethod === "general" ? (
        <MainSignInCard
          handleSignInMethod={setSignInMethod}
          handleEmailAddress={setUserEmail}
        />
      ) : null}
      {signInMethod === "password" ? (
        <PasswordSignInCard
          handleSignInMethod={setSignInMethod}
          userEmail={userEmail}
        />
      ) : null}
    </div>
  );
};

export default SignInPage;
