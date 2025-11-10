import { Button } from "@/components/ui/button";
import {
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import React from "react";
import { HiViewGridAdd } from "react-icons/hi";
import { GiSadCrab } from "react-icons/gi";
interface ResetPasswordErrorCardProps {}

const ResetPasswordErrorCard: React.FC<ResetPasswordErrorCardProps> = () => {
  return (
    <div>
      <div className="flex items-center justify-center">
        <HiViewGridAdd className="text-4xl sm:text-5xl" />
      </div>
      <CardHeader className="pt-3 gap-3">
        <CardTitle className="text-xl sm:text-2xl text-center font-semibold">
          <div className="flex items-center justify-center gap-3">
            <GiSadCrab className="text-primary text-5xl" /> Request Expired
          </div>
        </CardTitle>

        <CardDescription className="text-xs sm:text-sm text-center">
          Your password reset request has expired. Please initiate a new request
          to reset your password.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button variant="secondary" size="lg" className="w-full">
          <Link href="/accounts/signin" replace>
            Take me back to login
          </Link>
        </Button>
      </CardFooter>
    </div>
  );
};

export default ResetPasswordErrorCard;
