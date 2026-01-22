import type { Conversation } from '@/types/chat'
import { useAuthStore } from '@/stores/useAuthStore'
import { useChatStore } from '@/stores/useChatStore'
import ChatCard from './ChatCard'
import { cn, formatOnlineTime } from '@/lib/utils'
import UserAvatar from './UserAvatar'
import StatusBadge from './StatusBadge'
import UnreadCountBadge from './UnreadCountBadge'
import { useSocketStore } from '@/stores/useSocketStore'

const DirectMessageCard = ({ conver }: { conver: Conversation }) => {

    const { user } = useAuthStore()
    const { activeConversationId, setActiveConversation, messages, fetchMessages } = useChatStore()

    const { onlineUsers } = useSocketStore();

    if (!user) return null

    const otherUser = conver.participants.find((p) => p._id !== user._id)
    if (!otherUser) return null

    const unreadCounts = conver.unreadCounts[user._id]
    const timestamp = conver.lastMessage?.createdAt ? new Date(conver.lastMessage.createdAt) : undefined

    //coi coi lastMessage có phải của mình không 
    const isMyLastMessage =
        conver.lastMessage?.senderId?._id === user._id;

    const lastMessageText = conver.lastMessage
        ? isMyLastMessage
            ? `Bạn: ${conver.lastMessage.content ?? ""}`
            : conver.lastMessage.content ?? ""
        : "";

    //ng đó đã seen chưa?
    const isSeen =
        isMyLastMessage &&
        conver.seenBy?.some((u) => u._id === otherUser._id);


    const handleSelectConversation = async (id: string) => {
        setActiveConversation(id)
        if (!messages[id]) {
            await fetchMessages()
        }
    }

    return (
        <ChatCard
            converId={conver._id}
            name={otherUser.displayName ?? ""}
            isActive={activeConversationId === conver._id}
            onSelect={handleSelectConversation}
            unreadCounts={unreadCounts}
            isMyLastMessage={isMyLastMessage}
            isSeen={isSeen}
            leftSection={
                <>
                    <UserAvatar
                        type="sidebar"
                        name={otherUser.displayName ?? ""}
                        avatarUrl={otherUser.avatarUrl ?? undefined}
                    />

                    {/* todo: socket io */}
                    <StatusBadge
                        status={onlineUsers.includes(otherUser?._id ?? "") ? "online" : "offline"}
                    />

                    {unreadCounts > 0 && <UnreadCountBadge unreadCounts={unreadCounts} />}

                </>}

            subtitle={
                <div className="flex items-center gap-1 min-w-0">
                    <p
                        className={cn(
                            "flex-1 truncate text-sm leading-snug",
                            unreadCounts > 0
                                ? "font-medium text-foreground"
                                : "text-muted-foreground"
                        )}
                    >
                        {lastMessageText}
                    </p>

                    {timestamp && (
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                            {formatOnlineTime(timestamp)}
                        </span>
                    )}
                </div>
            }

        />
    )
}

export default DirectMessageCard