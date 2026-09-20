import type { ReactNode } from "react";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { Flex } from "@radix-ui/themes";
import gsap from "gsap";

import { PreferencesPopover } from "@/components";

gsap.registerPlugin(useGSAP);

export function useAuthMotion(enabled = true) {
  const scope = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (!enabled) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const nodes = scope.current?.querySelectorAll<HTMLElement>("[data-auth-motion]");
      if (!nodes?.length) return;
      gsap.set(nodes, { autoAlpha: 0, y: 16 });
      gsap.to(nodes, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.07, ease: "power3.out" });
    },
    { scope },
  );
  return scope;
}

export function AuthToolbar() {
  return (
    <Flex align="center" justify="end" gap="3" width="100%">
      <PreferencesPopover />
    </Flex>
  );
}

export function AuthMotionRoot({ children, className }: { children: ReactNode; className?: string }) {
  const scope = useAuthMotion();
  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  );
}
