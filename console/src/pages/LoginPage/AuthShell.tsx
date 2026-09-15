import type { ReactNode } from "react";

import { Box, Card, Flex, Grid, Heading, Text } from "@radix-ui/themes";
import { Database, FolderOpen, KeyRound } from "@/assets/icons/lucide";
import { Logo, LucideIcon, PreferencesPopover } from "nfx-ui/components";

import styles from "./AuthShell.module.css";

export type AuthShellProps = {
  brandTitle: string;
  brandEyebrow?: string;
  heroFooter: string;
  children: ReactNode;
};

export default function AuthShell({ brandTitle, brandEyebrow, heroFooter, children }: AuthShellProps) {
  const pillars = [
    { icon: FolderOpen, title: "Objects", body: "Browse and manage buckets" },
    { icon: KeyRound, title: "IAM", body: "Users, policies, and access keys" },
    { icon: Database, title: "Storage", body: "Lifecycle, replication, and events" },
  ] as const;

  return (
    <Box position="relative" minHeight="100dvh" overflow="hidden" className={styles.page} asChild>
      <main>
        <Box className={styles.backdrop} aria-hidden />
        <Grid columns={{ initial: "1", md: "0.95fr 1.05fr" }} width="100%" minHeight="100dvh">
          <Flex direction="column" justify="between" gap="5" p={{ initial: "5", md: "6" }} className={styles.heroPanel}>
            <Flex align="center" gap="3">
              <Logo variant="glassSquare" size="large" title="NFX" subtitle="Storage" alt="NFX" />
            </Flex>
            <Flex direction="column" gap="4">
              {brandEyebrow ? (
                <Text size="1" weight="bold" className={styles.brandEyebrow}>
                  {brandEyebrow}
                </Text>
              ) : null}
              <Heading as="h1" size={{ initial: "7", md: "8" }} className={styles.brandTitle}>
                {brandTitle}
              </Heading>
            </Flex>
            <Flex direction="column" gap="3" maxWidth="420px">
              {pillars.map((pillar) => (
                <Flex key={pillar.title} align="start" gap="3" p="3" className={styles.pillar}>
                  <Flex align="center" justify="center" width="36px" height="36px" flexShrink="0" className={styles.pillarIcon}>
                    <LucideIcon icon={pillar.icon} size={16} />
                  </Flex>
                  <Flex direction="column" gap="1" minWidth="0">
                    <Text size="2" weight="bold" className={styles.pillarTitle}>
                      {pillar.title}
                    </Text>
                    <Text size="1" className={styles.pillarBody}>
                      {pillar.body}
                    </Text>
                  </Flex>
                </Flex>
              ))}
            </Flex>
            <Text size="2" className={styles.heroFooter}>
              {heroFooter}
            </Text>
          </Flex>
          <Flex align="center" justify="center" p={{ initial: "5", md: "6" }} className={styles.formPanel} position="relative">
            <Flex align="center" gap="2" position="absolute" top="4" right="4" className={styles.formToolbar}>
              <PreferencesPopover />
            </Flex>
            <Card size="4" className={styles.card}>
              <Box>{children}</Box>
            </Card>
          </Flex>
        </Grid>
      </main>
    </Box>
  );
}
