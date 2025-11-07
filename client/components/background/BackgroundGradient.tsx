import React from "react";

const BackgroundGradient = () => {
  return (
    <div
      className="absolute inset-0 h-full w-full 
  bg-background 
  bg-[linear-gradient(to_right,#6b6b6b30_1px,transparent_1px),linear-gradient(to_bottom,#6b6b6b30_1px,transparent_1px)] 
  [background-size:24px_24px]
  [mask-image:radial-gradient(ellipse_90%_50%_at_50%_50%,#000_80%,transparent_100%)]
  -z-50"
    ></div>
  );
};

export default BackgroundGradient;
