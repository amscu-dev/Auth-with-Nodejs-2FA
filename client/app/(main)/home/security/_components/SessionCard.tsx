import React from "react";
import SessionSection from "./SessionSection";

interface SessionCardProps {}

const SessionCard: React.FC<SessionCardProps> = () => {
  return (
    <div className="w-full px-2 py-4 h-full">
      <SessionSection />
    </div>
  );
};

export default SessionCard;
