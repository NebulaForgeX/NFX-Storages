import { memo } from "react";

import { useSelfProfile } from "@/hooks/useProfile";

import { AccountCancellationSection, EmailSection, PasswordSection, PhoneSection } from "./components";
import styles from "./styles.module.css";

const AccountSecurityPage = memo(() => {
  const { data: profile } = useSelfProfile();

  return (
    <div className={styles.securityPage}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>账户安全</h1>
          <p className={styles.subtitle}>管理您的账户安全设置</p>
        </div>

        <div className={styles.sections}>
          <div className={styles.category}>
            <h2 className={styles.categoryTitle}>安全设置</h2>
            <PhoneSection phone={profile?.phone} />
            <EmailSection email={profile?.email || undefined} />
            <PasswordSection />
          </div>

          <div className={styles.category}>
            <h2 className={styles.categoryTitle}>账户管理</h2>
            <AccountCancellationSection />
          </div>
        </div>
      </div>
    </div>
  );
});

AccountSecurityPage.displayName = "AccountSecurityPage";

export default AccountSecurityPage;
