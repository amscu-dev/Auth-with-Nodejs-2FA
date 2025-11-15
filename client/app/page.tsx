// import BackgroundGradient from "@/components/background/BackgroundGradient";
import { HomeBackground } from "@/components/background/HomeBackground";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";
import { MdArrowOutward } from "react-icons/md";
const HomePage = () => {
  return (
    <div className="w-full h-full overflow-hidden relative flex items-center justify-center">
      <HomeBackground className="absolute inset-0 z-0" />
      {/* <BackgroundGradient /> */}
      <div
        className="absolute inset-0 pointer-events-none 
               bg-[radial-gradient(ellipse_at_center,#00000000_35%,#ffffff_100%)] z-10 dark:bg-[radial-gradient(ellipse_at_center,#00000000_35%,#000000_100%)]"
      />
      <div className="flex items-center justify-center flex-col relative z-30">
        <h1 className="text-5xl font-bold tracking-tighter mb-8 text-center">
          Strong{" "}
          <span className="text-primary bg-white shadow-md px-4 py-2 inline-block rounded-[12px]">
            Security
          </span>{" "}
          refined into a Simple <span className="text-primary">Experience</span>
        </h1>
        <p className="text-lg text-muted-foreground font-medium font-mono text-center">
          A hands-on look at today’s most frequent authentication methods
        </p>
        <p className="text-lg mb-24 text-muted-foreground font-medium font-mono text-center">
          {" "}
          from passkeys to session management and multi-factor, all in one
          interactive demo.
        </p>
        <Button
          asChild
          className="px-12 text-lg h-12 relative"
          variant="outline"
        >
          <Link href="/accounts/signin">
            Launch App <MdArrowOutward className="absolute right-6 text-3xl" />
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default HomePage;
