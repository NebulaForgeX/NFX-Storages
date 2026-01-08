import { memo } from "react";
import { Ban, MessageCircle, UserCheck, UserPlus, X } from "@/assets/icons/lucide";

import { showInfo } from "@/stores/modalStore";

import { useRelation } from "../../hooks";
import styles from "./styles.module.css";

interface ProfileActionsProps {
  userId: string;
}

const ProfileActions = memo(({ userId }: ProfileActionsProps) => {
  const {
    isFollowing,
    isBlocked,
    isBlocking,
    isFriend,
    isLoading,
    getStatusText,
    getStatusColor,
    handleFollow,
    handleUnfollow,
    handleBlock,
    handleUnblock,
    isFollowPending,
    isUnfollowPending,
    isBlockPending,
    isUnblockPending,
  } = useRelation(userId);

  // 处理聊天操作
  const handleChat = () => {
    showInfo("Chat functionality is not implemented yet.");
  };

  // 处理举报操作
  const handleReport = () => {
    // TODO: 实现举报功能（需要后端支持）
    showInfo("Report functionality is not implemented yet.");
  };

  // 获取主要操作按钮
  const getPrimaryAction = () => {
    if (isLoading) {
      return {
        icon: <div className={styles.loadingSpinner} />,
        text: "Loading...",
        onClick: () => {},
        disabled: true,
        className: styles.loadingButton,
      };
    }

    if (isBlocked) {
      return {
        icon: <UserCheck size={18} />,
        text: "Unblock",
        onClick: handleUnblock,
        disabled: isUnblockPending,
        className: styles.unblockButton,
      };
    }

    if (isBlocking) {
      return {
        icon: <UserCheck size={18} />,
        text: "Unblock",
        onClick: handleUnblock,
        disabled: isUnblockPending,
        className: styles.unblockButton,
      };
    }

    if (isFriend || isFollowing) {
      return {
        icon: <UserCheck size={18} />,
        text: "Unfollow",
        onClick: handleUnfollow,
        disabled: isUnfollowPending,
        className: styles.unfollowButton,
      };
    }

    return {
      icon: <UserPlus size={18} />,
      text: "Follow",
      onClick: handleFollow,
      disabled: isFollowPending,
      className: styles.followButton,
    };
  };

  const primaryAction = getPrimaryAction();

  return (
    <div className={styles.actionsCard}>
      {/* 关系状态显示 */}
      <div className={styles.statusSection}>
        <div className={styles.statusBadge} style={{ backgroundColor: getStatusColor }}>
          <span className={styles.statusText}>{getStatusText}</span>
        </div>
      </div>

      {/* 四个操作按钮 */}
      <div className={styles.actionsGrid}>
        {/* 主要操作按钮 */}
        <button
          className={`${styles.actionButton} ${primaryAction.className}`}
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
        >
          {primaryAction.icon}
          <span>{primaryAction.text}</span>
        </button>

        {/* 拉黑/取消拉黑按钮 */}
        {!isBlocked && !isBlocking && (
          <button
            className={`${styles.actionButton} ${styles.blockButton}`}
            onClick={handleBlock}
            disabled={isBlockPending}
          >
            <X size={18} />
            <span>Block</span>
          </button>
        )}

        {/* 聊天按钮 */}
        {!isBlocking && !isBlocked && (
          <button className={`${styles.actionButton} ${styles.chatButton}`} onClick={handleChat}>
            <MessageCircle size={18} />
            <span>Chat</span>
          </button>
        )}

        {/* 举报按钮 */}
        {!isBlocking && !isBlocked && (
          <button className={`${styles.actionButton} ${styles.reportButton}`} onClick={handleReport}>
            <Ban size={18} />
            <span>Report</span>
          </button>
        )}
      </div>
    </div>
  );
});

ProfileActions.displayName = "ProfileActions";

export default ProfileActions;
