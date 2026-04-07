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
    const { forwardDirectMessage, forwardGroupMessage } = useChatStore()

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

    const handleFowardGroup = async (conversationId: string) => {
        try {
            setLoadingId(conversationId);
            await forwardGroupMessage(conversationId, messageId);
            setSentIds(prev => [...prev, conversationId]);
        } catch {
            console.error("Send failed");
        } finally {
            setLoadingId(null);
        }
    };

    //nickname
    const nicknameMap = useMemo(() => {
        if (!user?._id) return {};

        const map: Record<string, string> = {};

        conversations.forEach(c => {
            if (c.type === "direct") {
                const other = c.participants.find(p => p._id !== user._id);
                if (other && other.nickname) {
                    map[other._id] = other.nickname;
                }
            }
        });

        return map;
    }, [conversations, user?._id]);

    //kh chuyển tiếp cho ng đã hạn chế 
    const filteredFriends = useMemo(() => {
        if (!user?._id) return [];

        return friends.filter(friend => {
            //tìm conversation direct giữa mình và friend
            const convo = conversations.find(c =>
                c.type === "direct" &&
                c.participants.some(p => p._id === user._id) &&
                c.participants.some(p => p._id === friend._id)
            );

            if (!convo) return false;

            const me = convo.participants.find(p => p._id === user._id);
            return me && !me.isRestricted; //nếu mình đã hạn chế ng đó thì bỏ
        });
    }, [friends, conversations, user?._id]);

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
                            {filteredFriends.map((item: any) => {
                                const isLoading = loadingId === item._id;
                                const isSent = sentIds.includes(item._id);
                                const isOnline = onlineUsers.includes(item._id);
                                const nickname = nicknameMap[item._id];

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

                                            <div className="flex flex-col max-w-[160px]">
                                                <span className="text-sm font-medium truncate">
                                                    {item.displayName}
                                                </span>

                                                {nickname && (
                                                    <span className="text-xs text-muted-foreground truncate">
                                                        {nickname}
                                                    </span>
                                                )}
                                            </div>
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
                                            onClick={() => handleFowardGroup(item._id)}
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