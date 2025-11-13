"use client";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MfaCard from "./_components/MfaCard";
const HomeSecurityPage = () => {
  return (
    <main className="w-full h-full flex">
      <Tabs defaultValue="mfa" className="flex-1 flex flex-col">
        <TabsList className="px-2 py-3 flex  border-b w-full justify-start h-fit bg-background">
          <TabsTrigger value="mfa">Two-Factor Authentication (2FA)</TabsTrigger>
          <TabsTrigger value="sessions">Authentication Sessions</TabsTrigger>
        </TabsList>
        <TabsContent value="mfa" className="flex-1 mx-2 mb-4">
          <MfaCard />
          <PasskeyCard />
        </TabsContent>
        <TabsContent value="sessions">div sessions</TabsContent>
      </Tabs>
    </main>
  );
};

export default HomeSecurityPage;
