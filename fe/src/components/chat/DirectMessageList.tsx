import { MessageCircle } from "lucide-react";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useMemo } from "react";
import DirectMessageCard from "./DirectMessageCard";

const DirectMessageList = () => {
    const { conversations } = useChatStore();
    const { user } = useAuthStore();

    const directConversations = useMemo(() => {
        if (!user?._id) return []

        return conversations
            .filter(c => c.type === "direct")
            .filter(c => {
                const me = c.participants.find(p => p._id === user._id)
                return !me?.isArchived
            })
            .filter(c => {
                const other = c.participants.find(p => p._id !== user._id)
                return !other?.isRestricted
            })
    }, [conversations, user?._id])


    if (directConversations.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground shadow-sm">
                        <MessageCircle className="h-7 w-7" />
                    </div>
                    <p className="text-sm font-medium">Chưa có cuộc trò chuyện nào</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {directConversations.map(conver => (
                <DirectMessageCard key={conver._id} conver={conver} />
            ))}
        </div>
    );
};

export default DirectMessageList;
