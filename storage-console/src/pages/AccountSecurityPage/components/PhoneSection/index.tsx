import { memo, useState } from "react";
import { Check, Phone, X } from "@/assets/icons/lucide";

import { Button } from "@/components";
import { useVerifyAndSetPhone } from "@/hooks/useAuth";

import styles from "./styles.module.css";

interface PhoneSectionProps {
  phone?: string;
}

const PhoneSection = memo(({ phone: currentPhone }: PhoneSectionProps) => {
  const { mutateAsync: verifyAndSetPhone, isPending } = useVerifyAndSetPhone();

  const [isEditing, setIsEditing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleEdit = () => {
    setPhoneNumber(currentPhone || "");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setPhoneNumber("");
  };

  const handleSave = async () => {
    const trimmedPhone = phoneNumber.trim();
    if (!trimmedPhone) return;
    try {
      // 手机号不需要验证码，直接更新
      await verifyAndSetPhone({ phone: trimmedPhone, otp: "" });
      setIsEditing(false);
      setPhoneNumber("");
    } catch (error) {
      console.error("Failed to update phone:", error);
    }
  };

  return (
    <div className={styles.section}>
      <Button
        className={styles.sectionHeader}
        onClick={!isEditing ? handleEdit : undefined}
        type="button"
        variant="secondary"
      >
        <div className={styles.leftContent}>
          <Phone size={20} className={styles.icon} />
          <span className={styles.label}>手机号</span>
        </div>
        <span className={styles.value}>{currentPhone || "未设置"}</span>
      </Button>

      {isEditing && (
        <div className={styles.editForm}>
          <input
            type="tel"
            className={styles.input}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="请输入手机号"
            autoFocus
          />

          <div className={styles.actions}>
            <Button
              className={styles.cancelBtn}
              onClick={handleCancel}
              type="button"
              disabled={isPending}
              variant="secondary"
            >
              <X size={18} />
              取消
            </Button>
            <Button
              className={styles.saveBtn}
              onClick={handleSave}
              type="button"
              disabled={isPending || !phoneNumber.trim()}
            >
              <Check size={18} />
              {isPending ? "保存中..." : "保存"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

PhoneSection.displayName = "PhoneSection";

export default PhoneSection;
