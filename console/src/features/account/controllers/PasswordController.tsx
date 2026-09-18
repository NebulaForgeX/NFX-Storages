import type { LoginFormData } from "nfx-ui/schemas";

import { useState } from "react";
import { Flex, IconButton, Text, TextField } from "@radix-ui/themes";
import { Eye, EyeOff } from "lucide-react";
import { SignupFormData } from "nfx-ui/schemas";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { LucideIcon } from "@/components";

export type LoginPasswordControllerProps = Record<string, never>;

const LoginPasswordController = () => {
  const { t } = useTranslation("pages.Account.Login");
  const {
    register,
    formState: { errors },
  } = useFormContext<LoginFormData>();
  const [visible, setVisible] = useState(false);

  return (
    <Flex direction="column" gap="1" width="100%">
      <Text as="label" size="2" weight="medium" htmlFor="password">
        {t("form.passwordLabel")}
      </Text>
      <TextField.Root
        id="password"
        size="3"
        type={visible ? "text" : "password"}
        placeholder={t("form.passwordPlaceholder")}
        autoComplete="current-password"
        style={{ width: "100%" }}
        {...register("password")}
      >
        <TextField.Slot side="right">
          <IconButton type="button" variant="soft" size="1" color="gray" aria-label={t("form.passwordLabel")} onClick={() => setVisible((v) => !v)}>
            <LucideIcon icon={visible ? EyeOff : Eye} size={16} />
          </IconButton>
        </TextField.Slot>
      </TextField.Root>
      {errors.password?.message ? (
        <Text size="1" color="red">
          {errors.password.message}
        </Text>
      ) : null}
    </Flex>
  );
};

LoginPasswordController.displayName = "LoginPasswordController";

export type SignupPasswordControllerProps = Record<string, never>;

const SignupPasswordController = () => {
  const { t } = useTranslation("pages.Account.Signup");
  const { control } = useFormContext<SignupFormData>();
  const [visible, setVisible] = useState(false);

  return (
    <Controller
      name="password"
      control={control}
      render={({ field, fieldState }) => (
        <Flex direction="column" gap="1" width="100%">
          <Text as="label" size="2" weight="medium" htmlFor={field.name}>
            {t("passwordLabel")}
          </Text>
          <TextField.Root
            {...field}
            id={field.name}
            size="3"
            type={visible ? "text" : "password"}
            placeholder={t("passwordPlaceholder")}
            autoComplete="new-password"
            style={{ width: "100%" }}
          >
            <TextField.Slot side="right">
              <IconButton type="button" variant="soft" size="1" color="gray" aria-label={t("passwordLabel")} onClick={() => setVisible((v) => !v)}>
                <LucideIcon icon={visible ? EyeOff : Eye} size={16} />
              </IconButton>
            </TextField.Slot>
          </TextField.Root>
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

SignupPasswordController.displayName = "SignupPasswordController";

export interface SignupConfirmPasswordControllerProps {
  label?: string;
  placeholder?: string;
}

const SignupConfirmPasswordController = ({ label, placeholder }: SignupConfirmPasswordControllerProps) => {
  const { t } = useTranslation("pages.Account.Signup");
  const { control } = useFormContext<SignupFormData>();
  const [visible, setVisible] = useState(false);

  return (
    <Controller
      name="confirmPassword"
      control={control}
      render={({ field, fieldState }) => (
        <Flex direction="column" gap="1" width="100%">
          <Text as="label" size="2" weight="medium" htmlFor={field.name}>
            {label ?? t("confirmLabel")}
          </Text>
          <TextField.Root
            {...field}
            id={field.name}
            size="3"
            type={visible ? "text" : "password"}
            placeholder={placeholder ?? t("confirmPlaceholder")}
            autoComplete="new-password"
            style={{ width: "100%" }}
          >
            <TextField.Slot side="right">
              <IconButton type="button" variant="soft" size="1" color="gray" aria-label={label ?? t("confirmLabel")} onClick={() => setVisible((v) => !v)}>
                <LucideIcon icon={visible ? EyeOff : Eye} size={16} />
              </IconButton>
            </TextField.Slot>
          </TextField.Root>
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

SignupConfirmPasswordController.displayName = "SignupConfirmPasswordController";

export { LoginPasswordController, SignupPasswordController, SignupConfirmPasswordController };
