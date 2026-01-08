import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Camera, User } from "@/assets/icons/lucide";

import { compressAvatarImage } from "@/services";
import { useUpdateProfileAvatar } from "@/hooks/useProfile";
import { showError, showSuccess } from "@/stores/modalStore";
import { buildImageUrl } from "@/utils/image";

import styles from "./styles.module.css";

type ProfileCardProps = {
  nickname: string;
  email: string;
  role: string;
  avatar: string;
  posted: number;
  earned: number;
  sold: number;
  onAvatarUpdated?: () => void;
};

const ProfileCard = memo(
  ({ nickname, email, role, avatar, posted, earned, sold, onAvatarUpdated }: ProfileCardProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [previewAvatar, setPreviewAvatar] = useState<string>(avatar);
    const { mutateAsync: updateProfileAvatar } = useUpdateProfileAvatar();

    // 同步 avatar prop 到本地状态，并构建完整 URL
    useEffect(() => {
      // 如果 avatar 是 blob URL（本地预览），直接使用
      // 否则构建完整 URL
      if (avatar && (avatar.startsWith("blob:") || avatar.startsWith("http://") || avatar.startsWith("https://"))) {
        setPreviewAvatar(avatar);
      } else {
        setPreviewAvatar(buildImageUrl(avatar));
      }
    }, [avatar]);

    const handleAvatarClick = useCallback(() => {
      if (!isUploading) fileInputRef.current?.click();
    }, [isUploading]);
    const handleFileChange = useCallback(
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // 验证文件类型
        if (!file.type.startsWith("image/")) {
          showError("Please select an image file", "Invalid File Type");
          return;
        }

        let localPreview: string | null = null;
        try {
          setIsUploading(true);
          // 立即显示本地预览
          localPreview = URL.createObjectURL(file);
          setPreviewAvatar(localPreview);
          
          // 压缩头像
          const compressedFile = await compressAvatarImage(file);
          
          // 直接上传头像（使用 FormData）
          await updateProfileAvatar(compressedFile);
          
          // 通知父组件刷新数据
          onAvatarUpdated?.();
          
          // 显示成功消息
          showSuccess("Avatar updated successfully!");
        } catch (error) {
          console.error("Failed to update avatar:", error);
          showError("Failed to update avatar. Please try again.", "Upload Failed");
          // 恢复原头像
          setPreviewAvatar(avatar);
        } finally {
          setIsUploading(false);
          // 清理本地预览
          if (localPreview) URL.revokeObjectURL(localPreview);
          // 重置input
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      },
      [avatar, onAvatarUpdated, updateProfileAvatar],
    );

    return (
      <div className={styles.profileCard}>
        <div className={styles.avatarSection}>
          <div
            className={`${styles.avatar} ${!isUploading ? styles.avatarClickable : ""}`}
            onClick={handleAvatarClick}
            title={isUploading ? "Uploading..." : "Click to update avatar"}
          >
            {previewAvatar ? (
              <img src={previewAvatar} alt={nickname || "User"} className={styles.avatarImage} />
            ) : (
              <User size={48} />
            )}
            {!isUploading && (
              <div className={styles.avatarOverlay}>
                <Camera size={24} />
              </div>
            )}
            {isUploading && (
              <div className={styles.avatarLoading}>
                <div className={styles.spinner} />
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className={styles.fileInput}
          />
          <div className={styles.userInfo}>
            <h2 className={styles.userName}>{nickname || "Not set"}</h2>
            <p className={styles.userEmail}>{email || "Not set"}</p>
            <span className={styles.userRole}>{role || "guest"}</span>
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{posted || 0}</span>
            <span className={styles.statLabel}>Posted</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{earned ? `${(earned / 1000).toFixed(1)}K` : "0"}</span>
            <span className={styles.statLabel}>Earned</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{sold || 0}</span>
            <span className={styles.statLabel}>Sold</span>
          </div>
        </div>
      </div>
    );
  },
);

ProfileCard.displayName = "ProfileCard";

export default ProfileCard;
