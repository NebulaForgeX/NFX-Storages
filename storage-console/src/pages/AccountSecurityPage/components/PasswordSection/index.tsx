import { memo, useState, useEffect } from "react";
import { Check, Eye, EyeOff, LockKeyhole, X } from "@/assets/icons/lucide";

import { Button } from "@/components";
import { useSetPassword, useSendVerificationCodeToCurrentEmail } from "@/hooks/useAuth";
import { useSelfProfile } from "@/hooks/useProfile";
import TimerStore from "@/stores/timerStore";

import styles from "./styles.module.css";

type PasswordUpdateStep = "edit" | "password" | "verify";

const PasswordSection = memo(() => {
  const { data: profile } = useSelfProfile();
  const { mutateAsync: setPassword, isPending: isUpdating } = useSetPassword();
  const { mutateAsync: sendCodeToCurrentEmail, isPending: isSendingCode } =
    useSendVerificationCodeToCurrentEmail();

  // 使用 timerStore 的倒计时器
  const [timeLeft, setTimeLeft] = useState(0);
  const [canResend, setCanResend] = useState(true);

  // 实时更新倒计时显示
  useEffect(() => {
    const updateTimer = () => {
      const store = TimerStore.getState();
      setTimeLeft(store.getPasswordUpdateTimeLeft());
      setCanResend(store.canResendPasswordUpdate());
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    // 订阅 store 变化
    const unsubscribe = TimerStore.subscribe(() => {
      updateTimer();
    });

    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }, []);

  const [step, setStep] = useState<PasswordUpdateStep>("edit");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleEdit = async () => {
    // 如果正在倒计时或发送中，不允许再次发送
    if (!canResend || isSendingCode) return;
    try {
      // 第一步：发送验证码到当前邮箱
      await sendCodeToCurrentEmail();
      TimerStore.getState().setPasswordUpdateExpiry(Date.now() + 60 * 1000);
      setStep("password");
    } catch (error) {
      console.error("Failed to send code to current email:", error);
    }
  };

  const handleCancel = () => {
    setStep("edit");
    setNewPassword("");
    setConfirmPassword("");
    setVerificationCode("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleNext = () => {
    if (!newPassword.trim() || newPassword !== confirmPassword) {
      console.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      console.error("Password must be at least 6 characters");
      return;
    }
    setStep("verify");
  };

  const handleSave = async () => {
    if (!newPassword.trim() || newPassword !== confirmPassword) {
      console.error("Passwords do not match");
      return;
    }
    if (!verificationCode.trim()) {
      console.error("Verification code is required");
      return;
    }
    try {
      await setPassword({ password: newPassword, verificationCode: verificationCode.trim() });
      handleCancel(); // handleCancel 已经会重置所有状态包括显示状态
    } catch (error) {
      console.error("Failed to update password:", error);
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
        disabled={!isEditing && (!canResend || isSendingCode)}
      >
        <div className={styles.leftContent}>
          <LockKeyhole size={20} className={styles.icon} />
          <span className={styles.label}>密码</span>
        </div>
        <span className={styles.value}>已设置</span>
      </Button>

      {step === "password" && (
        <div className={styles.editForm}>
          <div className={styles.stepIndicator}>
            <span>步骤 1/2: 请输入新密码</span>
            <p className={styles.hint}>
              验证码已发送到当前邮箱：{profile?.email}
              {!canResend && <span className={styles.timer}> ({timeLeft}秒后可重发)</span>}
            </p>
          </div>
          <div className={styles.passwordWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              className={styles.input}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="请输入新密码"
              autoFocus
              minLength={6}
            />
            <button
              type="button"
              className={styles.toggleButton}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "隐藏密码" : "显示密码"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className={styles.passwordWrapper}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              className={styles.input}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="请确认新密码"
              minLength={6}
            />
            <button
              type="button"
              className={styles.toggleButton}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "隐藏密码" : "显示密码"}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
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
              onClick={handleNext}
              type="button"
              disabled={!newPassword.trim() || newPassword !== confirmPassword || newPassword.length < 6}
            >
              <Check size={18} />
              下一步
            </Button>
          </div>
        </div>
      )}

      {step === "verify" && (
        <div className={styles.editForm}>
          <div className={styles.stepIndicator}>
            <span>步骤 2/2: 请输入验证码</span>
            <p className={styles.hint}>
              验证码已发送到当前邮箱：{profile?.email}
              {!canResend && <span className={styles.timer}> ({timeLeft}秒后可重发)</span>}
            </p>
          </div>
          <input
            type="text"
            className={styles.input}
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="请输入邮箱验证码"
            autoFocus
            maxLength={6}
          />
          <div className={styles.actions}>
            <Button
              className={styles.cancelBtn}
              onClick={() => setStep("password")}
              type="button"
              disabled={isUpdating}
              variant="secondary"
            >
              <X size={18} />
              上一步
            </Button>
            <Button
              className={styles.saveBtn}
              onClick={handleSave}
              type="button"
              disabled={isUpdating || !verificationCode.trim()}
            >
              <Check size={18} />
              {isUpdating ? "保存中..." : "验证并保存"}
            </Button>
          </div>
          <Button
            className={styles.resendBtn}
            onClick={async () => {
              if (!canResend || isSendingCode) return;
              try {
                await sendCodeToCurrentEmail();
                TimerStore.getState().setPasswordUpdateExpiry(Date.now() + 60 * 1000);
              } catch (error) {
                console.error("Failed to resend code:", error);
              }
            }}
            type="button"
            disabled={!canResend || isSendingCode}
            variant="secondary"
          >
            {canResend
              ? isSendingCode
                ? "发送中..."
                : "重新发送验证码"
              : `${timeLeft}秒后可重发`}
          </Button>
        </div>
      )}

      {step === "edit" && isSendingCode && (
        <div className={styles.editForm}>
          <p className={styles.loadingText}>正在发送验证码到当前邮箱...</p>
        </div>
      )}
    </div>
  );
});

PasswordSection.displayName = "PasswordSection";

export default PasswordSection;
