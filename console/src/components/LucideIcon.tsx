import type { LucideIcon as LucideIconComponent, LucideProps } from "lucide-react";

export type LucideIconProps = LucideProps & {
  icon: LucideIconComponent;
};

/** Lucide wrapper: inherits parent `color` via currentColor. Use for hero, cards, map pins, sidebar nav (18px+). */
function LucideIcon({ icon: Icon, color = "currentColor", strokeWidth = 2, "aria-hidden": ariaHidden = true, ...props }: LucideIconProps) {
  return <Icon color={color} strokeWidth={strokeWidth} aria-hidden={ariaHidden} {...props} />;
}

LucideIcon.displayName = "LucideIcon";

export default LucideIcon;
