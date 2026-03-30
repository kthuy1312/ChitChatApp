import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { CheckCheck, Loader2 } from "lucide-react";
import { useFriendStore } from "@/stores/useFriendStore";
import UserAvatar from "./UserAvatar";
import { useSocketStore } from "@/stores/useSocketStore";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import GroupChatAvatar from "./GroupChatAvatar";


interface ForwardMessageModalProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    messageId: string;
}

const ForwardMessageModal = ({
    open,
    onOpenChange,
    messageId,
}: ForwardMessageModalProps) => {

    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [sentIds, setSentIds] = useState<string[]>([]);
    const { onlineUsers } = useSocketStore();
    const { user } = useAuthStore()

    //hàm chuyển tiếp
    const { forwardDirectMessage } = useChatStore()

    //lấy group
    const { conversations } = useChatStore();
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

    const { friends, getFriends } = useFriendStore();

    useEffect(() => {
        if (open) {
            getFriends();
        }
    }, [open]);

    //khi đóng modal reset toàn bộ trạng thái
    useEffect(() => {
        if (!open) {
            setSentIds([]);
            setLoadingId(null);
        }
    }, [open]);

    const handleFowardDirect = async (id: string) => {
        try {
            setLoadingId(id);
            await forwardDirectMessage(id, messageId);
            setSentIds(prev => [...prev, id]);
        } catch {
            console.error("Send failed");
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold ml-1">
                        Chuyển Tiếp Tin Nhắn
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="friends">
                    <TabsList className="grid grid-cols-2">
                        <TabsTrigger value="friends">Bạn bè</TabsTrigger>
                        <TabsTrigger value="groups">Nhóm</TabsTrigger>
                    </TabsList>

                    <TabsContent value="friends">
                        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                            {friends.map((item: any) => {
                                const isLoading = loadingId === item._id;
                                const isSent = sentIds.includes(item._id);
                                const isOnline = onlineUsers.includes(item._id);

                                return (
                                    <div
                                        key={item._id}
                                        className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-muted transition"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <UserAvatar
                                                    type="chat"
                                                    name={item.displayName}
                                                    avatarUrl={item.avatarUrl}
                                                />

                                                {isOnline && (
                                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
                                                )}
                                            </div>

                                            <span className="text-sm font-medium truncate max-w-[160px]">
                                                {item.displayName}
                                            </span>
                                        </div>

                                        <Button
                                            size="default"
                                            disabled={isLoading || isSent}
                                            onClick={() => handleFowardDirect(item._id)}
                                            className="flex items-center gap-1 text-white"
                                        >
                                            {isLoading
                                                ? <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Đang gửi...
                                                </>
                                                : isSent
                                                    ? <>
                                                        <CheckCheck className="w-4 h-4" />
                                                        Đã gửi
                                                    </>
                                                    : "Gửi"}
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </TabsContent>

                    <TabsContent value="groups">
                        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                            {groupChats.map((item) => {
                                const isLoading = loadingId === item._id;
                                const isSent = sentIds.includes(item._id);

                                return (
                                    <div
                                        key={item._id}
                                        className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-muted transition"
                                    >
                                        <div className="flex items-center gap-3">
                                            <GroupChatAvatar
                                                participants={item.participants}
                                                type="chat"
                                            />

                                            <span className="text-sm font-medium truncate max-w-[160px]">
                                                {item.group.name}
                                            </span>
                                        </div>

                                        <Button
                                            size="default"
                                            disabled={isLoading || isSent}
                                            onClick={() => alert("ok")}
                                            className="flex items-center gap-1 text-white"
                                        >
                                            {isLoading
                                                ? <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Đang gửi...
                                                </>
                                                : isSent
                                                    ? <>
                                                        <CheckCheck className="w-4 h-4" />
                                                        Đã gửi
                                                    </>
                                                    : "Gửi"}
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default ForwardMessageModal;