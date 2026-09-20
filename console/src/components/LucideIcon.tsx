import type { AnimatedIconComponent } from "nfx-ui/icons";

export type LucideIconProps = {
  icon: AnimatedIconComponent;
  size?: number | string;
  strokeWidth?: number;
  className?: string;
  color?: string;
};

/** Static nfx-ui icon. File name matches PulsoLink; hover animation belongs on AnimatedIcon, not here. */
function LucideIcon({ icon: Icon, size = 18, strokeWidth = 1.75, className, color = "currentColor" }: LucideIconProps) {
  return <Icon size={size} strokeWidth={strokeWidth} className={className} color={color} />;
}

LucideIcon.displayName = "LucideIcon";

export default LucideIcon;
