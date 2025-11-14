import React from "react";
import MfaSection from "./MfaSection";

interface MfaCardProps {}

const MfaCard: React.FC<MfaCardProps> = () => {
  return (
    <div className="w-full flex flex-col gap-2 px-2 py-4 border-b">
      <MfaSection />
    </div>
  );
};

export default MfaCard;
