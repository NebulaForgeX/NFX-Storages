import { ReactNode } from "react";
import { Box, Flex, Text } from "@radix-ui/themes";
import { APP_NAME } from "nfx-ui/config";
import { useResolvedAppearance } from "nfx-ui/hooks";

import { getLogoSrc } from "@/constants";
import { routerEventEmitter } from "@/events/router";
import { ROUTES } from "@/navigations";

import styles from "./styles.module.css";

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
  const logoClasses = [styles.logo, styles[variant], styles[size], className].filter(Boolean).join(" ");

  return (
    <Flex asChild align="center" gap="3" width="fit-content">
      <button
        type="button"
        className={logoClasses}
        aria-label={typeof title === "string" ? title : APP_NAME}
        onClick={() => {
          routerEventEmitter.navigate({ to });
          onClick?.();
        }}
      >
        <Box asChild className={styles.mark}>
          <span>
            <img src={getLogoSrc(appearance)} alt={alt} />
          </span>
        </Box>

        {(title || subtitle) && (
          <Flex direction="column" gap="1" minWidth="0" overflow="hidden">
            {title && (
              <Text as="span" size="3" weight="bold" truncate color="gray" highContrast>
                {title}
              </Text>
            )}
            {subtitle && (
              <Text as="span" size="1" weight="medium" truncate color="gray">
                {subtitle}
              </Text>
            )}
          </Flex>
        )}
      </button>
    </Flex>
  );
}

export default Logo;
