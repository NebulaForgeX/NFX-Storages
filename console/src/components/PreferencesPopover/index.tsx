import type { AccentColorEnum, GrayColorEnum } from "nfx-ui/enums";

import { CheckIcon, GearIcon } from "@radix-ui/react-icons";
import { Box, Button, Flex, IconButton, Popover, RadioCards, SegmentedControl, Separator, Text } from "@radix-ui/themes";
import { AccentColor, Appearance, GrayColor, Language, LANGUAGE_VALUES, PanelBackground, Radius, RadiusEnum, Scaling } from "nfx-ui/enums";
import { useBaseLabel, useLanguageLabel, useSyncPreference } from "nfx-ui/hooks";
import { usePreferenceStore } from "nfx-ui/stores";
import {
  RADIX_ACCENT_VALUES,
  RADIX_GRAY_VALUES,
  RADIX_PANEL_BACKGROUND_VALUES,
  RADIX_RADIUS_TO_BASE,
  RADIX_RADIUS_VALUES,
  RADIX_SCALING_VALUES,
  THEME_APPEARANCE_VALUES,
} from "nfx-ui/themes";
import { useTranslation } from "react-i18next";

import styles from "./s.module.css";

export type PreferencesPopoverProps = {
  triggerVariant?: "outline" | "ghost";
};

function swatchVar(color: AccentColorEnum | GrayColorEnum): string {
  return color === "auto" ? "var(--gray-9)" : `var(--${color}-9)`;
}

const RADIUS_CORNER: Record<RadiusEnum, string> = {
  [RadiusEnum.NONE]: styles.radiusNone,
  [RadiusEnum.SMALL]: styles.radiusSmall,
  [RadiusEnum.MEDIUM]: styles.radiusMedium,
  [RadiusEnum.LARGE]: styles.radiusLarge,
  [RadiusEnum.FULL]: styles.radiusFull,
};

