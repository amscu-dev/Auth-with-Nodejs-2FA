import BackgroundGradient from "@/components/background/BackgroundGradient";
import { Card } from "@/components/ui/card";
import { AuthProvider } from "@/context/auth-provider";
import React from "react";
import HomeSidebar from "./home/_components/HomeSidebar";

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="w-full h-full">
        <BackgroundGradient />
        <div className="flex items-center justify-center w-full h-full px-4">
          <Card className="w-full max-w-4xl h-5/6 flex">
            <HomeSidebar />
            {children}
          </Card>
        </div>
      </div>
    </AuthProvider>
  );
}

export default MainLayout;
