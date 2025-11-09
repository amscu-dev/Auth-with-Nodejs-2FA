import { Card } from "@/components/ui/card";
import React, { Suspense } from "react";
import ConfirmEmailCard from "./_components/ConfirmEmailCard";
import ConfirmEmailCardFallback from "./_components/ConfirmEmailCardFallback";

interface ConfirmEmailPageProps {}

const ConfirmEmailPage: React.FC<ConfirmEmailPageProps> = () => {
  return (
    <div className="w-full h-full flex items-center justify-center px-5">
      <Card className="aspect-video w-full max-w-sm  flex items-center justify-center py-2 px-2">
        <Suspense fallback={<ConfirmEmailCardFallback />}>
          <ConfirmEmailCard />
        </Suspense>
      </Card>
    </div>
  );
};

export default ConfirmEmailPage;
