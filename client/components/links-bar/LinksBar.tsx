"use client";
import React from "react";
import { FaGithubAlt } from "react-icons/fa";
import { FaLinkedin } from "react-icons/fa";
import { Button } from "../ui/button";
import Link from "next/link";
import { IoCodeSlashSharp } from "react-icons/io5";
import ToggleThemeButton from "./ToggleThemeButton";
import { HiViewGridAdd } from "react-icons/hi";

interface LinksBarProps {}

const LinksBar: React.FC<LinksBarProps> = () => {
  return (
    <div className="absolute top-2 right-4 left-4 flex items-center justify-center gap-4 z-50 slide-in-from-top">
      <Button
        asChild
        size="sm"
        className="rounded-[9px]  mr-auto gap-0 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
        variant="outline"
      >
        <Link href="/">
          <HiViewGridAdd className="mr-2" />
          <span>Login</span>
          <span className="text-primary font-extrabold">Sandbox</span>
        </Link>
      </Button>
      <Button
        asChild
        size="sm"
        className="w-28 rounded-[9px] bg-teal-500 text-white hover:bg-teal-300"
        variant="outline"
      >
        <Link href="https://docs.loginsandbox.xyz">
          <IoCodeSlashSharp />
          <span>API Docs</span>
        </Link>
      </Button>
      <Button
        asChild
        size="sm"
        className="w-28 bg-accent rounded-[9px] hover:bg-blue-400"
      >
        <Link href="https://www.linkedin.com/in/amscu/">
          <FaLinkedin />
          <span>amscu</span>
        </Link>
      </Button>
      <Button
        asChild
        size="sm"
        className="w-28 rounded-[9px] hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
        variant="outline"
      >
        <Link href="https://github.com/amscu-dev">
          <FaGithubAlt />
          <span>amscu-dev</span>
        </Link>
      </Button>

      <ToggleThemeButton />
    </div>
  );
};

export default LinksBar;
