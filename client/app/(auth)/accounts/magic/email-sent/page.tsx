import { Card } from "@/components/ui/card";
import React, { Suspense } from "react";
import EmailCard from "./_components/EmailCard";
import { HiViewGridAdd } from "react-icons/hi";

function EmailCardFallback() {
  return (
    <div>
      <HiViewGridAdd size="3rem" className="animate-ping" />
    </div>
  );
}

const MagicLinkEmailPage = () => {
  return (
    <div className="w-full h-full flex items-center justify-center px-2">
      <Card className="aspect-video w-full max-w-sm sm:max-w-xl flex items-center justify-center py-6 px-2">
        <Suspense fallback={<EmailCardFallback />}>
          <EmailCard />
        </Suspense>
      </Card>
    </div>
  );
};

export default MagicLinkEmailPage;
