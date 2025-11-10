import React, { Suspense } from "react";
import ResetPasswordCardFallback from "./_components/ResetPasswordCardFallback";
import ResetPasswordCard from "./_components/ResetPasswordCard";
import { Card } from "@/components/ui/card";

const ResetPasswordPage = () => {
  return (
    <div className="w-full h-full flex items-center justify-center px-5">
      <Card className="aspect-video w-full max-w-md  flex items-center justify-center pt-6 pb-3 px-2">
        <Suspense fallback={<ResetPasswordCardFallback />}>
          <ResetPasswordCard />
        </Suspense>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
