import { Section } from "@radix-ui/themes";

import styles from "./s.module.css";

export type FireSize = "small" | "medium" | "large";

const SIZE_CLASS = {
  small: styles.sizeSmall,
  medium: styles.sizeMedium,
  large: styles.sizeLarge,
} as const;

export function FireArt({ size }: { size: FireSize }) {
  return (
    <Section className={SIZE_CLASS[size]}>
      <div className={styles.fire}>
        <div className={styles.fireLeft}>
          <div className={styles.mainFire} />
          <div className={styles.particleFire} />
        </div>
        <div className={styles.fireCenter}>
          <div className={styles.mainFire} />
          <div className={styles.particleFire} />
        </div>
        <div className={styles.fireRight}>
          <div className={styles.mainFire} />
          <div className={styles.particleFire} />
        </div>
        <div className={styles.fireBottom}>
          <div className={styles.mainFire} />
        </div>
      </div>
    </Section>
  );
}
