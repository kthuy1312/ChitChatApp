import { Users } from "lucide-react";
import { useChatStore } from "@/stores/useChatStore";
import GroupChatCard from "./GroupChatCard";
import { useAuthStore } from "@/stores/useAuthStore";
import { useMemo } from "react";

const GroupChatList = () => {
    const { conversations } = useChatStore();
    const { user } = useAuthStore()
    if (!conversations) return null;

    const groupChats = useMemo(() => {
        if (!user?._id) return [];

        return conversations
            .filter(c => c.type === "group")
            .filter(c => {
                const me = c.participants.find(p => p._id === user._id);
                return !me?.isArchived;
            })
    }, [conversations, user?._id]);

    if (groupChats.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground shadow-sm">
                        <Users className="h-7 w-7" />
                    </div>

                    <div className="space-y-1">
                        <p className="text-sm font-medium">
                            Chưa có nhóm chat nào
                        </p>
                        <p className="text-xs text-muted-foreground max-w-[220px]">
                            Tạo nhóm để cùng trò chuyện, chia sẻ và làm việc chung
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {groupChats.map((conver) => (
                <GroupChatCard
                    conver={conver}
                    key={conver._id} />
            ))}
        </div>
    );
};

export default GroupChatList;
