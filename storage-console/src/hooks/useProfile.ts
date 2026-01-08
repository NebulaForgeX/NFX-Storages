import type { User } from "@/apis/domain";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { GetProfile, UpdateProfileBasic, UpdateProfileAvatar } from "@/apis/auth.api";
import { useAuthStore } from "@/stores/authStore";

// Query keys
export const profileKeys = {
  byId: (userId: string) => ["profile", userId] as const,
  self: ["profile", "self"] as const,
};

// Fetch self profile (当前登录用户)
export const useSelfProfile = () => {
  const isAuthValid = useAuthStore((state) => state.isAuthValid);
  const currentUserId = useAuthStore((state) => state.currentUserId);

  return useQuery({
    queryKey: currentUserId ? profileKeys.byId(currentUserId) : profileKeys.self,
    queryFn: () => {
      if (!currentUserId) throw new Error("User ID is required");
      return GetProfile(currentUserId);
    },
    enabled: isAuthValid && !!currentUserId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
};

// Fetch profile by user ID
export const useProfileByUserId = (userId: string | null) => {
  const isAuthValid = useAuthStore((state) => state.isAuthValid);

  return useQuery({
    queryKey: userId ? profileKeys.byId(userId) : ["profile", "null"],
    queryFn: () => {
      if (!userId) throw new Error("User ID is required");
      return GetProfile(userId);
    },
    enabled: isAuthValid && !!userId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
};

// 更新用户基本信息（firstName, lastName, phone, roleId）
export const useUpdateProfileBasic = () => {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.currentUserId);

  return useMutation({
    mutationFn: async (data: Partial<User>) => {
      if (!currentUserId) throw new Error("User ID is required");
      return await UpdateProfileBasic(currentUserId, data);
    },
    onSuccess: (updatedProfile: User) => {
      // Update cache optimistically
      if (currentUserId) {
        queryClient.setQueryData<User>(profileKeys.byId(currentUserId), updatedProfile);
        queryClient.setQueryData<User>(profileKeys.self, updatedProfile);
      }
    },
  });
};

// 更新用户头像
export const useUpdateProfileAvatar = () => {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.currentUserId);

  return useMutation({
    mutationFn: async (avatarFile: File) => {
      if (!currentUserId) throw new Error("User ID is required");
      return await UpdateProfileAvatar(currentUserId, avatarFile);
    },
    onSuccess: (updatedProfile: User) => {
      // Update cache optimistically
      if (currentUserId) {
        queryClient.setQueryData<User>(profileKeys.byId(currentUserId), updatedProfile);
        queryClient.setQueryData<User>(profileKeys.self, updatedProfile);
      }
    },
  });
};

