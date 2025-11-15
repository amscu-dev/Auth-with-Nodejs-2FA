import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { IoCodeSlashOutline } from "react-icons/io5";

const HomeDashboardPage = () => {
  return (
    <div className="w-full flex flex-col items-center justify-center  px-16">
      <div className="relative w-2/5 aspect-square mb-8">
        <Image fill alt="passkey not found logo" src="/hello-3.svg" />
      </div>
      <p className="text-center text-sm text-muted-foreground/80 font-normal">
        Thank you for taking the time to explore this project.
      </p>
      <p className="text-center text-sm text-muted-foreground/80 font-normal mb-12">
        The full source code of this project, including all flows with
        explanatory diagrams, is available on my GitHub account in a public
        repository.
      </p>
      <Button className="w-52 bg-fuchsia-500 hover:bg-fuchsia-900" asChild>
        <Link
          href="https://github.com/amscu-dev/Auth-with-Nodejs-2FA"
          target="_blank"
          rel="noopener noreferrer"
        >
          <IoCodeSlashOutline />
          Visit source code
        </Link>
      </Button>
    </div>
  );
};

export default HomeDashboardPage;
