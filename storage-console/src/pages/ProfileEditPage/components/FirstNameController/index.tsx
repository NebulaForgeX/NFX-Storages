import type { ProfileFormData } from "../../controllers/profileSchema";

import { memo } from "react";
import { useFormContext } from "react-hook-form";

import styles from "./styles.module.css";

const FirstNameController = memo(() => {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext<ProfileFormData>();

  const firstName = watch("firstName");

  return (
    <div className={styles.formGroup}>
      <label htmlFor="firstName" className={styles.label}>
        First Name <span className={styles.required}>*</span>
      </label>
      <input
        id="firstName"
        type="text"
        {...register("firstName")}
        placeholder="Enter your first name"
        className={`${styles.input} ${errors.firstName ? styles.inputError : ""}`}
        maxLength={50}
      />
      {errors.firstName && <span className={styles.error}>{errors.firstName.message}</span>}
      <span className={styles.hint}>{firstName?.length || 0}/50 characters</span>
    </div>
  );
});

FirstNameController.displayName = "FirstNameController";

export default FirstNameController;

