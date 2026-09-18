import type { LoginFormData, SignupFormData } from "nfx-ui/schemas";

import { Checkbox, Flex, Text } from "@radix-ui/themes";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

export type LoginRememberControllerProps = Record<string, never>;

const LoginRememberController = () => {
  const { t } = useTranslation("pages.Account.Login");
  const { control } = useFormContext<LoginFormData>();

  return (
    <Controller
      name="rememberMe"
      control={control}
      render={({ field }) => (
        <Text as="label" size="2">
          <Flex align="center" gap="2">
            <Checkbox size="2" name={field.name} ref={field.ref} checked={!!field.value} onBlur={field.onBlur} onCheckedChange={(checked) => field.onChange(checked === true)} />
            {t("form.rememberMe")}
          </Flex>
        </Text>
      )}
    />
  );
};

LoginRememberController.displayName = "LoginRememberController";

export type SignupRememberControllerProps = Record<string, never>;

const SignupRememberController = () => {
  const { t } = useTranslation("pages.Account.Signup");
  const { control } = useFormContext<SignupFormData>();

  return (
    <Controller
      name="rememberMe"
      control={control}
      render={({ field }) => (
        <Text as="label" size="2">
          <Flex align="center" gap="2">
            <Checkbox size="2" name={field.name} ref={field.ref} checked={!!field.value} onBlur={field.onBlur} onCheckedChange={(checked) => field.onChange(checked === true)} />
            {t("rememberMe")}
          </Flex>
        </Text>
      )}
    />
  );
};

SignupRememberController.displayName = "SignupRememberController";
export { LoginRememberController, SignupRememberController };
