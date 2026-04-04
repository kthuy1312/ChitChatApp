import { useMemo, useState } from "react"
import { useChatStore } from "@/stores/useChatStore"
import { useAuthStore } from "@/stores/useAuthStore"
import UserAvatar from "@/components/chat/UserAvatar"
import { Button } from "@/components/ui/button"
import { ShieldOff } from "lucide-react"
import { toast } from "sonner"

const RestrictedChatList = () => {
    const {
        conversations,
        toggleRestrict,
        setActiveConversation,
        fetchMessages,
    } = useChatStore()

    const { user } = useAuthStore()

    const [restrictingId, setRestrictingId] = useState<string | null>(null) //loading


    const restrictedConversations = useMemo(() => {
        if (!user?._id) return []

        return conversations.filter(c => {
            if (c.type !== "direct") return false

            const me = c.participants.find(
                p => p._id === user._id
            )

            return me?.isRestricted === true
        })
    }, [conversations, user?._id])


    const handleUnrestrict = async (conversationId: string) => {
        try {
            setRestrictingId(conversationId)
            await toggleRestrict(conversationId)
            toast.success("Đã bỏ hạn chế người dùng")
        } catch {
            toast.error("Không thể bỏ hạn chế")
        } finally {
            setRestrictingId(null)
        }
    }

    //nickname
    const nicknameMap = useMemo(() => {
        if (!user?._id) return {}

        const map: Record<string, string> = {}

        conversations.forEach(c => {
            if (c.type !== "direct") return

            const hasMe = c.participants.some(p => p._id === user._id)
            if (!hasMe) return

            c.participants.forEach(p => {
                if (p._id !== user._id && p.nickname) {
                    map[p._id] = p.nickname
                }
            })
        })

        return map
    }, [conversations, user?._id])

    if (restrictedConversations.length === 0) {
        return (
            <div className="py-10 text-center text-muted-foreground text-sm">
                Không có người dùng nào bị hạn chế
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {restrictedConversations.map(conver => {

                const other = conver.participants.find(
                    p => p._id !== user?._id
                )
                const nickname = other?._id ? nicknameMap[other._id] : null;

                return (
                    <div
                        key={conver._id}
                        className="
                            flex items-center gap-3
                            p-3 rounded-lg
                            border border-border
                            hover:bg-muted/50
                            transition
                        "
                    >

                        <UserAvatar
                            type="sidebar"
                            name={other?.displayName ?? "Người dùng"}
                            avatarUrl={other?.avatarUrl || undefined}
                        />

                        <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => {
                                setActiveConversation(conver._id)
                                fetchMessages(conver._id)
                            }}
                        >
                            <p
                                title={other?.displayName}
                                className="text-sm font-semibold truncate"
                            >
                                {nickname || other?.displayName}
                            </p>

                        </div>

                        <Button
                            size="sm"
                            variant="outline"
                            disabled={restrictingId === conver._id}
                            className={`shrink-0 transition ${restrictingId === conver._id
                                ? "opacity-60 cursor-not-allowed"
                                : ""
                                }`}
                            onClick={(e) => {
                                e.stopPropagation()
                                handleUnrestrict(conver._id)
                            }}
                        >
                            {restrictingId === conver._id ? (
                                <span className="flex items-center gap-1">
                                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    Đang bỏ hạn chế...
                                </span>
                            ) : (
                                "Bỏ hạn chế"
                            )}
                        </Button>

                    </div>
                )
            })}
        </div>
    )
}

export default RestrictedChatList
