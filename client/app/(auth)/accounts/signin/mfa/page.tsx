"use client";
import React, { useState } from "react";
import SignInMfaCard from "./_components/SignInMfaCard";
import SignInBackupCodeCard from "./_components/SignInBackupCodeCard";

interface SignInMfaPageProps {}

const SignInMfaPage: React.FC<SignInMfaPageProps> = () => {
  const [mfaMethod, setMfaMethod] = useState<"totp" | "backup-code">("totp");
  return (
    <div className="flex items-center justify-center w-full h-full px-5">
      {mfaMethod === "totp" ? (
        <SignInMfaCard on2MfaMethod={setMfaMethod} />
      ) : null}
      {mfaMethod === "backup-code" ? (
        <SignInBackupCodeCard on2MfaMethod={setMfaMethod} />
      ) : null}
    </div>
  );
};

export default SignInMfaPage;
