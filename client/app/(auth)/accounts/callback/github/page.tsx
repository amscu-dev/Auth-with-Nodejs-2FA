import React, { Suspense } from "react";
import GithubFallback from "./_components/GithubFallback";
import AuthLogicGithub from "./_components/AuthLogicGithub";

interface GithubCallbackPageProps {}

const GithubCallbackPage: React.FC<GithubCallbackPageProps> = () => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <Suspense fallback={<GithubFallback />}>
        <AuthLogicGithub />
      </Suspense>
    </div>
  );
};

export default GithubCallbackPage;
