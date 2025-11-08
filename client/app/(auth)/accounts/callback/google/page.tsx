import React, { Suspense } from "react";
import GoogleFallback from "./_components/GoogleFallback";
import AuthLogicGoogle from "./_components/AuthLogicGoogle";

interface GoogleCallbackPageProps {}

const GoogleCallbackPage: React.FC<GoogleCallbackPageProps> = () => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <Suspense fallback={<GoogleFallback />}>
        <AuthLogicGoogle />
      </Suspense>
    </div>
  );
};

export default GoogleCallbackPage;
