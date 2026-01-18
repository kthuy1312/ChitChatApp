import { create } from "zustand";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import type { AuthState } from "@/types/store";
import { persist } from "zustand/middleware";
import { useChatStore } from "./useChatStore";

export const useAuthStore = create<AuthState>()(
    persist((set, get) => ({
        accessToken: null,
        user: null,
        loading: false,

        clearState: () => {
            set({ accessToken: null, user: null, loading: false })
            localStorage.clear();
            useChatStore.getState().reset();
        },

        setAccessToken: (accessToken) => {
            set({ accessToken })
        },

        signUp: async (username, password, email, firstname, lastname) => {

            try {
                set({ loading: true })
                await authService.signUp(username, password, email, firstname, lastname)
                toast.success("Đăng ký thành công!")
            } catch (err) {
                console.error(err)
                toast.error('Đăng ký không thành công')
            } finally {
                set({ loading: false })
            }
        },

        signIn: async (username, password) => {
            try {
                set({ loading: true })

                localStorage.clear()
                useChatStore.getState().reset()

                const { accessToken } = await authService.signIn(username, password)
                get().setAccessToken(accessToken)

                await get().fetchMe()
                useChatStore.getState().fetchConversations()

                toast.success("Chào mừng bạn quay lại với ChitChat 🎉")
            } catch (err) {
                console.error(err)
                toast.error('Đăng nhập không thành công')
            } finally {
                set({ loading: false })
            }
        },

        signOut: async () => {
            try {
                get().clearState()
                await authService.signOut();
                toast.success("Đăng xuất thành công!")
            } catch (err) {
                console.error(err)
                toast.error('Đăng xuất không thành công')
            }
        },

        fetchMe: async () => {
            try {
                set({ loading: true })
                const user = await authService.fetchMe();
                set({ user })
            } catch (err) {
                console.error(err)
                set({ user: null, accessToken: null })
                toast.error('Lấy thông tin người không thành công')
            } finally {
                set({ loading: false })
            }
        },

        refresh: async () => {
            try {
                set({ loading: true })
                const { user, fetchMe } = get()
                const accessToken = await authService.refresh();
                get().setAccessToken(accessToken)

                if (!user) {
                    await fetchMe()
                }

            } catch (err) {
                console.error(err)
                toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại')
                get().clearState() //để xóa toàn bộ tt đăng nhập hiện tại
            } finally {
                set({ loading: false })
            }
        }
    }), {
        name: "auth-storage",
        partialize: (state) => ({ user: state.user }) //chỉ persist user
    })
)