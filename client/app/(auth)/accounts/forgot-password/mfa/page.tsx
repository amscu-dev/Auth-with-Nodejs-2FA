import React from "react";
import ForgotPasswordMfaCard from "./_components/ForgotPasswordMfaCard";

interface ForgotPasswordMfaPageProps {}

const ForgotPasswordMfaPage: React.FC<ForgotPasswordMfaPageProps> = () => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <ForgotPasswordMfaCard />
    </div>
  );
};

export default ForgotPasswordMfaPage;
