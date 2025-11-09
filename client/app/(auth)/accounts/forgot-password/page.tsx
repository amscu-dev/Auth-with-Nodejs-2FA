import React from "react";
import ForgotPasswordCard from "./_components/ForgotPasswordCard";

interface ForgotPasswordPageProps {}

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = () => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <ForgotPasswordCard />
    </div>
  );
};

export default ForgotPasswordPage;
