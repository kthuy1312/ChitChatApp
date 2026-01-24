import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import type { Conversation } from "@/types/chat";
import ChatCard from "./ChatCard";
import UnreadCountBadge from "./UnreadCountBadge";
import GroupChatAvatar from "./GroupChatAvatar";
import { cn, formatOnlineTime } from "@/lib/utils";

const GroupChatCard = ({ conver }: { conver: Conversation }) => {
    const { user } = useAuthStore();
    const { activeConversationId, setActiveConversation, messages, fetchMessages } = useChatStore();

    if (!user) return null;

    const unreadCounts = conver.unreadCounts[user._id];
    const name = conver.group?.name ?? "";
    const handleSelectConversation = async (id: string) => {
        setActiveConversation(id);
        if (!messages[id]) {
            await fetchMessages()
        }
    };
    const timestamp = conver.lastMessage?.createdAt ? new Date(conver.lastMessage.createdAt) : undefined


    return (
        <ChatCard
            converId={conver._id}
            isPinned={conver.isPinned}
            name={name}
            isActive={activeConversationId === conver._id}
            onSelect={handleSelectConversation}
            unreadCounts={unreadCounts}
            leftSection={
                <>
                    {unreadCounts > 0 && <UnreadCountBadge unreadCounts={unreadCounts} />}
                    <GroupChatAvatar
                        participants={conver.participants}
                        type="chat"
                    />
                </>
            }
            subtitle={
                <div className="flex items-center gap-1 min-w-0">
                    <p className="text-sm truncate text-muted-foreground">
                        {conver.participants.length} thành viên
                    </p>

                    {timestamp && (
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                            · {formatOnlineTime(timestamp)}
                        </span>
                    )}
                </div>
            }
            isGroup={true}

        />
    );
};

export default GroupChatCard;