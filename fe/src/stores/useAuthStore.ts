import { create } from "zustand";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import type { AuthState } from "@/types/store";

export const useAuthStore = create<AuthState>((set, get) => ({
    accessToken: null,
    user: null,
    loading: false,

    clearState: () => {
        set({ accessToken: null, user: null, loading: false })
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
            const { accessToken } = await authService.signIn(username, password)
            set({ accessToken })

            await get().fetchMe()

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
    }

}))