import type { UserProfileEditFormData } from "nfx-ui/schemas";

import { Flex, Text, TextArea } from "@radix-ui/themes";
import { safeStringable } from "nfx-ui/utils";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import styles from "./BioController.module.css";

export const BioController = () => {
  const { t } = useTranslation("pages.User.Profile.Edit");
  const { control } = useFormContext<UserProfileEditFormData>();

  return (
    <Controller
      name="bio"
      control={control}
      render={({ field, fieldState }) => (
        <Flex direction="column" gap="1" width="100%">
          <Text as="label" size="2" weight="medium" htmlFor={field.name}>
            {t("overview.bio")}
          </Text>
          <TextArea
            id={field.name}
            size="3"
            className={styles.textarea}
            placeholder={t("edit.bioPlaceholder")}
            rows={12}
            name={field.name}
            ref={field.ref}
            onBlur={field.onBlur}
            onChange={field.onChange}
            value={safeStringable(field.value)}
          />

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
BioController.displayName = "BioController";
