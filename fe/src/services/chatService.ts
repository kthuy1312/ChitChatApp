import api from "@/lib/axios"
import type { ConversationResponse } from "@/types/chat"

export const chatService = {

    async fetchConversations(): Promise<ConversationResponse> {
        const res = await api.get("/conversations")
        return res.data
    }

}