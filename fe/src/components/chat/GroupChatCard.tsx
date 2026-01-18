import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import type { Conversation } from "@/types/chat";
import ChatCard from "./ChatCard";
import UnreadCountBadge from "./UnreadCountBadge";
import GroupChatAvatar from "./GroupChatAvatar";

const GroupChatCard = ({ conver }: { conver: Conversation }) => {
    const { user } = useAuthStore();
    const { activeConversationId, setActiveConversation, messages } = useChatStore();

    if (!user) return null;

    const unreadCounts = conver.unreadCounts[user._id];
    const name = conver.group?.name ?? "";
    const handleSelectConversation = async (id: string) => {
        setActiveConversation(id);
        if (!messages[id]) {
        }
    };

    return (
        <ChatCard
            converId={conver._id}
            name={name}
            timestamp={
                conver.lastMessage?.createdAt
                    ? new Date(conver.lastMessage.createdAt)
                    : undefined
            }
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
                <p className="text-sm truncate text-muted-foreground">
                    {conver.participants.length} thành viên
                </p>
            }
        />
    );
};

export default GroupChatCard;