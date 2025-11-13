import React from "react";
import MfaSection from "./MfaSection";

interface MfaCardProps {}

const MfaCard: React.FC<MfaCardProps> = () => {
  return (
    <div className="w-full flex flex-col gap-2 pl-2 pt-4 border-b pb-3">
      <MfaSection />
    </div>
  );
};

export default MfaCard;
