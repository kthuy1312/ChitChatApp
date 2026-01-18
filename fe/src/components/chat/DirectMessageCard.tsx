import type { Conversation } from '@/types/chat'
import { useAuthStore } from '@/stores/useAuthStore'
import { useChatStore } from '@/stores/useChatStore'
import ChatCard from './ChatCard'
import { cn } from '@/lib/utils'
import UserAvatar from './UserAvatar'
import StatusBadge from './StatusBadge'
import UnreadCountBadge from './UnreadCountBadge'

const DirectMessageCard = ({ conver }: { conver: Conversation }) => {

    const { user } = useAuthStore()
    const { activeConversationId, setActiveConversation, messages } = useChatStore()

    if (!user) return null

    const otherUser = conver.participants.find((p) => p._id !== user._id)
    if (!otherUser) return null

    const unreadCounts = conver.unreadCounts[user._id]
    const lastMessage = conver.lastMessage?.content ?? ""

    const handleSelectConversation = async (id: string) => {
        setActiveConversation(id)
        if (!messages[id]) {
            //to do fetch mess
        }
    }

    return (
        <ChatCard
            converId={conver._id}
            name={otherUser.displayName ?? ""}
            timestamp={conver.lastMessage?.createdAt ? new Date(conver.lastMessage.createdAt) : undefined}
            isActive={activeConversationId === conver._id}
            onSelect={handleSelectConversation}
            unreadCounts={unreadCounts}
            leftSection={
                <>
                    <UserAvatar
                        type="sidebar"
                        name={otherUser.displayName ?? ""}
                        avatarUrl={otherUser.avatarUrl ?? undefined}
                    />

                    {/* todo socket io */}
                    <StatusBadge status="offline" />

                    {unreadCounts > 0 && <UnreadCountBadge unreadCounts={unreadCounts} />}

                </>}
            subtitle={
                <p className={cn("text-sm truncate"
                    , unreadCounts > 0 ? "font-medium text-foreground" : "text-muted-foreground"
                )}
                >
                    {lastMessage}
                </p>
            }
        />
    )
}

export default DirectMessageCard