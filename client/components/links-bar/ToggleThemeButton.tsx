import React, { useEffect, useState } from "react";
import { IoSunnyOutline } from "react-icons/io5";
import { MdOutlineModeNight } from "react-icons/md";
import { useTheme } from "next-themes";
import { Button } from "../ui/button";
import { FaCircleHalfStroke } from "react-icons/fa6";

interface ToggleThemeButtonProps {}

const ToggleThemeButton: React.FC<ToggleThemeButtonProps> = () => {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const handleChangeTheme = () => {
    if (resolvedTheme === "light") {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      className="rounded-[9px] hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
      onClick={handleChangeTheme}
    >
      {!mounted ? (
        <FaCircleHalfStroke className="animate-ping" />
      ) : resolvedTheme === "light" ? (
        <MdOutlineModeNight />
      ) : (
        <IoSunnyOutline />
      )}
    </Button>
  );
};

export default ToggleThemeButton;
