import type { ReactNode } from "react";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { Box, Button, Card, Flex, Grid, Heading, Text } from "@radix-ui/themes";
import gsap from "gsap";
import { ArrowLeft, FolderLock, HardDrive, Share2 } from "lucide-react";
import { APP_NAME } from "nfx-ui/config";
import { useTranslation } from "react-i18next";

import { Logo, LucideIcon, PreferencesPopover } from "@/components";
import { routerEventEmitter } from "@/events/router";
import { ROUTES } from "@/navigations";

import styles from "./s.module.css";

gsap.registerPlugin(useGSAP);

export type AuthShellProps = {
  brandTitle: string;
  brandEyebrow?: string;
  heroFooter: string;
  children: ReactNode;
};

export default function AuthShell({ brandTitle, brandEyebrow, heroFooter, children }: AuthShellProps) {
  const { t } = useTranslation("pages.Account.AuthShell");
  const pageRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.set(".js-glow", { autoAlpha: 0 });
      gsap.set(".js-auth-hero", { autoAlpha: 0, y: 24 });
      gsap.set(".js-auth-lift", { autoAlpha: 0, y: 20 });
      gsap.set(".js-auth-card", { autoAlpha: 0, y: 18 });
      gsap.set(".js-auth-stagger", { autoAlpha: 0, y: 20 });
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.to(".js-glow", { autoAlpha: 1, duration: 0.6 })
        .to(".js-auth-hero", { autoAlpha: 1, y: 0, duration: 0.7 }, "-=0.3")
        .to(".js-auth-lift", { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.08 }, "-=0.4")
        .to(".js-auth-card", { autoAlpha: 1, y: 0, duration: 0.6 }, "-=0.45")
        .to(".js-auth-stagger", { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.08 }, "-=0.35");
    },
    { scope: pageRef },
  );

  const pillars = [
    { icon: HardDrive, title: t("pillarIdentityTitle"), body: t("pillarIdentityBody") },
    { icon: FolderLock, title: t("pillarCommunityTitle"), body: t("pillarCommunityBody") },
    { icon: Share2, title: t("pillarLinkTitle"), body: t("pillarLinkBody") },
  ] as const;

  return (
    <Box ref={pageRef} position="relative" minHeight="100dvh" overflow="hidden" className={styles.page} asChild>
      <main>
        <Box className={styles.backdrop} aria-hidden />
        <Box className={`${styles.glow} js-glow`} aria-hidden />
        <Grid columns={{ initial: "1", md: "1fr 1fr" }} width="100%" minHeight="100dvh">
          <Flex direction="column" justify="between" gap="6" p={{ initial: "5", md: "7" }} className={`${styles.heroPanel} js-auth-hero`}>
            <Flex align="center" gap="3" className="js-auth-lift">
              <Logo variant="glassSquare" size="large" alt={`${APP_NAME} logo`} />
              <Flex direction="column" gap="1" minWidth="0">
                <Text size="3" weight="bold">
                  {APP_NAME}
                </Text>
                <Text size="1" className={styles.brandHome}>
                  {t("brandHome")}
                </Text>
              </Flex>
            </Flex>
            <Flex direction="column" gap="4" className="js-auth-lift">
              {brandEyebrow ? (
                <Text size="1" weight="bold" className={styles.brandEyebrow}>
                  {brandEyebrow}
                </Text>
              ) : null}
              <Heading as="h1" size={{ initial: "7", md: "8" }} className={styles.brandTitle}>
                {brandTitle}
              </Heading>
            </Flex>
            <Flex direction="column" gap="3" maxWidth="440px" className="js-auth-lift">
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
            <Text size="2" className={`${styles.heroFooter} js-auth-lift`}>
              {heroFooter}
            </Text>
          </Flex>
          <Flex align="center" justify="center" p={{ initial: "5", md: "6" }} className={styles.formPanel} position="relative">
            <Flex align="center" gap="2" position="absolute" top="4" right="4" className={styles.formToolbar}>
              <PreferencesPopover />
              <Button type="button" variant="soft" color="gray" size="2" onClick={() => routerEventEmitter.navigate({ to: ROUTES.HOME })}>
                <LucideIcon icon={ArrowLeft} size={15} />
                {t("backHome")}
              </Button>
            </Flex>
            <Card size="4" className={`${styles.card} js-auth-card`}>
              <Box>{children}</Box>
            </Card>
          </Flex>
        </Grid>
      </main>
    </Box>
  );
}
