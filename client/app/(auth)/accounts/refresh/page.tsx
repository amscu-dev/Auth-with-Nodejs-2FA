import React, { Suspense } from "react";
import RefreshScreenLoader from "./_components/RefreshScreenLoader";
import RefreshScreenCard from "./_components/RefreshScreenCard";
interface RefreshTokenPageProps {}

const RefreshTokenPage: React.FC<RefreshTokenPageProps> = () => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <Suspense fallback={<RefreshScreenLoader />}>
        <RefreshScreenCard />
      </Suspense>
    </div>
  );
};

export default RefreshTokenPage;
