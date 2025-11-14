"use client";
import React from "react";
import { SiWebauthn } from "react-icons/si";

import CurrentSessionCard from "./CurrentSessionCard";
import OtherSessionsCard from "./OtherSessionsCard";

const SessionSection = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-start gap-2 mb-2">
        <SiWebauthn />
        <h1 className="text-lg font-semibold">Session Management</h1>
      </div>
      <p className="text-xs text-muted-foreground/80 font-medium mb-6">
        View all devices and browsers currently signed in to your account.
      </p>
      <div className="flex flex-col gap-2 pb-2 border-b border-muted-foreground/40">
        <h2 className="text-sm font-semibold">Current Session</h2>
        <p className="text-xs text-muted-foreground/80 font-medium ">
          Details of your current session, including device and browser.
        </p>
        <CurrentSessionCard />
      </div>
      <div className="flex flex-col gap-2 pt-4 h-full">
        <h2 className="text-sm font-semibold">Other active devices</h2>
        <p className="text-xs text-muted-foreground/80 font-medium ">
          A list of all devices currently using your account, so you can monitor
          or sign out of them.
        </p>
        <OtherSessionsCard />
      </div>
    </div>
  );
};

export default SessionSection;
