import React from "react";

interface OidcCallbackLayoutProps {
  children: React.ReactNode;
}

const OidcCallbackLayout: React.FC<OidcCallbackLayoutProps> = ({
  children,
}) => {
  return <div className="w-full h-full bg-black">{children}</div>;
};

export default OidcCallbackLayout;
