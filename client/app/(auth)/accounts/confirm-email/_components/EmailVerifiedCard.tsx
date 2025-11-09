import { Button } from "@/components/ui/button";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import React from "react";
import { HiViewGridAdd } from "react-icons/hi";
import { IoIosArrowRoundForward } from "react-icons/io";
import { TbMailCheck } from "react-icons/tb";

interface EmailVerifiedCardProps {}

const EmailVerifiedCard: React.FC<EmailVerifiedCardProps> = () => {
  return (
    <div>
      <div className="flex w-full items-center justify-center">
        <HiViewGridAdd className="text-3xl sm:text-6xl mt-2" />
      </div>
      <CardHeader>
        <CardTitle className="sm:text-xl text-center font-semibold  flex items-center justify-center gap-3 mb-4 text-base">
          <TbMailCheck className="text-accent sm:text-3xl text-xl" />
          Email verified successfully
        </CardTitle>
        <CardDescription className="text-center text-xs font-medium sm:text-sm">
          Your email address has been confirmed. You can now sign in to your
          account.
        </CardDescription>
      </CardHeader>
      <div className="flex items-center justify-center">
        <Button
          variant="link"
          size="lg"
          className="group font-semibold relative"
        >
          <Link href="/accounts/signin">Return to sign in</Link>
          <IoIosArrowRoundForward className="absolute right-2 opacity-0 group-hover:opacity-100 transition-all duration-150 -translate-x-3 group-hover:translate-x-0" />
        </Button>
      </div>
    </div>
  );
};

export default EmailVerifiedCard;
