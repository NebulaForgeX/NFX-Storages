import { useId } from "react";

import { LoadingSceneVariantEnum } from "@/enums";

import fireStyles from "./fire.module.css";
import gooStyles from "./goo.module.css";
import styles from "./s.module.css";

export type LoadingSceneSize = "small" | "medium" | "large";

export type LoadingSceneProps = {
  variant?: LoadingSceneVariantEnum;
  size?: LoadingSceneSize;
  className?: string;
};

const GOO_SIZE_CLASS: Record<LoadingSceneSize, string> = {
  small: gooStyles.sizeSmall,
  medium: gooStyles.sizeMedium,
  large: gooStyles.sizeLarge,
};

const FIRE_SIZE_CLASS: Record<LoadingSceneSize, string> = {
  small: fireStyles.sizeSmall,
  medium: fireStyles.sizeMedium,
  large: fireStyles.sizeLarge,
};

function GooArt({ size }: { size: LoadingSceneSize }) {
  const reactId = useId().replace(/:/g, "");
  const filterId = `goo-${reactId}`;

  return (
    <div className={[gooStyles.root, GOO_SIZE_CLASS[size]].join(" ")} style={{ ["--goo-filter" as string]: `url(#${filterId})` }}>
      <svg className={gooStyles.filterSvg} aria-hidden>
        {/* Expand filter region — default bbox clips blur at the top. */}
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
      <div className={gooStyles.loader} />
    </div>
  );
}

function FireArt({ size }: { size: LoadingSceneSize }) {
  return (
    <div className={[FIRE_SIZE_CLASS[size]].join(" ")}>
      <div className={fireStyles.fire}>
        <div className={fireStyles.fireLeft}>
          <div className={fireStyles.mainFire} />
          <div className={fireStyles.particleFire} />
        </div>
        <div className={fireStyles.fireCenter}>
          <div className={fireStyles.mainFire} />
          <div className={fireStyles.particleFire} />
        </div>
        <div className={fireStyles.fireRight}>
          <div className={fireStyles.mainFire} />
          <div className={fireStyles.particleFire} />
        </div>
        <div className={fireStyles.fireBottom}>
          <div className={fireStyles.mainFire} />
        </div>
      </div>
    </div>
  );
}

/** Loading illustration — goo blobs or fire (mirrors EmptyScene variant pattern). */
export function LoadingScene({ variant = LoadingSceneVariantEnum.GOO, size = "medium", className }: LoadingSceneProps) {
  return (
    <div className={[styles.scene, className].filter(Boolean).join(" ")} aria-hidden>
      {variant === LoadingSceneVariantEnum.FIRE ? <FireArt size={size} /> : <GooArt size={size} />}
    </div>
  );
}
