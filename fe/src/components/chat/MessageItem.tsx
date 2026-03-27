import { cn, formatMessageTime } from "@/lib/utils";
import type { Conversation, Message, Participant } from "@/types/chat";
import UserAvatar from "./UserAvatar";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Forward } from "lucide-react";

interface MessageItemProps {
    message: Message;
    index: number;
    messages: Message[];
    selectedConvo: Conversation;
    lastMessageStatus: "delivered" | "seen";
}

const MessageItem = ({
    message,
    index,
    messages,
    selectedConvo,
    lastMessageStatus,
}: MessageItemProps) => {
    const prev = index + 1 < messages.length ? messages[index + 1] : undefined;

    //qdinh xem có tách nhóm tn hay kh (hiển thị lại ava và tgian)
    const isShowTime =
        index === 0 ||
        new Date(message.createdAt).getTime() -
        new Date(prev?.createdAt || 0).getTime() >
        300000; //5 phút
    const isGroupBreak = isShowTime || message.senderId !== prev?.senderId;

    const participant = selectedConvo.participants.find(
        (p: Participant) => p._id.toString() === message.senderId.toString()
    );

    return (
        <>

            <div
                className={cn(
                    "flex gap-2 message-bounce mt-1",
                    message.isOwn ? "justify-end" : "justify-start"
                )}
            >
                {/* avatar */}
                {!message.isOwn && (
                    <div className="w-8">
                        {isGroupBreak && (
                            <UserAvatar
                                type="chat"
                                name={participant?.displayName ?? "ChitChat"}
                                avatarUrl={participant?.avatarUrl ?? undefined}
                            />
                        )}
                    </div>
                )}

                {/* tin nhắn */}
                <div
                    className={cn(
                        "flex flex-col max-w-[70%]",
                        message.isOwn ? "items-end" : "items-start"
                    )}
                >
                    {/* chuyển tiếp */}
                    {message.isForwarded && (
                        <div className={cn(
                            "flex items-center gap-1 mb-1 px-1 text-muted-foreground/70",
                            "flex-row"
                        )}>
                            <Forward className="size-3" strokeWidth={2.5} />
                            {message.isOwn ?
                                (<span className="text-[11px] font-medium italic">Bạn đã chuyển tiếp một tin nhắn</span>
                                ) :
                                (<span className="text-[11px] font-medium italic">Tin nhắn được chuyển tiếp </span>)
                            }
                        </div>
                    )}

                    <Card
                        className={cn(
                            "p-3 transition-all duration-200",
                            message.isOwn
                                ? "chat-bubble-sent bg-gradient-chat border-none shadow-md text-white"
                                : "chat-bubble-received border-none shadow-sm bg-secondary/50"
                        )}
                    >
                        <p className="text-[15px] leading-relaxed break-words">
                            {message.content}
                        </p>
                    </Card>

                    {/* seen/ delivered */}
                    {message.isOwn && message._id === selectedConvo.lastMessage?._id && (
                        <Badge
                            variant="outline"
                            className={cn(
                                "text-xs px-2 py-1.5 h-6 border-0",
                                lastMessageStatus === "seen"
                                    ? "bg-primary/20 text-primary"
                                    : "bg-muted text-muted-foreground"
                            )}
                        >
                            {lastMessageStatus}
                        </Badge>
                    )}
                </div>
            </div>

            {/* time */}
            {isShowTime && (
                <span className="flex justify-center text-xs text-muted-foreground px-1">
                    {formatMessageTime(new Date(message.createdAt))}
                </span>
            )}

        </>
    );
};

export default MessageItem;