import { Container, Grid, Section } from "@radix-ui/themes";

import { LoadingSceneVariantEnum } from "@/enums";

import { FireArt } from "./Fire";
import { GooArt } from "./Goo";
import styles from "./s.module.css";

export type LoadingSceneSize = "small" | "medium" | "large";

export type LoadingSceneProps = {
  variant?: LoadingSceneVariantEnum;
  size?: LoadingSceneSize;
  className?: string;
};

/** Loading illustration — goo blobs or fire (mirrors EmptyScene variant pattern). */
export function LoadingScene({ variant = LoadingSceneVariantEnum.GOO, size = "medium", className }: LoadingSceneProps) {
  return (
    <Container className={[styles.scenePx, className].filter(Boolean).join(" ")} aria-hidden>
      <Section className={styles.scenePy}>
        <Grid className={styles.scene}>
          {variant === LoadingSceneVariantEnum.FIRE ? <FireArt size={size} /> : <GooArt size={size} />}
        </Grid>
      </Section>
    </Container>
  );
}
