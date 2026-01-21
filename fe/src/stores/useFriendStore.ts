import { friendService } from "@/services/friendService";
import type { FriendState } from "@/types/store";
import { create } from "zustand";


export const useFriendStore = create<FriendState>((set, get) => ({
    loading: false,

    searchByUsername: async (username) => {
        try {
            set({ loading: true })
            const user = await friendService.searchByUserName(username)
            return user;
        } catch (error) {
            console.error("Lỗi xảy ra khi searchByUsername: ", error)
            return null;
        } finally {
            set({ loading: false })
        }
    },

    addFriend: async (to, message) => {
        try {
            set({ loading: true });
            const resultMessage = await friendService.sendFriendRequest(to, message);
            return { success: true, message: resultMessage };
        } catch (error: any) {
            return {
                success: false,
                message:
                    error?.response?.data?.message ||
                    "Lỗi xảy ra khi gửi kết bạn. Hãy thử lại!",
            };
        } finally {
            set({ loading: false });
        }
    }

}))
