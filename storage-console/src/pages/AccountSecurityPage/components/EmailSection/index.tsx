import { memo, useState, useEffect } from "react";
import { Check, Mail, X } from "@/assets/icons/lucide";

import { Button } from "@/components";
import {
  useSendSetEmailOTP,
  useSendVerificationCodeToCurrentEmail,
  useVerifyAndSetEmail,
} from "@/hooks/useAuth";
import TimerStore from "@/stores/timerStore";

import styles from "./styles.module.css";

interface EmailSectionProps {
  email?: string;
}

// 三步流程的状态
type EmailUpdateStep = "edit" | "newEmail" | "verify";

const EmailSection = memo(({ email: currentEmail }: EmailSectionProps) => {
  const { mutateAsync: sendCodeToCurrentEmail, isPending: isSendingToCurrent } =
    useSendVerificationCodeToCurrentEmail();
  const { mutateAsync: sendCodeToNewEmail, isPending: isSendingToNew } = useSendSetEmailOTP();
  const { mutateAsync: updateEmail, isPending: isUpdating } = useVerifyAndSetEmail();

  // 使用 timerStore 的倒计时器
  const [currentEmailTimeLeft, setCurrentEmailTimeLeft] = useState(0);
  const [newEmailTimeLeft, setNewEmailTimeLeft] = useState(0);
  const [canResendCurrent, setCanResendCurrent] = useState(true);
  const [canResendNew, setCanResendNew] = useState(true);

  // 实时更新倒计时显示
  useEffect(() => {
    const updateTimers = () => {
      const store = TimerStore.getState();
      setCurrentEmailTimeLeft(store.getEmailUpdateCurrentTimeLeft());
      setNewEmailTimeLeft(store.getEmailUpdateNewTimeLeft());
      setCanResendCurrent(store.canResendEmailUpdateCurrent());
      setCanResendNew(store.canResendEmailUpdateNew());
    };

    updateTimers();
    const timer = setInterval(updateTimers, 1000);

    // 订阅 store 变化
    const unsubscribe = TimerStore.subscribe(() => {
      updateTimers();
    });

    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }, []);

  const [step, setStep] = useState<EmailUpdateStep>("edit");
  const [newEmail, setNewEmail] = useState("");
  const [oldEmailCode, setOldEmailCode] = useState("");
  const [newEmailCode, setNewEmailCode] = useState("");

  const handleEdit = async () => {
    // 如果正在倒计时，不允许再次发送
    if (!canResendCurrent || isSendingToCurrent) return;
    try {
      // 第一步：发送验证码到当前邮箱
      await sendCodeToCurrentEmail();
      TimerStore.getState().setEmailUpdateCurrentExpiry(Date.now() + 60 * 1000);
      setStep("newEmail");
    } catch (error) {
      console.error("Failed to send code to current email:", error);
      setStep("edit"); // 如果发送失败，回到初始状态
    }
  };

  const handleCancel = () => {
    setStep("edit");
    setNewEmail("");
    setOldEmailCode("");
    setNewEmailCode("");
  };

  const handleSendCodeToNewEmail = async () => {
    if (!canResendNew || isSendingToNew) return;
    const trimmedEmail = newEmail.trim();
    if (!trimmedEmail) return;
    try {
      // 第二步：发送验证码到新邮箱
      await sendCodeToNewEmail({ email: trimmedEmail });
      TimerStore.getState().setEmailUpdateNewExpiry(Date.now() + 60 * 1000);
      setStep("verify");
    } catch (error) {
      console.error("Send code to new email failed:", error);
    }
  };

  const handleSave = async () => {
    if (!oldEmailCode.trim() || !newEmailCode.trim() || !newEmail.trim()) return;
    try {
      // 第三步：提交两个验证码和新邮箱
      await updateEmail({
        oldEmailCode: oldEmailCode.trim(),
        newEmail: newEmail.trim(),
        newEmailCode: newEmailCode.trim(),
      });
      handleCancel();
    } catch (error) {
      console.error("Failed to update email:", error);
    }
  };

  const isEditing = step !== "edit";

  return (
    <div className={styles.section}>
      <Button
        className={styles.sectionHeader}
        onClick={!isEditing ? handleEdit : undefined}
        type="button"
        variant="secondary"
        disabled={!isEditing && (!canResendCurrent || isSendingToCurrent)}
      >
        <div className={styles.leftContent}>
          <Mail size={20} className={styles.icon} />
          <span className={styles.label}>邮箱</span>
        </div>
        <span className={styles.value}>{currentEmail || "未设置"}</span>
      </Button>

      {step === "newEmail" && (
        <div className={styles.editForm}>
          <div className={styles.stepIndicator}>
            <span>步骤 1/2: 请输入新邮箱</span>
            <p className={styles.hint}>
              验证码已发送到当前邮箱：{currentEmail}
              {!canResendCurrent && (
                <span className={styles.timer}> ({currentEmailTimeLeft}秒后可重发)</span>
              )}
            </p>
          </div>
          <input
            type="email"
            className={styles.input}
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="请输入新邮箱"
            autoFocus
          />

          <div className={styles.actions}>
            <Button
              className={styles.cancelBtn}
              onClick={handleCancel}
              type="button"
              disabled={isSendingToNew}
              variant="secondary"
            >
              <X size={18} />
              取消
            </Button>
            <Button
              className={styles.saveBtn}
              onClick={handleSendCodeToNewEmail}
              type="button"
              disabled={!canResendNew || !newEmail.trim()}
            >
              <Check size={18} />
              {canResendNew
                ? isSendingToNew
                  ? "发送中..."
                  : "发送验证码到新邮箱"
                : `${newEmailTimeLeft}秒`}
            </Button>
          </div>
        </div>
      )}

      {step === "verify" && (
        <div className={styles.editForm}>
          <div className={styles.stepIndicator}>
            <span>步骤 2/2: 请输入两个验证码</span>
            <p className={styles.hint}>
              当前邮箱验证码：{currentEmail}
              {!canResendCurrent && (
                <span className={styles.timer}> ({currentEmailTimeLeft}秒后可重发)</span>
              )}
            </p>
            <p className={styles.hint}>
              新邮箱验证码：{newEmail}
              {!canResendNew && (
                <span className={styles.timer}> ({newEmailTimeLeft}秒后可重发)</span>
              )}
            </p>
          </div>
          <input
            type="text"
            className={styles.input}
            value={oldEmailCode}
            onChange={(e) => setOldEmailCode(e.target.value)}
            placeholder="请输入当前邮箱验证码"
            autoFocus
            maxLength={6}
          />
          <input
            type="text"
            className={styles.input}
            value={newEmailCode}
            onChange={(e) => setNewEmailCode(e.target.value)}
            placeholder="请输入新邮箱验证码"
            maxLength={6}
          />

          <div className={styles.actions}>
            <Button
              className={styles.cancelBtn}
              onClick={handleCancel}
              type="button"
              disabled={isUpdating}
              variant="secondary"
            >
              <X size={18} />
              取消
            </Button>
            <Button
              className={styles.saveBtn}
              onClick={handleSave}
              type="button"
              disabled={isUpdating || !oldEmailCode.trim() || !newEmailCode.trim()}
            >
              <Check size={18} />
              {isUpdating ? "保存中..." : "验证并保存"}
            </Button>
          </div>

          <div className={styles.resendSection}>
            <Button
              className={styles.resendBtn}
              onClick={async () => {
                if (!canResendCurrent || isSendingToCurrent) return;
                try {
                  await sendCodeToCurrentEmail();
                  TimerStore.getState().setEmailUpdateCurrentExpiry(Date.now() + 60 * 1000);
                } catch (error) {
                  console.error("Failed to resend code to current email:", error);
                }
              }}
              type="button"
              disabled={!canResendCurrent || isSendingToCurrent}
              variant="secondary"
            >
              {canResendCurrent ? "重新发送验证码到当前邮箱" : `当前邮箱：${currentEmailTimeLeft}秒后可重发`}
            </Button>
            <Button
              className={styles.resendBtn}
              onClick={async () => {
                if (!canResendNew || isSendingToNew) return;
                try {
                  await sendCodeToNewEmail({ email: newEmail });
                  TimerStore.getState().setEmailUpdateNewExpiry(Date.now() + 60 * 1000);
                } catch (error) {
                  console.error("Failed to resend code to new email:", error);
                }
              }}
              type="button"
              disabled={!canResendNew || isSendingToNew}
              variant="secondary"
            >
              {canResendNew ? "重新发送验证码到新邮箱" : `新邮箱：${newEmailTimeLeft}秒后可重发`}
            </Button>
          </div>
        </div>
      )}

      {step === "edit" && isSendingToCurrent && (
        <div className={styles.editForm}>
          <p className={styles.loadingText}>正在发送验证码到当前邮箱...</p>
        </div>
      )}
    </div>
  );
});

EmailSection.displayName = "EmailSection";

export default EmailSection;
