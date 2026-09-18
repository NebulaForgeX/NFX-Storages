import type { LoginFormData, SignupFormData } from "nfx-ui/schemas";
import type { ReactNode } from "react";

import { Flex, Text, TextField } from "@radix-ui/themes";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

export type LoginEmailControllerProps = Record<string, never>;

const LoginEmailController = () => {
  const { t } = useTranslation("pages.Account.Login");
  const {
    register,
    formState: { errors },
  } = useFormContext<LoginFormData>();

  return (
    <Flex direction="column" gap="1" width="100%">
      <Text as="label" size="2" weight="medium" htmlFor="email">
        {t("form.emailLabel")}
      </Text>
      <TextField.Root id="email" size="3" type="email" placeholder={t("form.emailPlaceholder")} autoComplete="email" style={{ width: "100%" }} {...register("email")} />
      {errors.email?.message ? (
        <Text size="1" color="red">
          {errors.email.message}
        </Text>
      ) : null}
    </Flex>
  );
};

LoginEmailController.displayName = "LoginEmailController";

export interface SignupEmailControllerProps {
  helperText?: ReactNode;
  /** 输入框右侧同行区域（如发送验证码按钮）。Trailing slot beside email field. */
  trailingSlot?: ReactNode;
}

const SignupEmailController = ({ helperText, trailingSlot }: SignupEmailControllerProps) => {
  const { t } = useTranslation("pages.Account.Signup");
  const {
    register,
    formState: { errors },
  } = useFormContext<SignupFormData>();

  return (
    <Flex direction="column" gap="1" width="100%">
      <Text as="label" size="2" weight="medium" htmlFor="email">
        {t("emailLabel")}
      </Text>
      {trailingSlot ? (
        <Flex align="end" gap="2" width="100%">
          <Flex flexGrow="1" minWidth="0">
            <TextField.Root id="email" size="3" type="email" placeholder={t("emailPlaceholder")} autoComplete="email" style={{ width: "100%" }} {...register("email")} />
          </Flex>
          {trailingSlot}
        </Flex>
      ) : (
        <TextField.Root id="email" size="3" type="email" placeholder={t("emailPlaceholder")} autoComplete="email" style={{ width: "100%" }} {...register("email")} />
      )}
      {errors.email?.message ? (
        <Text size="1" color="red">
          {errors.email.message}
        </Text>
      ) : null}
      {helperText && !errors.email?.message ? (
        <Text size="1" color="gray">
          {helperText}
        </Text>
      ) : null}
    </Flex>
  );
};

SignupEmailController.displayName = "SignupEmailController";

export { SignupEmailController, LoginEmailController };
