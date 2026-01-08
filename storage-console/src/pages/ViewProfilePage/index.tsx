import { memo } from "react";
import { ArrowLeft } from "@/assets/icons/lucide";
import { useNavigate, useParams } from "react-router-dom";

import { ECGLoading } from "@/components";
import { InfoCard, ProfileCard } from "@/elements/profile";
import { useProfileByUserId } from "@/hooks/useProfile";

import { ProfileActions } from "./components";
import { useProfileInfo } from "./hooks/useProfileInfo";
import styles from "./styles.module.css";

const ViewProfilePage = memo(() => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { data: profile, isLoading, error } = useProfileByUserId(userId || null);

  const { basicInfo, accountInfo } = useProfileInfo(profile);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingContainer}>
          <ECGLoading size="medium" />
          <p className={styles.loadingText}>加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={styles.page}>
        <div className={styles.errorContainer}>
          <h2>用户未找到</h2>
          <p>您查找的用户不存在或已被删除。</p>
          <button onClick={() => navigate(-1)} className={styles.backButton}>
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header with back button */}
        <div className={styles.header}>
          <button onClick={() => navigate(-1)} className={styles.backBtn}>
            <ArrowLeft size={20} />
          <span>返回</span>
        </button>
          <h1 className={styles.title}>用户资料</h1>
        </div>

        {/* Profile Card */}
        <ProfileCard
          nickname={
            profile.firstName && profile.lastName
              ? `${profile.firstName} ${profile.lastName}`
              : profile.firstName || profile.email || "用户"
          }
          email={profile.email || "未设置"}
          role={profile.role?.name || profile.roleId || "未设置"}
          avatar={profile.image || ""}
          posted={0}
          earned={0}
          sold={0}
        />

        {/* Profile Actions */}
        <ProfileActions userId={userId || ""} />

        {/* Basic Info */}
        <InfoCard title="基本信息" items={basicInfo} />

        {/* Account Info */}
        <InfoCard title="账户信息" items={accountInfo} />
      </div>
    </div>
  );
});

ViewProfilePage.displayName = "ViewProfilePage";

export default ViewProfilePage;
