import { useId } from "react";
import { Grid } from "@radix-ui/themes";

import styles from "./s.module.css";

export type GooSize = "small" | "medium" | "large";

const SIZE_CLASS = {
  small: styles.sizeSmall,
  medium: styles.sizeMedium,
  large: styles.sizeLarge,
} as const;

export function GooArt({ size }: { size: GooSize }) {
  const reactId = useId().replace(/:/g, "");
  const filterId = `goo-${reactId}`;

  return (
    <Grid className={[styles.root, SIZE_CLASS[size]].join(" ")} style={{ ["--goo-filter" as string]: `url(#${filterId})` }}>
      <svg className={styles.filterSvg} aria-hidden>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0
            0 1 0 0 0
            0 0 1 0 0
            0 0 0 48 -7"
          />
        </filter>
      </svg>
      <div className={styles.loader} />
    </Grid>
  );
}
