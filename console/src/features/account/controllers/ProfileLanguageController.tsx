import type { UserProfileEditFormData } from "nfx-ui/schemas";

import { Flex, Select, Text } from "@radix-ui/themes";
import { Languages } from "lucide-react";
import { Language, LANGUAGE_VALUES, LanguageEnum } from "nfx-ui/enums";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { LucideIcon } from "@/components";

export const ProfileLanguageController = () => {
  const { t } = useTranslation("pages.User.Profile.Edit");
  const { control } = useFormContext<UserProfileEditFormData>();

  const languageLabels = {
    [LanguageEnum.EN]: t("edit.language.en"),
    [LanguageEnum.ZH]: t("edit.language.zh"),
    [LanguageEnum.FR]: t("edit.language.fr"),
  } as Record<LanguageEnum, string>;

  return (
    <Controller
      name="profileLanguage"
      control={control}
      render={({ field, fieldState }) => (
        <Flex direction="column" gap="1" width="100%">
          <Text as="label" size="2" weight="medium" htmlFor={field.name}>
            <Flex as="span" align="center" gap="1">
              <LucideIcon icon={Languages} size={16} />
              {t("edit.profileLanguage")}
            </Flex>
          </Text>
          <Select.Root size="3" value={field.value} onValueChange={(value) => field.onChange(Language(value))}>
            <Select.Trigger id={field.name} variant="surface" style={{ width: "100%" }} />
            <Select.Content>
              {LANGUAGE_VALUES.map((value) => (
                <Select.Item key={value} value={value}>
                  {languageLabels[value]}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
          {fieldState.error?.message ? (
            <Text size="1" color="red">
              {fieldState.error.message}
            </Text>
          ) : null}
        </Flex>
      )}
    />
  );
};
ProfileLanguageController.displayName = "ProfileLanguageController";
