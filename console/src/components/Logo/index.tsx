import { ReactNode } from "react";
import { Box, Button, Flex, Text } from "@radix-ui/themes";
import { APP_NAME } from "nfx-ui/config";
import { useResolvedAppearance } from "nfx-ui/hooks";

import { getLogoSrc } from "@/constants";
import { routerEventEmitter } from "@/events/router";
import { ROUTES } from "@/navigations";

import styles from "./s.module.css";

export interface LogoProps {
  to?: string;
  alt?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  variant?: "plain" | "glassSquare" | "glassCircle";
  size?: "small" | "medium" | "large";
  className?: string;
  onClick?: () => void;
}

function Logo({ to = ROUTES.HOME, alt = `${APP_NAME} logo`, title, subtitle, variant = "plain", size = "medium", className = "", onClick }: LogoProps) {
  const appearance = useResolvedAppearance();
  const markClass = [
    styles.mark,
    styles[variant],
    size === "small" ? styles.small : size === "large" ? styles.large : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Button
      type="button"
      variant="ghost"
      className={[styles.logo, className].filter(Boolean).join(" ")}
      aria-label={typeof title === "string" ? title : APP_NAME}
      onClick={() => {
        routerEventEmitter.navigate({ to });
        onClick?.();
      }}
    >
      <Flex align="center" gap="3" width="fit-content">
        <Box className={markClass}>
          <img src={getLogoSrc(appearance)} alt={alt} />
        </Box>
        {(title || subtitle) && (
          <Flex direction="column" gap="1" minWidth="0">
            {title ? (
              <Text as="span" size="3" weight="bold" truncate color="gray" highContrast>
                {title}
              </Text>
            ) : null}
            {subtitle ? (
              <Text as="span" size="1" weight="medium" truncate color="gray">
                {subtitle}
              </Text>
            ) : null}
          </Flex>
        )}
      </Flex>
    </Button>
  );
}

export default Logo;
