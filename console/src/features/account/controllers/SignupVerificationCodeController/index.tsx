import type { SignupFormData } from "nfx-ui/schemas";

import { Flex, Text } from "@radix-ui/themes";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { VerificationCodeOtp } from "../../components/VerificationCodeOtp";
import styles from "./s.module.css";

export type SignupVerificationCodeControllerProps = Record<string, never>;

const SignupVerificationCodeController = () => {
  const { t } = useTranslation("pages.Account.Signup");
  const { control, formState } = useFormContext<SignupFormData>();
  const labelId = "signup-verification-code-label";

  return (
    <Controller
      name="verificationCode"
      control={control}
      render={({ field, fieldState }) => {
        const errorId = `${labelId}-error`;
        const error = fieldState.error?.message;
        const showError = Boolean(error && (fieldState.isTouched || formState.isSubmitted));

        return (
          <Flex direction="column" gap="1" width="100%" className={styles.fieldRoot}>
            <Text as="label" size="2" weight="medium" id={labelId}>
              {t("codeLabel")}
            </Text>
            <VerificationCodeOtp
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              hiddenInputRef={field.ref}
              name="verificationCode"
              labelId={labelId}
              errorId={errorId}
              showError={showError}
            />

            {showError && error ? (
              <Text id={errorId} size="1" color="red">
                {error}
              </Text>
            ) : null}
          </Flex>
        );
      }}
    />
  );
};

SignupVerificationCodeController.displayName = "SignupVerificationCodeController";

export default SignupVerificationCodeController;
