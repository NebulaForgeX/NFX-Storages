import type { ReactNode } from "react";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { Box, Button, Card, Flex, Grid, Heading, Text } from "@radix-ui/themes";
import gsap from "gsap";
import { ArrowLeft, Fingerprint, Link2, Users } from "lucide-react";
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

function CityDistrictBlocks() {
  const districts = [
    { key: "identity", label: "Identity" },
    { key: "forger", label: "Forger" },
    { key: "link", label: "NFX" },
  ] as const;
  return (
    <Grid columns="3" gap="3" className={`${styles.districtRail} js-auth-lift`} aria-hidden>
      {districts.map((d) => (
        <Flex key={d.key} direction="column" justify="end" align="start" p="3" minHeight="88px" className={`${styles.districtBlock} js-node`}>
          <Text size="1" weight="bold" className={styles.districtLabel}>
            {d.label}
          </Text>
        </Flex>
      ))}
    </Grid>
  );
}

export default function AuthShell({ brandTitle, brandEyebrow, heroFooter, children }: AuthShellProps) {
  const { t } = useTranslation("pages.Account.AuthShell");
  const pageRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.set(".js-glow", { autoAlpha: 0 });
      gsap.set(".js-auth-hero", { autoAlpha: 0, x: -40 });
      gsap.set(".js-auth-lift", { autoAlpha: 0, y: 36 });
      gsap.set(".js-auth-card", { autoAlpha: 0, y: 28 });
      gsap.set(".js-auth-stagger", { autoAlpha: 0, y: 20 });
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.to(".js-glow", { autoAlpha: 1, duration: 0.55 })
        .to(".js-auth-hero", { autoAlpha: 1, x: 0, duration: 0.85 }, "-=0.25")
        .to(".js-auth-lift", { autoAlpha: 1, y: 0, duration: 0.75, stagger: 0.12 }, "-=0.45")
        .to(".js-auth-card", { autoAlpha: 1, y: 0, duration: 0.7 }, "-=0.5")
        .to(".js-auth-stagger", { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.08 }, "-=0.35");

      gsap.to(".js-node", {
        y: -6,
        duration: 1.6,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        stagger: 0.2,
      });
    },
    { scope: pageRef },
  );

  const pillars = [
    {
      icon: Fingerprint,
      title: t("pillarIdentityTitle"),
      body: t("pillarIdentityBody"),
    },
    {
      icon: Users,
      title: t("pillarCommunityTitle"),
      body: t("pillarCommunityBody"),
    },
    { icon: Link2, title: t("pillarLinkTitle"), body: t("pillarLinkBody") },
  ] as const;

  return (
    <Box ref={pageRef} position="relative" minHeight="100dvh" overflow="hidden" className={styles.page} asChild>
      <main>
        <Box className={styles.backdrop} aria-hidden />
        <Box className={`${styles.glow} js-glow`} aria-hidden />

        <Grid columns={{ initial: "1", md: "0.95fr 1.05fr" }} width="100%" minHeight="100dvh">
          <Flex direction="column" justify="between" gap="5" p={{ initial: "5", md: "6" }} className={`${styles.heroPanel} js-auth-hero`}>
            <Flex align="center" gap="3" className="js-auth-lift">
              <Logo variant="glassSquare" size="large" alt={`${APP_NAME} logo`} />
              <Flex direction="column" gap="1" minWidth="0">
                <Text size="3" weight="bold">
                  {APP_NAME}
                </Text>
                <Text size="1" style={{ opacity: 0.8 }}>
                  City home
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

            <CityDistrictBlocks />

            <Flex direction="column" gap="3" maxWidth="420px" className="js-auth-lift">
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
