import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { EmptySceneVariantEnum } from "@/enums";

import campfireStyles from "./campfire.module.css";
import styles from "./s.module.css";

gsap.registerPlugin(useGSAP);

export type EmptySceneProps = {
  variant?: EmptySceneVariantEnum;
  className?: string;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function CampfireArt() {
  return (
    <div className={campfireStyles.campfire}>
      <div className={campfireStyles.fireContainer}>
        <div className={`${campfireStyles.flame} ${campfireStyles.flameMain}`} />
        <div className={`${campfireStyles.flame} ${campfireStyles.flameLeft}`} />
        <div className={`${campfireStyles.flame} ${campfireStyles.flameRight}`} />
      </div>
      <div className={campfireStyles.logs}>
        <div className={campfireStyles.log} />
        <div className={campfireStyles.log} />
      </div>
      <div className={campfireStyles.embers}>
        <div className={campfireStyles.ember} style={{ ["--delay" as string]: 0 }} />
        <div className={campfireStyles.ember} style={{ ["--delay" as string]: 0.3 }} />
        <div className={campfireStyles.ember} style={{ ["--delay" as string]: 0.6 }} />
      </div>
      <div className={campfireStyles.sparkles} />
    </div>
  );
}

function AbstractArt() {
  return (
    <svg className={styles.art} viewBox="0 0 120 120" aria-hidden>
      <circle className={styles.orbit} cx="60" cy="60" r="40" data-ring="outer" />
      <circle className={styles.orbitSoft} cx="60" cy="60" r="26" data-ring="inner" />
      <circle className={styles.blob} cx="48" cy="52" r="14" data-blob="a" />
      <circle className={styles.blobMuted} cx="72" cy="68" r="10" data-blob="b" />
      <circle className={styles.dot} cx="86" cy="36" r="3" data-spark />
      <circle className={styles.dot} cx="34" cy="78" r="2.5" data-spark />
      <circle className={styles.dot} cx="92" cy="70" r="2" data-spark />
    </svg>
  );
}

/** Empty-state illustration — abstract geometry or campfire. */
export function EmptyScene({ variant = EmptySceneVariantEnum.ABSTRACT, className }: EmptySceneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const isCampfire = variant === EmptySceneVariantEnum.CAMPFIRE;

  useGSAP(
    () => {
      if (!rootRef.current || prefersReducedMotion() || isCampfire) return;

      const glow = rootRef.current.querySelector(`.${styles.glow}`);
      if (glow) {
        gsap.fromTo(glow, { opacity: 0.5, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.7, ease: "power2.out" });
        gsap.to(glow, { opacity: 0.7, duration: 2.6, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 0.7 });
      }

      gsap.fromTo(
        "[data-ring], [data-blob], [data-spark]",
        { opacity: 0, scale: 0.86 },
        { opacity: 1, scale: 1, stagger: 0.08, duration: 0.55, ease: "power2.out", transformOrigin: "center" },
      );

      const ring = rootRef.current.querySelector("[data-ring='outer']");
      if (ring) gsap.to(ring, { rotate: 360, duration: 32, ease: "none", repeat: -1, transformOrigin: "60px 60px" });
      const ringInner = rootRef.current.querySelector("[data-ring='inner']");
      if (ringInner) gsap.to(ringInner, { rotate: -360, duration: 22, ease: "none", repeat: -1, transformOrigin: "60px 60px" });

      gsap.to("[data-blob='a']", { y: -5, x: 2, duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 0.5 });
      gsap.to("[data-blob='b']", { y: 4, x: -3, duration: 2.8, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 0.7 });
      gsap.to("[data-spark]", { opacity: 0.35, stagger: 0.22, duration: 0.9, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 0.8 });
    },
    { scope: rootRef, dependencies: [variant] },
  );

  return (
    <div ref={rootRef} className={[styles.scene, isCampfire ? styles.campfireScene : "", className].filter(Boolean).join(" ")} aria-hidden>
      {!isCampfire ? <div className={styles.glow} /> : null}
      <div className={styles.stage}>{isCampfire ? <CampfireArt /> : <AbstractArt />}</div>
    </div>
  );
}
