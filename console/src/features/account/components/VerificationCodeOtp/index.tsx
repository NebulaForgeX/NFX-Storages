import type { ReactNode, Ref } from "react";

import { useEffect, useState } from "react";
import { Flex } from "@radix-ui/themes";
import { normalizeVerificationCode } from "nfx-ui/utils/domain/verificationCode";
import { unstable_OneTimePasswordField as OneTimePasswordField } from "radix-ui";

import styles from "./styles.module.css";

const DEFAULT_SLOT_COUNT = 6;

export type VerificationCodeOtpProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  slotCount?: number;
  name?: string;
  hiddenInputRef?: Ref<HTMLInputElement>;
  labelId?: string;
  errorId?: string;
  showError?: boolean;
  trailing?: ReactNode;
};

/** Radix OTP with lowercase-in / uppercase-out and backend alphabet filtering. */
export function VerificationCodeOtp({
  value,
  onChange,
  onBlur,
  disabled = false,
  slotCount = DEFAULT_SLOT_COUNT,
  name,
  hiddenInputRef,
  labelId,
  errorId,
  showError = false,
  trailing,
}: VerificationCodeOtpProps) {
  const normalizedProp = normalizeVerificationCode(value, slotCount);
  const [code, setCode] = useState(normalizedProp);

  useEffect(() => {
    setCode((prev) => {
      const next = normalizeVerificationCode(value, slotCount);
      return next === prev ? prev : next;
    });
  }, [value, slotCount]);

  const handleValueChange = (next: string) => {
    const normalized = normalizeVerificationCode(next, slotCount);
    setCode(normalized);
    onChange(normalized);
  };

  return (
    <OneTimePasswordField.Root value={code} onValueChange={handleValueChange} validationType="alphanumeric" disabled={disabled} name={name}>
      <Flex
        gap="2"
        width="100%"
        className={styles.otpRow}
        role="group"
        aria-labelledby={labelId}
        aria-invalid={showError ? true : undefined}
        aria-describedby={showError ? errorId : undefined}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Nullable<Node>)) {
            onBlur?.();
          }
        }}
      >
        {Array.from({ length: slotCount }, (_, index) => (
          <OneTimePasswordField.Input
            key={index}
            index={index}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            className={[styles.otpSlot, showError ? styles.otpSlotError : ""].filter(Boolean).join(" ")}
          />
        ))}
      </Flex>
      {hiddenInputRef ? <OneTimePasswordField.HiddenInput ref={hiddenInputRef} /> : null}
      {trailing}
    </OneTimePasswordField.Root>
  );
}

export default VerificationCodeOtp;
