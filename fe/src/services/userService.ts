import api from "@/lib/axios";

export const userService = {
    uploadAvatar: async (formData: FormData) => {
        const res = await api.post("/users/uploadAvatar", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        if (res.status === 400) {
            throw new Error(res.data.message);
        }

        return res.data;
    },

    updateProfile: async (username: string, displayName: string, phone?: string, bio?: string) => {
        try {
            const updateData = {
                username,
                displayName,
                //nếu phone rỗng thì gửi null để tránh lỗi trùng lặp ở db
                phone: phone || null,
                bio
            };

            const res = await api.patch("/users/profile", updateData);
            return res.data;

        } catch (error: any) {
            console.error("Cập nhật thất bại:", error.response?.data?.message || error.message);
            throw error;
        }
    }
};