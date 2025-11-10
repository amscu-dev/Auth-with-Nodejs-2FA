import React from "react";
import { HiViewGridAdd } from "react-icons/hi";

interface ResetPasswordCardFallbackProps {}

const ResetPasswordCardFallback: React.FC<
  ResetPasswordCardFallbackProps
> = () => {
  return (
    <div>
      <HiViewGridAdd size="3rem" className="animate-ping" />
    </div>
  );
};

export default ResetPasswordCardFallback;
