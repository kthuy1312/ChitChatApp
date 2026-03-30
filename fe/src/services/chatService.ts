import api from "@/lib/axios"
import type { ConversationResponse, Message } from "@/types/chat"

interface FetchMessageProps {
    messages: Message[];
    cursor?: string;
}

const pageLimit = 10

export const chatService = {

    async fetchConversations(): Promise<ConversationResponse> {
        const res = await api.get("/conversations")
        return res.data
    },

    async fetchMessages(id: string, cursor?: string): Promise<FetchMessageProps> {
        const res = await api.get(`/conversations/${id}/messages?limit=${pageLimit}&cursor=${cursor}`)
        return { messages: res.data.messages, cursor: res.data.nextCursor }
    },

    async sendDirectMessage(recipientId: string, content: string, imgUrl?: string, conversationId?: string): Promise<FetchMessageProps> {
        const res = await api.post("/messages/direct", {
            recipientId, content, imgUrl, conversationId
        })
        return res.data.message
    },

    async sendGroupMessage(conversationId: string, content: string = "", imgUrl?: string): Promise<FetchMessageProps> {
        const res = await api.post("/messages/group", {
            conversationId, content, imgUrl
        })
        return res.data.message
    },

    async markAsSeen(conversationId: string) {
        const res = await api.patch(`/conversations/${conversationId}/seen`);
        return res.data;
    },

    async createConversation(
        type: "direct" | "group",
        name: string,
        memberIds: string[]
    ) {
        const res = await api.post("/conversations", { type, name, memberIds });
        return res.data.conversation;
    },

    async togglePinConversation(conversationId: string) {
        const res = await api.patch(`/conversations/${conversationId}/pin`)
        return res.data
    },

    async toggleArchiveConversation(conversationId: string) {
        const res = await api.patch(`/conversations/${conversationId}/archive`)
        return res.data
    },

    async toggleRestrictConversation(conversationId: string) {
        const res = await api.patch(`/conversations/${conversationId}/restrict`)
        return res.data
    },

    async leaveGroup(conversationId: string) {
        const res = await api.patch(`/conversations/${conversationId}/leaveGroup`)
        return res.data
    },

    async clearConversation(conversationId: string) {
        const res = await api.patch(`/conversations/${conversationId}/clearConversation`)
        return res.data
    },

    async forwardDirectMessage(recipientId: string, originalMessageId: string): Promise<Message> {
        const res = await api.post("/messages/forward-direct", {
            recipientId, originalMessageId
        })
        return res.data.data
    },

    async unsendMessage(messageId: string): Promise<Message> {
        const res = await api.patch(`/messages/${messageId}/unsend`)
        return res.data
    },
};