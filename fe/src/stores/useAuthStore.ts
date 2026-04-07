import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import type { AuthState } from "@/types/store";
import { useChatStore } from "./useChatStore";

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            accessToken: null,
            user: null,
            loading: false,
            changePasswordLoading: false,

            setUser: (user) => set({ user }),

            setAccessToken: (accessToken) => set({ accessToken }),

            clearState: () => {
                set({ accessToken: null, user: null, loading: false });
                useChatStore.getState().reset();
                localStorage.removeItem("auth-storage");
            },

            signUp: async (username, password, email, firstname, lastname) => {
                try {
                    set({ loading: true });
                    await authService.signUp(username, password, email, firstname, lastname);
                    toast.success("Đăng ký thành công!");
                } catch (err) {
                    console.error(err);
                    toast.error("Đăng ký không thành công");
                } finally {
                    set({ loading: false });
                }
            },

            signIn: async (username, password) => {
                try {
                    set({ loading: true });

                    const { accessToken } = await authService.signIn(username, password);
                    set({ accessToken });

                    await get().fetchMe();
                    useChatStore.getState().fetchConversations();

                    toast.success("Chào mừng bạn quay lại 🎉");
                } catch (err) {
                    console.error(err);
                    toast.error("Đăng nhập không thành công");
                    get().clearState();
                } finally {
                    set({ loading: false });
                }
            },

            signOut: async () => {
                try {
                    await authService.signOut();
                    get().clearState();
                    toast.success("Đăng xuất thành công");
                } catch (err) {
                    console.error(err);
                    toast.error("Đăng xuất không thành công");
                }
            },

            fetchMe: async () => {
                try {
                    set({ loading: true });
                    const user = await authService.fetchMe();
                    set({ user });
                } catch (err) {
                    console.error(err);
                    get().clearState();
                } finally {
                    set({ loading: false });
                }
            },

            refresh: async () => {
                try {
                    set({ loading: true });
                    const accessToken = await authService.refresh();
                    set({ accessToken });

                    if (!get().user) {
                        await get().fetchMe();
                    }
                } catch (err) {
                    console.error(err);
                    get().clearState();
                } finally {
                    set({ loading: false });
                }
            },
            changePassword: async (oldPwd, newPwd, confirmNewPwd) => {
                set({ changePasswordLoading: true });
                try {
                    const res = await authService.changePassword(oldPwd, newPwd, confirmNewPwd);
                    return { success: true, message: res.message || "Đổi mật khẩu thành công!" };
                } catch (err: any) {
                    return { success: false, message: err.response?.data?.message || err.message || "Đổi mật khẩu thất bại" };
                } finally {
                    set({ changePasswordLoading: false });
                }
            }
        }),
        {
            name: "auth-storage",
            partialize: (state) => ({
                accessToken: state.accessToken,
                user: state.user,
            }),
        }
    )
);
