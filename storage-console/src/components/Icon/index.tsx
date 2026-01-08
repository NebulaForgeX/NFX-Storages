import type { LucideProps } from "lucide-react";

import { memo } from "react";
import * as LucideIcons from "lucide-react";

interface IconProps extends LucideProps {
  name: keyof typeof LucideIcons;
}

const Icon = memo(({ name, ...props }: IconProps) => {
  const LucideIcon = LucideIcons[name] as React.ComponentType<LucideProps>;

  if (!LucideIcon) {
    console.warn(`Icon "${name}" not found in lucide-react`);
    return null;
  }

  return <LucideIcon {...props} />;
});

Icon.displayName = "Icon";

export default Icon;
