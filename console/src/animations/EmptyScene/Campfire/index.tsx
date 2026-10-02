import { Container, Flex } from "@radix-ui/themes";

import styles from "./s.module.css";

export function CampfireArt() {
  return (
    <div className={styles.campfire}>
      <div className={styles.fireContainer}>
        <div className={`${styles.flame} ${styles.flameMain}`} />
        <div className={`${styles.flame} ${styles.flameLeft}`} />
        <div className={`${styles.flame} ${styles.flameRight}`} />
      </div>
      <div className={styles.logs}>
        <Container className={styles.logsPx}>
          <Flex className={styles.logsRow}>
            <div className={styles.log} />
            <div className={styles.log} />
          </Flex>
        </Container>
      </div>
      <div className={styles.embers}>
        <div className={styles.ember} style={{ ["--delay" as string]: 0 }} />
        <div className={styles.ember} style={{ ["--delay" as string]: 0.3 }} />
        <div className={styles.ember} style={{ ["--delay" as string]: 0.6 }} />
      </div>
      <div className={styles.sparkles} />
    </div>
  );
}
