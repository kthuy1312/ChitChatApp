import { useChatStore } from "@/stores/useChatStore";
import type { Conversation, Participant } from "@/types/chat";
import { SidebarTrigger } from "../ui/sidebar";
import { useAuthStore } from "@/stores/useAuthStore";
import { Separator } from "../ui/separator";
import UserAvatar from "./UserAvatar";
import StatusBadge from "./StatusBadge";
import GroupChatAvatar from "./GroupChatAvatar";
import { useSocketStore } from "@/stores/useSocketStore";
// Thay đổi import formatUserStatus thành useTimeAgo
import { useTimeAgo } from "@/lib/utils";
import { MoreVertical } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog"; // Import Modal từ shadcn
import { Button } from "../ui/button";
import ConversationInfo from "./ConversationInfo";
import { useState } from "react";
const ChatWindowHeader = ({ chat, scrollToPinnedRef }: { chat?: Conversation, scrollToPinnedRef?: React.MutableRefObject<any> }) => {

    const { conversations, activeConversationId } = useChatStore();
    const { user } = useAuthStore();
    const { onlineUsers, offlineRecords } = useSocketStore();
    const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);

    let otherUser: Participant | null = null;
    let isOnline = false;

    chat = chat ?? conversations.find((c) => c._id === activeConversationId);

    if (!chat) {
        return (
            <header className="md:hidden sticky top-0 z-10 flex items-center gap-2 px-4 py-2 w-full">
                <SidebarTrigger className="-ml-1 text-foreground" />
            </header>
        );
    }

    if (chat.type === "direct") {
        const otherUsers = chat.participants.filter((p) => p._id !== user?._id);
        otherUser = otherUsers.length > 0 ? otherUsers[0] : null;

        if (otherUser) {
            isOnline = onlineUsers.includes(otherUser._id);
        }

        if (!user || !otherUser) return;
    }

    // Nó sẽ tự động quản lý setInterval và trả về chuỗi "Hoạt động... trước" tự cập nhật
    const offlineTime = otherUser ? (offlineRecords[otherUser._id] || otherUser.offlineAt) : null;
    const statusText = useTimeAgo(isOnline, offlineTime ?? null);

    return (
        <header className="sticky top-0 z-10 px-4 py-2 flex items-center bg-background justify-between">
            <div className="flex items-center gap-2">

                <SidebarTrigger className="-ml-1 text-foreground" />
                <Separator orientation="vertical" className="mr-2 h-4" />

                <div className="p-2 flex items-center gap-3">
                    <div className="relative">
                        {chat.type === "direct" ? (
                            <>
                                <UserAvatar
                                    type={"sidebar"}
                                    name={otherUser?.displayName || "ChitChat"}
                                    avatarUrl={otherUser?.avatarUrl || undefined}
                                />
                                <StatusBadge
                                    status={onlineUsers.includes(otherUser?._id ?? "") ? "online" : "offline"}
                                />
                            </>
                        ) : (
                            <GroupChatAvatar
                                participants={chat.participants}
                                type="sidebar"
                            />
                        )}
                    </div>

                    <div className="flex flex-col">
                        <h2 className="font-semibold text-foreground leading-tight">
                            {chat.type === "direct" ? otherUser?.displayName : chat.group?.name}
                        </h2>
                        {chat.type === "direct" && (
                            <span className={`text-[11px] ${isOnline ? "text-green-500 font-medium" : "text-muted-foreground"}`}>
                                <span>{statusText}</span>
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <MoreVertical className="size-5 text-muted-foreground" />
                    </Button>
                </DialogTrigger>

                <DialogContent className="max-w-md h-[80vh] p-0 overflow-hidden sm:rounded-2xl border-none shadow-2xl">
                    <ConversationInfo chat={chat} otherUser={otherUser} isOnline={isOnline} statusText={statusText} onPinnedMessageClick={(messageId: string) => {
                        scrollToPinnedRef?.current?.(messageId);
                        setIsInfoDialogOpen(false);
                    }} />
                </DialogContent>
            </Dialog>
        </header>
    );
};

export default ChatWindowHeader;