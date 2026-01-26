import { useMemo } from "react"
import { useChatStore } from "@/stores/useChatStore"
import { useAuthStore } from "@/stores/useAuthStore"
import GroupChatAvatar from "@/components/chat/GroupChatAvatar"
import UserAvatar from "@/components/chat/UserAvatar"
import { toast } from "sonner"
import UnreadCountBadge from "../chat/UnreadCountBadge"

const ArchivedChatList = () => {
    const {
        conversations,
        toggleArchive,
        setActiveConversation,
        fetchMessages,
    } = useChatStore()
    const { user } = useAuthStore()

    const archivedGroups = useMemo(() => {
        if (!user?._id) return []

        return conversations.filter(c => {
            if (c.type !== "group") return false
            const me = c.participants.find(p => p._id === user._id)
            return me?.isArchived
        })
    }, [conversations, user?._id])

    const archivedDirects = useMemo(() => {
        if (!user?._id) return []

        return conversations.filter(c => {
            if (c.type !== "direct") return false
            const me = c.participants.find(p => p._id === user._id)
            return me?.isArchived
        })
    }, [conversations, user?._id])

    const openConversation = async (conversationId: string) => {
        setActiveConversation(conversationId)
        await fetchMessages(conversationId)
    }


    //handle 
    const handleUnarchive = (
        e: React.MouseEvent,
        conversationId: string
    ) => {
        e.stopPropagation()

        try {
            toggleArchive(conversationId)
            toast.success("Đã bỏ lưu trữ")
        } catch {
            toast.error("Bỏ lưu trữ thất bại")
        }
    }


    return (
        <div className="space-y-8">

            {/*GROUP*/}
            <div>
                <h4 className="mb-3 text-sm font-semibold text-muted-foreground">
                    Nhóm
                </h4>

                {archivedGroups.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                        Không có nhóm nào được lưu trữ
                    </p>
                ) : (
                    <div className="space-y-3">
                        {archivedGroups.map(c => {
                            const unreadCount = c.unreadCounts?.[user?._id ?? ""] ?? 0
                            const hasUnread = unreadCount > 0

                            return (
                                <div
                                    key={c._id}
                                    onClick={() => openConversation(c._id)}
                                    className={`
                                             relative
                                             flex items-center justify-between
                                             rounded-xl p-3
                                             cursor-pointer
                                             transition
                                             ${hasUnread
                                            ? "bg-primary/10 ring-1 ring-primary/40 shadow-sm animate-archived-pop"
                                            : "bg-muted/40 hover:bg-muted"
                                        }
                                         `}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <GroupChatAvatar
                                            participants={c.participants}
                                            type="sidebar"
                                        />

                                        <div className="min-w-0">
                                            <p className={`text-sm font-medium truncate ${hasUnread ? "text-primary" : ""}`}>
                                                {c.group?.name || "Nhóm"}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {c.lastMessage
                                                    ? c.lastMessage.content ?? "[Tin nhắn]"
                                                    : "Chưa có tin nhắn"}
                                            </p>
                                        </div>
                                    </div>

                                    {hasUnread && (
                                        <UnreadCountBadge unreadCounts={unreadCount} />
                                    )}

                                    <button
                                        onClick={(e) => handleUnarchive(e, c._id)}
                                        className="
                                                 text-xs font-medium
                                                 px-3 py-1.5
                                                 rounded-full
                                                 bg-background border
                                                 hover:bg-primary hover:text-primary-foreground
                                                 transition
                                             "
                                    >
                                        Bỏ lưu trữ
                                    </button>
                                </div>
                            )
                        })}

                    </div>
                )}
            </div>

            {/*DIRECT*/}
            <div>
                <h4 className="mb-3 text-sm font-semibold text-muted-foreground">
                    Trò chuyện cá nhân
                </h4>

                {archivedDirects.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                        Không có chat cá nhân nào được lưu trữ
                    </p>
                ) : (
                    <div className="space-y-3">
                        {archivedDirects.map(c => {
                            const other = c.participants.find(
                                p => p._id !== user?._id
                            )

                            const unreadCount = c.unreadCounts?.[user?._id ?? ""] ?? 0
                            const hasUnread = unreadCount > 0

                            return (
                                <div
                                    key={c._id}
                                    onClick={() => openConversation(c._id)}
                                    className={`
                                               relative
                                               flex items-center gap-3
                                               rounded-xl p-3
                                               cursor-pointer
                                               transition
                                               ${hasUnread
                                            ? "bg-primary/10 ring-1 ring-primary/40 shadow-sm animate-archived-pop"
                                            : "bg-card hover:bg-muted"
                                        }
                    `}
                                >
                                    <UserAvatar
                                        type="sidebar"
                                        name={other?.displayName ?? "Người dùng"}
                                        avatarUrl={other?.avatarUrl || undefined}
                                    />

                                    <div className="flex-1 min-w-0">
                                        <p
                                            className={`text-sm font-medium truncate ${hasUnread ? "text-primary" : ""
                                                }`}
                                        >
                                            {other?.displayName ?? "Người dùng"}
                                        </p>

                                        <p className="text-xs text-muted-foreground truncate">
                                            {c.lastMessage
                                                ? c.lastMessage.content ?? "[Tin nhắn]"
                                                : "Chưa có tin nhắn"}
                                        </p>
                                    </div>

                                    {/* BADGE UNREAD */}
                                    {hasUnread && (
                                        <UnreadCountBadge unreadCounts={unreadCount} />
                                    )}

                                    <button
                                        onClick={(e) => handleUnarchive(e, c._id)}
                                        className="
                                                   text-xs font-medium
                                                   px-3 py-1.5
                                                   rounded-full
                                                   bg-muted
                                                   hover:bg-primary hover:text-primary-foreground
                                                   transition
                                               "
                                    >
                                        Bỏ lưu trữ
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                )}

            </div>
        </div>
    )
}

export default ArchivedChatList
