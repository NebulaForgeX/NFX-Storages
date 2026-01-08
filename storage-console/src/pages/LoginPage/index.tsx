import { useState } from "react";

import { TruckLoading } from "@/components";

import { LoginForm, RegisterForm } from "./components";
import styles from "./styles.module.css";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const isLoading = false;

  if (isLoading) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loadingContainer}>
          <TruckLoading size="medium" />
          <p className={styles.loadingText}>正在登录...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.loginPage}>
      <div className={styles.container}>
        <input
          type="checkbox"
          id="register_toggle"
          checked={isRegister}
          onChange={(e) => setIsRegister(e.target.checked)}
          className={styles.registerToggle}
        />
        <div className={styles.slider}>
          <LoginForm />
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
