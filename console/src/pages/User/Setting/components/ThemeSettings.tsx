import { CheckedIcon, RefreshIcon, SaveIcon } from "nfx-ui/icons";
import type { ReactNode } from "react";

import { useEffect, useState } from "react";
import { Badge, Box, Button, Card, Flex, Grid, Heading, RadioCards, SegmentedControl, Switch, Text, TextField, Theme } from "@radix-ui/themes";
import { APP_NAME } from "nfx-ui/config";
import { AccentColorEnum, AppearanceEnum, GrayColorEnum, LanguageEnum, PanelBackgroundEnum, RadiusEnum, ScalingEnum, ThemeFontFamilyEnum } from "nfx-ui/enums";
import { useBaseLabel, useSyncPreference } from "nfx-ui/hooks";
import { usePreferenceStore } from "nfx-ui/stores";
import {
  RADIX_ACCENT_VALUES,
  RADIX_GRAY_VALUES,
  RADIX_PANEL_BACKGROUND_VALUES,
  RADIX_RADIUS_TO_BASE,
  RADIX_RADIUS_VALUES,
  RADIX_SCALING_VALUES,
  ResolvedThemePreference,
  resolveRadixAppearance,
  THEME_APPEARANCE_VALUES,
  THEME_FONT_FAMILY_VALUES,
} from "nfx-ui/themes";
import { useTranslation } from "react-i18next";

import { LucideIcon } from "@/components";

import styles from "../s.module.css";

const FONT_LABEL_KEY: Record<ThemeFontFamilyEnum, string> = {
  [ThemeFontFamilyEnum.SYSTEM]: "labels.fontSystem",
  [ThemeFontFamilyEnum.IBM_PLEX]: "labels.fontIbmPlex",
  [ThemeFontFamilyEnum.NOTO]: "labels.fontNoto",
  [ThemeFontFamilyEnum.SOURCE_SANS]: "labels.fontSourceSans",
};

const LANG_CODE: Record<LanguageEnum, string> = {
  [LanguageEnum.EN]: "EN",
  [LanguageEnum.ZH]: "ZH",
  [LanguageEnum.FR]: "FR",
};

const LANG_NAME_KEY: Record<LanguageEnum, string> = {
  [LanguageEnum.EN]: "labels.langEn",
  [LanguageEnum.ZH]: "labels.langZh",
  [LanguageEnum.FR]: "labels.langFr",
};

function swatchVar(color: AccentColorEnum | GrayColorEnum): string {
  return color === "auto" ? "var(--gray-9)" : `var(--${color}-9)`;
}

function toDraft(pref: ResolvedThemePreference): ResolvedThemePreference {
  return { ...pref };
}

function Tile({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card size="2">
      <Flex direction="column" gap="4" height="100%">
        <Box>
          <Text size="2" weight="bold">
            {title}
          </Text>
        </Box>
        <Flex direction="column" gap="4" flexGrow="1" align="start">
          {children}
        </Flex>
      </Flex>
    </Card>
  );
}