function PreferencesPopover({ triggerVariant = "outline" }: PreferencesPopoverProps) {
  const { t } = useTranslation("language");
  const themePreference = usePreferenceStore((s) => s.theme);
  const currentLanguage = usePreferenceStore((s) => s.language);
  const { syncPreference } = useSyncPreference();
  const { getLanguageDisplayName } = useLanguageLabel();
  const { getBaseDisplayName } = useBaseLabel();

  return (
    <Popover.Root>
      <Popover.Trigger>
        <IconButton variant={triggerVariant} size="2" aria-label={t("header.preferences")}>
          <GearIcon />
        </IconButton>
      </Popover.Trigger>
      <Popover.Content width="400px" side="bottom" align="end" sideOffset={8}>
        <Flex direction="column" gap="3" width="100%">
          <Text size="3" weight="bold">
            {t("header.theme")}
          </Text>

          <Flex direction="column" gap="1">
            <Text size="2" weight="medium">
              {t("header.accentColor")}
            </Text>
            <Flex wrap="wrap" gap="2">
              {RADIX_ACCENT_VALUES.map((c) => {
                const active = themePreference.accent === c;
                return (
                  <Button
                    key={c}
                    type="button"
                    variant="outline"
                    color="gray"
                    aria-label={c}
                    aria-pressed={active}
                    className={`${styles.swatch} ${active ? styles.swatchActive : ""}`}
                    style={{ background: swatchVar(c) }}
                    onClick={() => syncPreference({ theme: { accent: AccentColor(c) } })}
                  >
                    {active ? <CheckIcon color="white" width={11} height={11} /> : null}
                  </Button>
                );
              })}
            </Flex>
          </Flex>

          <Flex direction="column" gap="1">
            <Text size="2" weight="medium">
              {t("header.grayColor")}
            </Text>
            <Flex wrap="wrap" gap="2">
              {RADIX_GRAY_VALUES.map((c) => {
                const active = themePreference.gray === c;
                return (
                  <Button
                    key={c}
                    type="button"
                    variant="outline"
                    color="gray"
                    aria-label={c}
                    aria-pressed={active}
                    className={`${styles.swatch} ${active ? styles.swatchActive : ""}`}
                    style={{ background: swatchVar(c) }}
                    onClick={() => syncPreference({ theme: { gray: GrayColor(c) } })}
                  >
                    {active ? <CheckIcon color="white" width={11} height={11} /> : null}
                  </Button>
                );
              })}
            </Flex>
          </Flex>

          <Separator size="4" />

          <Flex direction="column" gap="1">
            <Text size="2" weight="medium">
              {t("header.appearance")}
            </Text>
            <SegmentedControl.Root
              value={themePreference.appearance}
              onValueChange={(next) => {
                if (next) syncPreference({ theme: { appearance: Appearance(next) } });
              }}
              size="1"
            >
              {THEME_APPEARANCE_VALUES.map((v) => (
                <SegmentedControl.Item key={v} value={v}>
                  {t(`header.appearanceMode.${v}`)}
                </SegmentedControl.Item>
              ))}
            </SegmentedControl.Root>
          </Flex>

          <Flex direction="column" gap="1">
            <Text size="2" weight="medium">
              {t("header.radius")}
            </Text>
            <RadioCards.Root size="1" columns="5" gap="2" value={themePreference.radius} onValueChange={(next) => syncPreference({ theme: { radius: Radius(next) } })}>
              {RADIX_RADIUS_VALUES.map((v) => {
                const platform = getBaseDisplayName(RADIX_RADIUS_TO_BASE[v]);
                return (
                  <RadioCards.Item key={v} value={v} aria-label={platform}>
                    <Flex direction="column" align="center" gap="1" width="100%">
                      <Box asChild className={`${styles.radiusCorner} ${RADIUS_CORNER[v]}`}>
                        <span />
                      </Box>
                      <Text as="span" size="1" weight="bold" align="center">
                        {platform}
                      </Text>
                    </Flex>
                  </RadioCards.Item>
                );
              })}
            </RadioCards.Root>
          </Flex>

          <Flex direction="column" gap="1">
            <Text size="2" weight="medium">
              {t("header.scaling")}
            </Text>
            <SegmentedControl.Root
              value={themePreference.scaling}
              onValueChange={(next) => {
                if (next) syncPreference({ theme: { scaling: Scaling(next) } });
              }}
              size="1"
            >
              {RADIX_SCALING_VALUES.map((v) => (
                <SegmentedControl.Item key={v} value={v}>
                  {v}
                </SegmentedControl.Item>
              ))}
            </SegmentedControl.Root>
          </Flex>

          <Flex direction="column" gap="1">
            <Text size="2" weight="medium">
              {t("header.panelBackground")}
            </Text>
            <SegmentedControl.Root
              value={themePreference.panelBackground}
              onValueChange={(next) => {
                if (next)
                  syncPreference({
                    theme: { panelBackground: PanelBackground(next) },
                  });
              }}
              size="1"
            >
              {RADIX_PANEL_BACKGROUND_VALUES.map((v) => (
                <SegmentedControl.Item key={v} value={v}>
                  {t(`header.panelBackgroundMode.${v}`)}
                </SegmentedControl.Item>
              ))}
            </SegmentedControl.Root>
          </Flex>

          <Flex direction="column" gap="1">
            <Text size="2" weight="medium">
              {t("header.language")}
            </Text>
            <SegmentedControl.Root
              value={currentLanguage}
              onValueChange={(next) => {
                if (next) syncPreference({ language: Language(next) });
              }}
              size="1"
            >
              {LANGUAGE_VALUES.map((v) => (
                <SegmentedControl.Item key={v} value={v}>
                  {getLanguageDisplayName(v)}
                </SegmentedControl.Item>
              ))}
            </SegmentedControl.Root>
          </Flex>
        </Flex>
      </Popover.Content>
    </Popover.Root>
  );
}

export default PreferencesPopover;
