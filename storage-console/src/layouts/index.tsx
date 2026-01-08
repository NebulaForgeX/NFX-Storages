import React, { memo } from "react";
import { useLayoutStore } from "@/stores/layoutStore";
import SideHideLayout from "./SideHideLayout";
import SideShowLayout from "./SideShowLayout";

interface LayoutSwitcherProps {
  children: React.ReactNode;
}

export const LayoutSwitcher = memo(({ children }: LayoutSwitcherProps) => {
const layoutMode = useLayoutStore((s) => s.layoutMode);
  if (layoutMode === "hide") {
    return <SideHideLayout>{children}</SideHideLayout>;
  } else {
    return <SideShowLayout>{children}</SideShowLayout>;
  }
});

LayoutSwitcher.displayName = "LayoutSwitcher";

export default LayoutSwitcher;