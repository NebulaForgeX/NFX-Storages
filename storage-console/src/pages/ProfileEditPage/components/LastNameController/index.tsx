import type { ProfileFormData } from "../../controllers/profileSchema";

import { memo } from "react";
import { useFormContext } from "react-hook-form";

import styles from "./styles.module.css";

const LastNameController = memo(() => {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext<ProfileFormData>();

  const lastName = watch("lastName");

  return (
    <div className={styles.formGroup}>
      <label htmlFor="lastName" className={styles.label}>
        Last Name <span className={styles.required}>*</span>
      </label>
      <input
        id="lastName"
        type="text"
        {...register("lastName")}
        placeholder="Enter your last name"
        className={`${styles.input} ${errors.lastName ? styles.inputError : ""}`}
        maxLength={50}
      />
      {errors.lastName && <span className={styles.error}>{errors.lastName.message}</span>}
      <span className={styles.hint}>{lastName?.length || 0}/50 characters</span>
    </div>
  );
});

LastNameController.displayName = "LastNameController";

export default LastNameController;

