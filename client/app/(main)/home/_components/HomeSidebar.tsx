import React from "react";
import HomeSidebarHeader from "./HomeSidebarHeader";
import HomeSidebarContent from "./HomeSidebarContent";
import HomeSidebarFooter from "./HomeSidebarFooter";

interface HomeSidebarProps {}

const HomeSidebar: React.FC<HomeSidebarProps> = () => {
  return (
    <aside className="min-w-36 w-1/4 flex-shrink-0 flex items-center justify-center flex-col border-r">
      <HomeSidebarHeader />
      <HomeSidebarContent />
      <HomeSidebarFooter />
    </aside>
  );
};

export default HomeSidebar;
