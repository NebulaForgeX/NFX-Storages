import type { ButtonHTMLAttributes } from "react";

import React, { memo } from "react";

import styles from "./styles.module.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
}

const Button = memo<ButtonProps>(
  ({ children, onClick, variant = "primary", type = "button", disabled = false, className = "", ...restProps }) => {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`${styles.button} ${styles[variant]} ${disabled ? styles.disabled : ""} ${className}`}
        {...restProps}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
export default Button;
