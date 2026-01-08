import { memo } from "react";

import styles from "./styles.module.css";

interface FooterProps {
  className?: string;
}

const Footer = memo(({ className }: FooterProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`${styles.footer} ${className || ""}`}>
      <div className={styles.footerContent}>
        <span className={styles.copyright}>© {currentYear} 双江古寨茶业管理系统. 保留所有权利.</span>
        <div className={styles.links}>
          <a href="#" className={styles.link}>
            关于我们
          </a>
          <a href="#" className={styles.link}>
            隐私政策
          </a>
          <a href="#" className={styles.link}>
            使用条款
          </a>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

export default Footer;
