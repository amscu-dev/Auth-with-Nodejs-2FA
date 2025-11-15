// import BackgroundGradient from "@/components/background/BackgroundGradient";
import { HomeBackground } from "@/components/background/HomeBackground";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";
import { MdArrowOutward } from "react-icons/md";
import { Separator } from "@/components/ui/separator";
import { RiNextjsFill } from "react-icons/ri";
import { SiMongodb } from "react-icons/si";
import { FaNodeJs } from "react-icons/fa";
import { SiExpress } from "react-icons/si";
import { SiTypescript } from "react-icons/si";
import { RiTailwindCssFill } from "react-icons/ri";
import { FaAws } from "react-icons/fa";
import { BsFillShieldLockFill } from "react-icons/bs";
import { FaKey } from "react-icons/fa";
import { FaFingerprint } from "react-icons/fa";
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
        <h1 className="text-5xl font-bold tracking-tighter mb-8 text-center slide-in-from-top">
          Strong{" "}
          <span className="text-primary bg-white shadow-md px-4 py-2 inline-block rounded-[12px]">
            Security
          </span>{" "}
          refined into a Simple <span className="text-primary">Experience</span>
        </h1>
        <p className="text-lg text-muted-foreground font-medium font-mono text-center slide-in-from-right opacity-0">
          A hands-on look at today’s most frequent authentication methods
        </p>
        <p className="text-lg mb-24 text-muted-foreground font-medium font-mono text-center slide-in-from-left opacity-0">
          {" "}
          from passkeys to session management and multi-factor, all in one
          interactive demo.
        </p>
        <Button
          asChild
          className="px-12 text-lg h-12 relative slide-in-from-bottom"
          variant="outline"
        >
          <Link href="/accounts/signin">
            Launch App <MdArrowOutward className="absolute right-6 text-3xl" />
          </Link>
        </Button>
        {/* ICONS ON SCREEN */}
        <div
          className="flex items-center justify-center p-4 absolute border bg-amber-400 shadow-lg rounded-full rotate-12 -bottom-[25%] right-[5%] 
         opacity-0 to-opacity-100"
        >
          <BsFillShieldLockFill className="text-6xl text-purple-600 " />
        </div>
        <div
          className="flex items-center justify-center p-3 absolute border bg-indigo-800 shadow-lg  rounded-[5px] rotate-12 -top-[40%] right-[20%] 
         opacity-0 to-opacity-100"
        >
          <FaFingerprint className="text-5xl text-zinc-200" />
        </div>
        <div
          className="flex items-center justify-center p-6 absolute border bg-sky-800 shadow-lg rounded-[20px] -rotate-12 bottom-[3%] -left-[7%] 
         opacity-0 to-opacity-100"
        >
          <FaKey className="text-6xl text-orange-600 " />
        </div>
      </div>
      <div className="flex flex-col items-center justify-center absolute bottom-4 right-1/2 translate-x-1/2 opacity-0 to-opacity-100">
        <h2 className="mb-2 font-mono font-semibold text-sm">Tech Stack</h2>
        <Separator className="mb-3 bg-border/80 w-[150%]" />
        <div className="flex items-center justify-center gap-6 z-50">
          <RiNextjsFill size="1.75rem" />
          <SiMongodb size="1.75rem" />
          <FaNodeJs size="1.75rem" />
          <SiExpress size="1.75rem" />
          <SiTypescript size="1.75rem" />
          <RiTailwindCssFill size="1.75rem" />
          <FaAws size="1.75rem" />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
