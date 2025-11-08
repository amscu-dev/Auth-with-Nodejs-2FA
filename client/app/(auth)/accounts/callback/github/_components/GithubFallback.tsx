"use client";
import React from "react";
import { FaGithub } from "react-icons/fa";
import { RotatingLines } from "react-loader-spinner";

interface GithubFallbackProps {}

const GithubFallback: React.FC<GithubFallbackProps> = () => {
  return (
    <div className="flex items-center justify-center gap-8 flex-col">
      <FaGithub className="text-6xl animate-bounce text-white" />
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

export default GithubFallback;
