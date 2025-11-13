import React from "react";
import PasskeySection from "./PasskeySection";

interface PasskeyCardProps {}

const PasskeyCard: React.FC<PasskeyCardProps> = () => {
  return (
    <div className="pt-4 pl-2 flex-1 flex">
      <PasskeySection />
    </div>
  );
};

export default PasskeyCard;
