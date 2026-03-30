import { cn, formatMessageTime } from "@/lib/utils";
import type { Conversation, Message, Participant } from "@/types/chat";
import UserAvatar from "./UserAvatar";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Forward } from "lucide-react";
import MessageOptions from "./MessageOptions";

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

    // show time + avatar
    const isShowTime =
        index === 0 ||
        new Date(message.createdAt).getTime() -
        new Date(prev?.createdAt || 0).getTime() >
        300000;

    const isGroupBreak = isShowTime || message.senderId !== prev?.senderId;

    const participant = selectedConvo.participants.find(
        (p: Participant) => p._id.toString() === message.senderId.toString()
    );

    return (
        <>
            <div
                className={cn(
                    "flex gap-2 mt-1 group",
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

                {/* content */}
                <div
                    className={cn(
                        "flex flex-col max-w-[70%]",
                        message.isOwn ? "items-end" : "items-start"
                    )}
                >
                    {/* forwarded */}
                    {message.isForwarded && (
                        <div className="flex items-center gap-1 mb-1 px-1 text-muted-foreground/70">
                            <Forward className="size-3" strokeWidth={2.5} />
                            <span className="text-[11px] italic">
                                {message.isOwn
                                    ? "Bạn đã chuyển tiếp một tin nhắn"
                                    : "Tin nhắn được chuyển tiếp"}
                            </span>
                        </div>
                    )}

                    <div
                        className={cn(
                            "flex items-center gap-1",
                            message.isOwn ? "flex-row" : "flex-row-reverse"
                        )}
                    >
                        {/* options (3 chấm) */}
                        <MessageOptions
                            messageId={message._id}
                            isOwn={message.isOwn}
                            conversationId={message.conversationId}
                        />

                        {/* bubble */}
                        <Card
                            className={cn(
                                "p-3 transition-all duration-200 text-sm",
                                message.isUnsent
                                    ? "italic border border-gray-300/60 bg-white/20 backdrop-blur-sm text-muted-foreground shadow-none"
                                    : message.isOwn
                                        ? "bg-gradient-chat text-white border-none shadow-md"
                                        : "bg-secondary/50 border-none shadow-sm"
                            )}
                        >
                            {message.isUnsent
                                ? (message.isOwn
                                    ? "Bạn đã thu hồi tin nhắn"
                                    : "Tin nhắn đã được thu hồi")
                                : message.content}
                        </Card>
                    </div>

                    {/* seen / delivered */}
                    {message.isOwn &&
                        message._id === selectedConvo.lastMessage?._id && (
                            <Badge
                                variant="outline"
                                className={cn(
                                    "text-xs px-2 py-1.5 h-6 border-0 mt-2",
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