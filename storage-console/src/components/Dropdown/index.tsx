import { memo, useEffect, useRef, useState } from "react";
import { ChevronDown } from "@/assets/icons/lucide";

import styles from "./Dropdown.module.css";

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

const Dropdown = memo<DropdownProps>(
  ({ options, value, onChange, placeholder = "Select an option", disabled = false, error = false, className = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // 点击外部关闭下拉菜单
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    const selectedOption = options.find((option) => option.value === value);
    const displayText = selectedOption ? selectedOption.label : placeholder;

    const handleOptionClick = (optionValue: string) => {
      onChange(optionValue);
      setIsOpen(false);
    };

    return (
      <div className={`${styles.dropdown} ${className}`} ref={dropdownRef}>
        <button
          type="button"
          className={`${styles.dropdownButton} ${error ? styles.error : ""} ${disabled ? styles.disabled : ""}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className={styles.buttonText}>{displayText}</span>
          <ChevronDown size={16} className={`${styles.chevronIcon} ${isOpen ? styles.open : ""}`} />
        </button>

        {isOpen && !disabled && (
          <div className={styles.dropdownMenu}>
            <ul className={styles.optionsList} role="listbox">
              {options.map((option) => (
                <li
                  key={option.value}
                  className={`${styles.option} ${option.value === value ? styles.selected : ""}`}
                  onClick={() => handleOptionClick(option.value)}
                  role="option"
                  aria-selected={option.value === value}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  },
);

Dropdown.displayName = "Dropdown";

export default Dropdown;
