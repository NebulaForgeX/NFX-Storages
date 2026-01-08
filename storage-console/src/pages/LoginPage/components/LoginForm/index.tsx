import { memo, useState } from "react";

import { useLoginByEmail, useLoginByPhone } from "@/hooks/useAuth";
import { showError } from "@/stores/modalStore";

import styles from "./styles.module.css";

const LoginForm = memo(() => {
  const [loginType, setLoginType] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const { mutateAsync: loginByEmail, isPending: isEmailLoginPending } = useLoginByEmail();
  const { mutateAsync: loginByPhone, isPending: isPhoneLoginPending } = useLoginByPhone();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (loginType === "email") {
        await loginByEmail({ email, password });
      } else {
        await loginByPhone({ phone, password });
      }
      // 跳转由 App.tsx 中的事件监听器统一处理
    } catch (error) {
      showError("登录失败，请稍后重试");
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <span className={styles.title}>登录</span>

      {/* Login Type Toggle */}
      <div className={styles.loginTypeSwitch}>
        <button
          type="button"
          className={`${styles.loginTypeBtn} ${loginType === "email" ? styles.active : ""}`}
          onClick={() => setLoginType("email")}
        >
          邮箱
        </button>
        <button
          type="button"
          className={`${styles.loginTypeBtn} ${loginType === "phone" ? styles.active : ""}`}
          onClick={() => setLoginType("phone")}
        >
          手机
        </button>
      </div>

      {/* Email or Phone */}
      {loginType === "email" ? (
        <div className={styles.formControl}>
          <input
            type="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <label className={styles.label}>邮箱</label>
        </div>
      ) : (
        <div className={styles.formControl}>
          <input
            type="tel"
            className={styles.input}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            required
          />
          <label className={styles.label}>手机号</label>
        </div>
      )}

      {/* Password */}
      <div className={styles.formControl}>
        <input
          type="password"
          className={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <label className={styles.label}>密码</label>
      </div>

      <button
        type="submit"
        className={styles.submitBtn}
        disabled={isEmailLoginPending || isPhoneLoginPending}
      >
        {isEmailLoginPending || isPhoneLoginPending ? "正在登录..." : "登录"}
      </button>

      <span className={styles.bottomText}>
        没有账号？{" "}
        <label htmlFor="register_toggle" className={styles.switch}>
          立即注册
        </label>
      </span>
    </form>
  );
});

LoginForm.displayName = "LoginForm";

export default LoginForm;
