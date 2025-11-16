"use client";
import React from "react";
import { FcGoogle } from "react-icons/fc";
import { RotatingLines } from "react-loader-spinner";

interface GoogleFallbackProps {}

const GoogleFallback: React.FC<GoogleFallbackProps> = () => {
  return (
    <div className="flex items-center justify-center gap-8 flex-col">
      <FcGoogle className="text-6xl animate-bounce text-white" />
      <div className="flex items-center justify-center gap-3">
        <RotatingLines
          visible={true}
          height="20"
          width="20"
          color="#ffffff"
          ariaLabel="mutating-dots-loading"
        />
        <p className="dark:text-white text-white text-xl tracking-widest font-semibold">
          Logging in
        </p>
      </div>
    </div>
  );
};

export default GoogleFallback;
