import React from "react";

interface PasswordSignInCardProps {
  handleSignInMethod: (method: string) => void;
  userEmail: string;
}

const PasswordSignInCard: React.FC<PasswordSignInCardProps> = ({
  userEmail,
}) => {
  return <div>{userEmail}</div>;
};

export default PasswordSignInCard;
