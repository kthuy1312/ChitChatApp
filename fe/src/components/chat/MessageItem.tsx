import { cn, formatMessageTime } from "@/lib/utils";
import type { Conversation, Message, Participant } from "@/types/chat";
import UserAvatar from "./UserAvatar";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Forward, Pin } from "lucide-react";
import MessageOptions from "./MessageOptions";
import { useDarkMode } from "@/hooks/useDarkMode";
import { chatThemes } from "@/chatThemes";

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

    //tìm tin nhắn đã pin
    const isPinned = selectedConvo?.pinnedMessages?.some(
        p => p.messageId === message._id
    )

    //hệ thống: hiện thông báo nhỏ giữa
    if (message.isSystem || message.type === "system") {
        return (
            <div className="flex justify-center py-2">
                <span className="text-xs text-muted-foreground bg-white/10 dark:bg-black/20 px-2 py-1 rounded">
                    {message.content}
                </span>
            </div>
        );
    }

    //theme
    const isDark = useDarkMode();

    const themeKey = selectedConvo?.theme || "default";
    const theme = chatThemes[themeKey as keyof typeof chatThemes];

    const getColor = (key: string) => {
        const t = theme as Record<string, string>;

        return isDark
            ? t[`${key}-dark`] || t[key]
            : t[key];
    };

    const statusColorRaw = lastMessageStatus === "seen"
        ? getColor("--msg-status-seen")
        : getColor("--msg-status-sent");

    const statusColor = statusColorRaw || "220 10% 50%";


    return (
        <>
            <div
                id={`msg-${message._id}`}
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

                        {/* tn đã thu hồi thì kh hiện 3 chấm nữa */}
                        {!message.isUnsent && (
                            <>
                                {/* options (3 chấm) */}
                                < MessageOptions
                                    messageId={message._id}
                                    isOwn={message.isOwn}
                                    conversationId={message.conversationId}
                                    isPinned={isPinned}
                                />
                            </>
                        )}

                        {/* bubble */}
                        <div className="relative">
                            {/* dấu ghim tn */}
                            {isPinned && (
                                <Pin
                                    className={cn(
                                        "absolute -top-2 size-3 transition-all duration-200 hover:scale-110 hover:rotate-12 z-1",
                                        message.isOwn
                                            ? "-left-2 -rotate-45"   //tin của mình 
                                            : "-right-2 rotate-45" //người khác
                                    )}
                                    style={{
                                        color: `hsl(var(--pin-color))`,
                                    }}
                                />
                            )}
                            <Card
                                className={cn(
                                    "p-3 transition-all duration-200 text-sm border-none shadow-md",
                                    message.isUnsent
                                        ? "italic bg-gray-200/60 dark:bg-gray-700/40 text-muted-foreground shadow-none border border-gray-300/60 dark:border-gray-600/40"
                                        : ""
                                )}
                                style={
                                    message.isUnsent
                                        ? undefined
                                        : (() => {
                                            const bg = message.isOwn
                                                ? getColor("--chat-bubble-sent")
                                                : getColor("--chat-bubble-received");

                                            const text = message.isOwn
                                                ? getColor("--msg-sent-text")
                                                : getColor("--msg-received-text");

                                            return {
                                                background: bg.includes("gradient")
                                                    ? bg
                                                    : `hsl(${bg})`,
                                                color: `hsl(${text})`,
                                            };
                                        })()
                                }
                            >

                                {message.isUnsent
                                    ? (message.isOwn
                                        ? "Bạn đã thu hồi tin nhắn"
                                        : "Tin nhắn đã được thu hồi")
                                    : message.content}
                            </Card>
                        </div>
                    </div>

                    {/* seen / delivered */}
                    {message.isOwn &&
                        message._id === selectedConvo.lastMessage?._id && (
                            <Badge
                                className="text-xs px-2 py-1.5 h-6 border-0 mt-2 mb-1"
                                style={{
                                    background: statusColor.includes("gradient")
                                        ? statusColor
                                        : `hsl(${statusColor} / 0.15)`,
                                    color: statusColor.includes("gradient")
                                        ? "#fff"
                                        : `hsl(${statusColor})`,
                                }}
                            >
                                {lastMessageStatus === "seen" ? "Đã xem" : "Đã gửi"}
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