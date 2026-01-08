import { memo } from "react";
import { UserX } from "@/assets/icons/lucide";

import { Button } from "@/components";

import styles from "./styles.module.css";

const AccountCancellationSection = memo(() => {
  const handleCancel = () => {
      if (window.confirm("确定要注销账户吗？此操作无法撤销。")) {
        console.log("Account cancellation confirmed");
        // TODO: Call account cancellation API
      }
  };

  return (
    <div className={styles.section}>
      <Button className={styles.sectionHeader} onClick={handleCancel} type="button" variant="secondary">
        <div className={styles.leftContent}>
          <UserX size={20} className={styles.icon} />
          <span className={styles.label}>账户注销</span>
        </div>
      </Button>
    </div>
  );
});

AccountCancellationSection.displayName = "AccountCancellationSection";

export default AccountCancellationSection;
