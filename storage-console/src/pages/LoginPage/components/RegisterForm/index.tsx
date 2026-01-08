import { memo, useState } from "react";

import { useSignup, useSendVerificationCode } from "@/hooks/useAuth";
import { useResendTimer } from "@/hooks/useResendTimer";
import { showSuccess, showError } from "@/stores/modalStore";

import styles from "./styles.module.css";

const RegisterForm = memo(() => {
  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  const { mutateAsync: signup, isPending: isSigningUp } = useSignup();
  const { mutateAsync: sendCode, isPending: isSendingCode } = useSendVerificationCode();
  const { timeLeft, canResend, startTimer } = useResendTimer();

  const handleSendCode = async () => {
    if (!email || !canResend || isSendingCode) return;

    try {
      await sendCode({ email });
      startTimer(60); // 60秒倒计时
      showSuccess("验证码已发送到邮箱");
    } catch (error) {
      showError("发送验证码失败，请稍后重试");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await signup({
        email,
        inviteCode,
        password,
        verificationCode,
      });
      // 跳转由 App.tsx 中的事件监听器统一处理
    } catch (error) {
      showError("注册失败，请稍后重试");
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <span className={styles.title}>注册</span>

      {/* Email with Send Code button */}
      <div className={styles.formControl}>
        <input
          type="email"
          className={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          disabled={isSendingCode}
        />
        <label className={styles.label}>Email</label>
        <button
          type="button"
          className={styles.sendCodeBtn}
          onClick={handleSendCode}
          disabled={!email || !canResend || isSendingCode}
        >
          {canResend ? "获取验证码" : `${timeLeft}s`}
        </button>
      </div>

      {/* Verification Code (above License Code) */}
      <div className={styles.formControl}>
        <input
          type="text"
          className={styles.input}
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          autoComplete="one-time-code"
          required
          maxLength={6}
          placeholder="请输入6位验证码"
        />
        <label className={styles.label}>验证码</label>
      </div>

      {/* Invite Code */}
      <div className={styles.formControl}>
        <input
          type="text"
          className={styles.input}
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          autoComplete="off"
          required
        />
        <label className={styles.label}>邀请代码</label>
      </div>

      {/* Password */}
      <div className={styles.formControl}>
        <input
          type="password"
          className={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          minLength={6}
        />
        <label className={styles.label}>密码</label>
      </div>

      <button type="submit" className={styles.submitBtn} disabled={isSigningUp}>
        {isSigningUp ? "正在注册..." : "注册"}
      </button>

      <span className={styles.bottomText}>
        已有账号？{" "}
        <label htmlFor="register_toggle" className={styles.switch}>
          立即登录
        </label>
      </span>
    </form>
  );
});

RegisterForm.displayName = "RegisterForm";

export default RegisterForm;