export default function ThemeSettings() {
  const { t } = useTranslation("pages.User.Setting");
  const themePreference = usePreferenceStore((s) => s.theme);
  const currentLanguage = usePreferenceStore((s) => s.language);
  const { syncPreference } = useSyncPreference();
  const { getBaseDisplayName } = useBaseLabel();
  const [draft, setDraft] = useState(() => toDraft(themePreference));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(toDraft(themePreference));
  }, [themePreference]);

  const dirty =
    draft.accent !== themePreference.accent ||
    draft.gray !== themePreference.gray ||
    draft.appearance !== themePreference.appearance ||
    draft.radius !== themePreference.radius ||
    draft.scaling !== themePreference.scaling ||
    draft.panelBackground !== themePreference.panelBackground ||
    draft.fontFamily !== themePreference.fontFamily;

  const setField = (patch: Partial<ResolvedThemePreference>) => setDraft((prev) => ({ ...prev, ...patch }));
  const previewAppearance = resolveRadixAppearance(draft.appearance);

  return (
    <Flex direction="column" gap="3">
      <Grid columns={{ initial: "1", sm: "2", md: "3" }} gap="3" width="100%">
        <Tile title={t("labels.colorAndAppearance")}>
          <Flex direction="column" gap="2" width="100%" align="start">
            <Text size="1" weight="medium" color="gray">
              {t("labels.appearance")}
            </Text>
            <Box className={styles.controlFit}>
              <SegmentedControl.Root size="2" value={draft.appearance} onValueChange={(v) => setField({ appearance: v as AppearanceEnum })}>
                {THEME_APPEARANCE_VALUES.map((v) => (
                  <SegmentedControl.Item key={v} value={v}>
                    {v}
                  </SegmentedControl.Item>
                ))}
              </SegmentedControl.Root>
            </Box>
          </Flex>
          <Flex direction="column" gap="2" width="100%" align="start">
            <Text size="1" weight="medium" color="gray">
              {t("labels.accent")}
            </Text>
            <Flex wrap="wrap" gap="2" width="max-content" maxWidth="100%">
              {RADIX_ACCENT_VALUES.map((c) => {
                const active = draft.accent === c;
                return (
                  <button
                    key={c}
                    type="button"
                    aria-label={c}
                    aria-pressed={active}
                    onClick={() => setField({ accent: c })}
                    className={`${styles.swatch} ${active ? styles.swatchActive : ""}`}
                    style={{ background: swatchVar(c) }}
                  >
                    {active ? <LucideIcon icon={CheckedIcon} size={12} color="white" /> : null}
                  </button>
                );
              })}
            </Flex>
          </Flex>
          <Flex direction="column" gap="2" width="100%" align="start">
            <Text size="1" weight="medium" color="gray">
              {t("labels.gray")}
            </Text>
            <Flex wrap="wrap" gap="2" width="max-content" maxWidth="100%">
              {RADIX_GRAY_VALUES.map((c) => {
                const active = draft.gray === c;
                return (
                  <button
                    key={c}
                    type="button"
                    aria-label={c}
                    aria-pressed={active}
                    onClick={() => setField({ gray: c })}
                    className={`${styles.swatch} ${active ? styles.swatchActive : ""}`}
                    style={{ background: swatchVar(c) }}
                  >
                    {active ? <LucideIcon icon={CheckedIcon} size={12} color="white" /> : null}
                  </button>
                );
              })}
            </Flex>
          </Flex>
        </Tile>

        <Tile title={t("labels.layoutAndType")}>
          <Flex direction="column" gap="2" width="100%" align="start">
            <Text size="1" weight="medium" color="gray">
              {t("labels.radius")}
            </Text>
            <Box className={styles.controlFit}>
              <SegmentedControl.Root size="2" value={draft.radius} onValueChange={(v) => setField({ radius: v as RadiusEnum })}>
                {RADIX_RADIUS_VALUES.map((v) => (
                  <SegmentedControl.Item key={v} value={v}>
                    {getBaseDisplayName(RADIX_RADIUS_TO_BASE[v])}
                  </SegmentedControl.Item>
                ))}
              </SegmentedControl.Root>
            </Box>
          </Flex>
          <Flex direction="column" gap="2" width="100%" align="start">
            <Text size="1" weight="medium" color="gray">
              {t("labels.scaling")}
            </Text>
            <Box className={styles.controlFit}>
              <SegmentedControl.Root size="2" value={draft.scaling} onValueChange={(v) => setField({ scaling: v as ScalingEnum })}>
                {RADIX_SCALING_VALUES.map((v) => (
                  <SegmentedControl.Item key={v} value={v}>
                    {v}
                  </SegmentedControl.Item>
                ))}
              </SegmentedControl.Root>
            </Box>
          </Flex>
          <Flex direction="column" gap="2" width="100%" align="start">
            <Text size="1" weight="medium" color="gray">
              {t("labels.panelBackground")}
            </Text>
            <Box className={styles.controlFit}>
              <SegmentedControl.Root size="2" value={draft.panelBackground} onValueChange={(v) => setField({ panelBackground: v as PanelBackgroundEnum })}>
                {RADIX_PANEL_BACKGROUND_VALUES.map((v) => (
                  <SegmentedControl.Item key={v} value={v}>
                    {v}
                  </SegmentedControl.Item>
                ))}
              </SegmentedControl.Root>
            </Box>
          </Flex>
          <Flex direction="column" gap="2" width="100%" align="start">
            <Text size="1" weight="medium" color="gray">
              {t("labels.font")}
            </Text>
            <Box className={styles.controlFit}>
              <SegmentedControl.Root size="2" value={draft.fontFamily} onValueChange={(v) => setField({ fontFamily: v as ThemeFontFamilyEnum })}>
                {THEME_FONT_FAMILY_VALUES.map((v) => (
                  <SegmentedControl.Item key={v} value={v}>
                    {t(FONT_LABEL_KEY[v])}
                  </SegmentedControl.Item>
                ))}
              </SegmentedControl.Root>
            </Box>
          </Flex>
        </Tile>

        <Tile title={t("labels.livePreview")}>
          <Theme
            appearance={previewAppearance}
            accentColor={draft.accent}
            grayColor={draft.gray}
            radius={draft.radius}
            scaling={draft.scaling}
            panelBackground={draft.panelBackground}
            hasBackground
            className={styles.previewTheme}
          >
            <Card size="2">
              <Flex direction="column" gap="3">
                <Flex align="center" justify="between">
                  <Heading size="4">{APP_NAME}</Heading>
                  <Badge size="1">{t("labels.previewBadge")}</Badge>
                </Flex>
                <Flex gap="2" wrap="wrap">
                  <Button size="2">{t("labels.previewSolid")}</Button>
                  <Button size="2" variant="soft">
                    {t("labels.previewSoft")}
                  </Button>
                </Flex>
                <TextField.Root size="2" placeholder={t("labels.sampleInput")} />
                <Flex align="center" gap="2">
                  <Switch size="2" defaultChecked />
                  <Text size="2">{t("labels.notifications")}</Text>
                </Flex>
              </Flex>
            </Card>
          </Theme>
        </Tile>

        <Tile title={t("sections.language.title")}>
          <RadioCards.Root size="1" columns="3" gap="2" value={currentLanguage} onValueChange={(v) => syncPreference({ language: v as LanguageEnum })}>
            {(Object.values(LanguageEnum) as LanguageEnum[]).map((lang) => (
              <RadioCards.Item key={lang} value={lang}>
                <Flex direction="column" align="center" gap="1" width="100%">
                  <Text size="3" weight="bold">
                    {LANG_CODE[lang]}
                  </Text>
                  <Text size="1" color="gray">
                    {t(LANG_NAME_KEY[lang])}
                  </Text>
                </Flex>
              </RadioCards.Item>
            ))}
          </RadioCards.Root>
        </Tile>
      </Grid>

      <Card size="2">
        <Flex align="center" justify="end" gap="2" wrap="wrap">
          {dirty ? (
            <Text size="1" color="gray" mr="auto">
              {t("labels.unsavedChanges")}
            </Text>
          ) : null}
          <Button type="button" variant="soft" color="gray" size="2" onClick={() => setDraft(toDraft(themePreference))} disabled={!dirty || saving}>
            <LucideIcon icon={RefreshIcon} size={14} />
            {t("actions.reset")}
          </Button>
          <Button
            type="button"
            size="2"
            disabled={!dirty || saving}
            onClick={() => {
              setSaving(true);
              try {
                syncPreference({ theme: { ...draft } });
              } finally {
                setSaving(false);
              }
            }}
          >
            <LucideIcon icon={SaveIcon} size={14} />
            {t("actions.saveTheme")}
          </Button>
        </Flex>
      </Card>
    </Flex>
  );
}
