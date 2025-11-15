"use client";
import React from "react";
import { FaGithubAlt } from "react-icons/fa";
import { FaLinkedin } from "react-icons/fa";
import { Button } from "../ui/button";
import Link from "next/link";
import ToggleThemeButton from "./ToggleThemeButton";

interface LinksBarProps {}

const LinksBar: React.FC<LinksBarProps> = () => {
  return (
    <div className="absolute top-2 right-4  flex items-center justify-center gap-4 z-50">
      <Button
        asChild
        size="sm"
        className="w-28 bg-accent rounded-[9px] hover:bg-blue-400"
      >
        <Link href="https://www.linkedin.com/in/amscu/">
          <span>amscu</span>
          <FaLinkedin />
        </Link>
      </Button>
      <Button
        asChild
        size="sm"
        className="w-28 rounded-[9px] hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
        variant="outline"
      >
        <Link href="https://github.com/amscu-dev">
          <span>amscu-dev</span>
          <FaGithubAlt />
        </Link>
      </Button>
      <ToggleThemeButton />
    </div>
  );
};

export default LinksBar;
