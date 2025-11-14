"use client";
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MfaCard from "./_components/MfaCard";
import PasskeyCard from "./_components/PasskeyCard";
import SessionCard from "./_components/SessionCard";
const HomeSecurityPage = () => {
  const [activeTab, setActiveTab] = useState("mfa");
  return (
    <main className="w-full h-full flex">
      <Tabs defaultValue="mfa" className="flex-1 flex flex-col">
        <TabsList className="px-2 py-3 flex  border-b w-full justify-start h-fit bg-background">
          <TabsTrigger value="mfa" onClick={() => setActiveTab("mfa")}>
            Two-Factor Authentication (2FA)
          </TabsTrigger>
          <TabsTrigger
            value="sessions"
            onClick={() => setActiveTab("sessions")}
          >
            Authentication Sessions
          </TabsTrigger>
        </TabsList>
        {activeTab === "mfa" && (
          <TabsContent value="mfa" className="flex-1 mx-2 mb-4 flex flex-col">
            <MfaCard />
            <PasskeyCard />
          </TabsContent>
        )}
        {activeTab === "sessions" && (
          <TabsContent
            value="sessions"
            className="flex-1 mx-2 mb-4 flex flex-col"
          >
            <SessionCard />
          </TabsContent>
        )}
      </Tabs>
    </main>
  );
};

export default HomeSecurityPage;
