import { memo } from "react";

import { InfoCard, ProfileCard, QuickActions } from "@/elements/profile";
import { useSelfProfile } from "@/hooks/useProfile";

import {
  useAccountInfo,
  useBasicInfo,
  useTimestamps,
} from "./hooks";
import { useQuickAction } from "./hooks/useQuickAction";
import styles from "./styles.module.css";

const ProfilePage = memo(() => {
  const actions = useQuickAction();

  return (
    <div className={styles.profilePage}>
      <div className={styles.container}>
        {/* Page Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>个人资料</h1>
          <p className={styles.subtitle}>管理您的个人信息和账户设置</p>
        </div>

        {/* Main Content */}
        <div className={styles.content}>
          {/* Left Column */}
          <div className={styles.leftColumn}>
            {/* ProfileCard 内部自己监听需要的字段 */}
            <SelfProfileCard />
            <QuickActions actions={actions} />
          </div>

          {/* Right Column - 每个包装组件只监听自己需要的字段 */}
          <div className={styles.rightColumn}>
            <BasicInfoCard />
            <AccountInfoCard />
            <TimestampsCard />
          </div>
        </div>
      </div>
    </div>
  );
});

ProfilePage.displayName = "ProfilePage";

export default ProfilePage;

// ===== 包装组件 - 每个只监听自己需要的字段 =====
const SelfProfileCard = memo(() => {
  const { data: profile, refetch } = useSelfProfile();

  const handleAvatarUpdated = () => {
    // 头像更新成功后，重新获取 profile 数据
    refetch();
  };

  const displayName = profile?.firstName && profile?.lastName
    ? `${profile.firstName} ${profile.lastName}`
    : profile?.firstName || profile?.email || "用户";

  return (
    <ProfileCard
      nickname={displayName}
      email={profile?.email || ""}
      role={profile?.role?.name || profile?.roleId || "未设置"}
      avatar={profile?.image || ""}
      posted={0}
      earned={0}
      sold={0}
      onAvatarUpdated={handleAvatarUpdated}
    />
  );
});
SelfProfileCard.displayName = "SelfProfileCard";

const BasicInfoCard = memo(() => {
  const items = useBasicInfo();
  return <InfoCard title="基本信息" items={items} />;
});
BasicInfoCard.displayName = "BasicInfoCard";

const AccountInfoCard = memo(() => {
  const items = useAccountInfo();
  return <InfoCard title="账户信息" items={items} />;
});
AccountInfoCard.displayName = "AccountInfoCard";

const TimestampsCard = memo(() => {
  const items = useTimestamps();
  return <InfoCard title="时间戳" items={items} />;
});
TimestampsCard.displayName = "TimestampsCard";
