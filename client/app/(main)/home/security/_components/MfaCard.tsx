import React from "react";
import MfaSection from "./MfaSection";

interface MfaCardProps {}

const MfaCard: React.FC<MfaCardProps> = () => {
  return (
    <div className="h-full">
      <MfaSection />
    </div>
  );
};

export default MfaCard;
