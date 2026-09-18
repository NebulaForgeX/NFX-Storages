import type { ReactNode } from "react";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { Box } from "@radix-ui/themes";
import gsap from "gsap";
import { PreferencesPopover } from "nfx-ui/components";

import styles from "./AuthShell.module.css";

gsap.registerPlugin(useGSAP);

export type AuthShellProps = {
  brandTitle: string;
  brandEyebrow?: string;
  heroFooter: string;
  children: ReactNode;
};

export default function AuthShell({ brandTitle, brandEyebrow, heroFooter, children }: AuthShellProps) {
  const pageRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.set(".js-tape", { scaleX: 0, transformOrigin: "0% 50%" });
      gsap.set(".js-bay", { autoAlpha: 0, x: -24 });
      gsap.set(".js-waybill", { autoAlpha: 0, x: 36, rotate: 1.2 });
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.to(".js-tape", { scaleX: 1, duration: 0.55 })
        .to(".js-bay", { autoAlpha: 1, x: 0, duration: 0.6 }, "-=0.2")
        .to(".js-waybill", { autoAlpha: 1, x: 0, rotate: 0, duration: 0.65 }, "-=0.35");
    },
    { scope: pageRef },
  );

  return (
    <Box ref={pageRef} className={styles.page} asChild>
      <main>
        <div className={`${styles.tape} js-tape`} aria-hidden />
        <div className={styles.dock}>
          <section className={`${styles.bay} js-bay`}>
            <p className={styles.stencil}>{brandEyebrow ?? "NFX Storages"} · BAY 04</p>
            <h1 className={styles.title}>{brandTitle}</h1>
            <p className={styles.lede}>{heroFooter}</p>
          </section>
          <section className={styles.manifest}>
            <div className={styles.toolbar}>
              <PreferencesPopover />
            </div>
            <div className={`${styles.waybill} js-waybill`}>
              <div className={styles.waybillHead}>
                <span>Loading dock</span>
                <span>Manifest 19-72</span>
              </div>
              {children}
            </div>
          </section>
        </div>
        <div className={`${styles.tape} js-tape`} aria-hidden />
      </main>
    </Box>
  );
}
