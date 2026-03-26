import { userService } from "@/services/userService";
import type { UserState } from "@/types/store";
import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { toast } from "sonner";
import { useChatStore } from "./useChatStore";

export const useUserStore = create<UserState>((set, get) => ({
    updateAvatarUrl: async (formData) => {
        try {
            const { user, setUser } = useAuthStore.getState();
            const data = await userService.uploadAvatar(formData);

            if (user) {
                setUser({
                    ...user,
                    avatarUrl: data.avatarUrl,
                });

                useChatStore.getState().fetchConversations();
            }
        } catch (error) {
            console.error("Lỗi khi updateAvatarUrl", error);
            toast.error("Upload avatar không thành công!");
        }
    },

    updateProfile: async (username, displayName, phone, bio) => {
        try {
            const data = await userService.updateProfile(username, displayName, phone, bio);

            const { setUser, user } = useAuthStore.getState();

            if (data && user) {
                setUser({
                    ...user,
                    ...data.updatedUser,
                });

                toast.success("Cập nhật hồ sơ thành công");
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "Cập nhật profile thất bại";
            toast.error(errorMessage);
            console.error("Lỗi khi updateProfile:", error);
        }
    }
}));