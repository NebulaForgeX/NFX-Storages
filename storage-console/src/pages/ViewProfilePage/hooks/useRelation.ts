// TODO: 社交功能（关注/拉黑）在新后端中可能未实现
// 暂时提供一个 stub 实现以避免编译错误

export const useRelation = (_userId: string) => {
  return {
    isFollowing: false,
    isFollowed: false,
    isBlocked: false,
    isBlocking: false,
    isFriend: false,
    isLoading: false,
    error: null,
    refetch: () => {},
    getStatusText: "Unknown",
    getStatusColor: "#6B7280",
    handleFollow: () => {
      console.log("Follow functionality not implemented");
    },
    handleUnfollow: () => {
      console.log("Unfollow functionality not implemented");
    },
    handleBlock: () => {
      console.log("Block functionality not implemented");
    },
    handleUnblock: () => {
      console.log("Unblock functionality not implemented");
    },
    handleChat: () => {
      console.log("Chat functionality not implemented");
    },
    isFollowPending: false,
    isUnfollowPending: false,
    isBlockPending: false,
    isUnblockPending: false,
  };
};
