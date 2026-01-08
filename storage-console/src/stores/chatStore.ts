import { create, useStore } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";

interface ChatState {
  unreadCount: number;
  totalMessages: number;
  isLoading: boolean;
}

interface ChatActions {
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  clearUnreadCount: () => void;
  setTotalMessages: (count: number) => void;
  setLoading: (loading: boolean) => void;
  getUnreadCount: () => number;
}

// 默认假数据
const defaultState: ChatState = {
  unreadCount: 3,
  totalMessages: 127,
  isLoading: false,
};

export const ChatStore = create<ChatState & ChatActions>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ...defaultState,

        setUnreadCount: (count) => set({ unreadCount: count }),

        incrementUnreadCount: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),

        clearUnreadCount: () => set({ unreadCount: 0 }),

        setTotalMessages: (count) => set({ totalMessages: count }),

        setLoading: (loading) => set({ isLoading: loading }),

        getUnreadCount: () => get().unreadCount,
      }),
      {
        name: "chat-storage",
        partialize: (state) => ({
          unreadCount: state.unreadCount,
          totalMessages: state.totalMessages,
        }),
      },
    ),
  ),
);

export default ChatStore;
export const useChatStore = <T>(selector: (state: ChatState & ChatActions) => T) => useStore(ChatStore, selector);
