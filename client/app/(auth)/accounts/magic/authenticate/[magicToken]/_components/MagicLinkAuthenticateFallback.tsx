import React from "react";
import { HiViewGridAdd } from "react-icons/hi";
import { RotatingLines } from "react-loader-spinner";

interface MagicLinkAuthenticateFallbackProps {}

const MagicLinkAuthenticateFallback: React.FC<
  MagicLinkAuthenticateFallbackProps
> = () => {
  return (
    <div className="flex items-center justify-center gap-8 flex-col">
      <HiViewGridAdd className="text-6xl animate-bounce text-white" />
      <div className="flex items-center justify-center gap-3">
        <RotatingLines
          visible={true}
          height="20"
          width="20"
          color="#ffffff"
          ariaLabel="mutating-dots-loading"
        />
        <p className="text-background text-xl tracking-widest font-semibold">
          Logging in
        </p>
      </div>
    </div>
  );
};

export default MagicLinkAuthenticateFallback;
