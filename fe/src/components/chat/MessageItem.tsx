import { cn, formatMessageTime } from "@/lib/utils";
import type { Conversation, Message, Participant } from "@/types/chat";
import UserAvatar from "./UserAvatar";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Forward, Pin, Smile } from "lucide-react";
import MessageOptions from "./MessageOptions";
import { useDarkMode } from "@/hooks/useDarkMode";
import { chatThemes } from "@/chatThemes";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect, useRef, useState } from "react";

interface MessageItemProps {
    message: Message;
    index: number;
    messages: Message[];
    selectedConvo: Conversation;
    lastMessageStatus: "delivered" | "seen";
    isTyping?: boolean;
}

const MessageItem = ({
    message,
    index,
    messages,
    selectedConvo,
    lastMessageStatus,
    isTyping = false,
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

    //khi ng dùng nhập
    if (isTyping) {
        return (
            <div className="flex gap-2 mt-1 mb-2 group justify-start">

                {/* avatar */}
                <div className="w-8">
                    {isGroupBreak && (
                        <UserAvatar
                            type="chat"
                            name={participant?.displayName ?? "ChitChat"}
                            avatarUrl={participant?.avatarUrl ?? undefined}
                        />
                    )}
                </div>

                {/* content */}
                <div className="flex flex-col max-w-[70%] items-start">
                    <Card className="p-3 text-sm border-none shadow-md italic bg-gray-200/70 dark:bg-gray-700/60 text-muted-foreground">
                        <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.2s]"></span>
                            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>

                    </Card>
                </div>
            </div>
        );
    }

    //reation
    const { toggleReaction } = useChatStore();
    const currentUserId = useAuthStore().user?._id;
    const [showReactionsMenu, setShowReactionsMenu] = useState(false);
    const reactionBtnRef = useRef<HTMLDivElement>(null);
    const [isReactionsModalOpen, setIsReactionsModalOpen] = useState(false);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (reactionBtnRef.current && !reactionBtnRef.current.contains(e.target as Node)) {
                setShowReactionsMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    //gỡ reaction của người dùng
    const removeReaction = (emoji: string) => {
        toggleReaction(message.conversationId, message._id, emoji, currentUserId!);
        setIsReactionsModalOpen(false); // đóng modal nếu muốn
    };

    //tách reactions của mình ra trước (để hiện react của mình lên trước)
    const mineReactions: { emoji: string; userId: string }[] = [];
    const othersReactions: { emoji: string; userId: string }[] = [];

    message.reactions?.forEach((r) => {
        if (r.userId === currentUserId) mineReactions.push(r);
        else othersReactions.push(r);
    });

    const orderedReactions = [...mineReactions, ...othersReactions];

    //fallback nếu không còn trong group
    const displayName =
        participant?.displayName || message.sender?.displayName || "Người dùng";

    const avatarUrl =
        participant?.avatarUrl || message.sender?.avatarUrl;

    return (
        <>
            <div
                id={`msg-${message._id}`}
                className={cn(
                    "flex gap-2 mt-1 mb-2 group",
                    message.isOwn ? "justify-end" : "justify-start"
                )}
                style={{
                    marginBottom: message.reactions && message.reactions.length > 0 ? '1rem' : '0.5rem',
                }}
            >
                {/* avatar */}
                {!message.isOwn && (
                    <div className="w-8">
                        {isGroupBreak && (
                            <UserAvatar
                                type="chat"
                                name={displayName}
                                avatarUrl={avatarUrl || undefined}
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
                        <div className="flex items- center gap-1 mb-1 px-1 text-muted-foreground/70">
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
                            <div
                                ref={reactionBtnRef}
                                className="relative flex items-center group" //group để hover
                            >
                                <MessageOptions
                                    messageId={message._id}
                                    isOwn={message.isOwn}
                                    conversationId={message.conversationId}
                                    isPinned={isPinned}
                                />

                                {/* nút reaction*/}
                                <button
                                    className="ml-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                    onClick={() => setShowReactionsMenu(prev => !prev)}
                                >
                                    <Smile className="size-4" />
                                </button>

                                {/* menu reaction */}
                                {showReactionsMenu && (
                                    <div
                                        className={cn(
                                            "absolute bottom-full mb-2 flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm z-50 transform origin-bottom pop-bounce",
                                            message.isOwn ? "right-0" : "left-0"
                                        )}
                                    >
                                        {["👍", "❤️", "😂", "😢", "😡"].map(emoji => {
                                            // check emoji này đã react chưa
                                            const isSelected = message.reactions?.some(
                                                r => r.userId === currentUserId && r.emoji === emoji
                                            );

                                            return (
                                                <button
                                                    key={emoji}
                                                    className={cn(
                                                        "p-1 text-lg rounded-lg transition-colors duration-150 flex items-center justify-center",
                                                        "hover:bg-gray-200 dark:hover:bg-gray-700",
                                                        isSelected ? "bg-gray-300 dark:bg-gray-600" : ""
                                                    )}
                                                    onClick={() => {
                                                        toggleReaction(message.conversationId, message._id, emoji, currentUserId!);
                                                        setShowReactionsMenu(false);
                                                    }}
                                                >
                                                    {emoji}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
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
                            <div className="relative">
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

                            {/* reactions */}
                            {message.reactions && message.reactions.length > 0 && (
                                <div className={cn(
                                    "absolute bottom-0 flex gap-1 translate-y-1/2 max-w-full",
                                    message.isOwn ? "right-0 justify-end" : "left-0 justify-start"
                                )}>
                                    <button
                                        className="flex items-center -space-x-1 px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full text-xs hover:bg-gray-300 dark:hover:bg-gray-600"
                                        onClick={() => setIsReactionsModalOpen(true)}
                                    >
                                        {(() => {
                                            const emojiArray = Array.from(
                                                message.reactions.reduce((map, r) => {
                                                    if (!map.has(r.emoji)) map.set(r.emoji, []);
                                                    map.get(r.emoji)?.push(r.userId);
                                                    return map;
                                                }, new Map<string, string[]>())
                                            );

                                            const firstThree = emojiArray.slice(0, 3);
                                            const totalReacts = message.reactions?.length || 0;
                                            const remainingCount = totalReacts - 3; //trừ 3 cái hiển thị
                                            return (
                                                <>
                                                    {firstThree.map(([emoji, users]) => (
                                                        <span
                                                            key={emoji}
                                                            className="w-5 h-5 flex items-center justify-center text-[12px]"
                                                            title={`${users.length} người đã react`}
                                                        >
                                                            {emoji}
                                                        </span>
                                                    ))}
                                                    {remainingCount > 0 && (
                                                        <span
                                                            className="flex items-center justify-center w-6 h-5 px-1 text-[10px] font-semibold bg-gray-300 dark:bg-gray-600 rounded-full"
                                                            title={`${totalReacts} tổng số react`}
                                                        >
                                                            +{remainingCount}
                                                        </span>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </button>
                                </div>
                            )}

                            {/* reactions modal */}
                            {isReactionsModalOpen && (
                                <div
                                    className="fixed inset-0 flex items-center justify-center z-50 bg-black/40"
                                    onClick={() => setIsReactionsModalOpen(false)}
                                >
                                    <div
                                        className="p-8 rounded-3xl shadow-lg max-w-md w-full animate-scaleIn border"
                                        style={{
                                            backgroundColor: isDark
                                                ? (getColor("--background-dark").includes("gradient") ? "white" : `hsl(${getColor("--background-dark")})`)
                                                : (getColor("--background").includes("gradient") ? "white" : `hsl(${getColor("--background")})`),
                                            borderColor: `hsl(${getColor(isDark ? "--msg-status-seen-dark" : "--msg-status-seen")})`,
                                            background: isDark ? getColor("--background-dark") : getColor("--background")
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <h3
                                            className="text-xl font-extrabold mb-4 text-center tracking-wide"
                                            style={{ color: `hsl(${getColor(isDark ? "--msg-received-text-dark" : "--msg-received-text")})` }}
                                        >
                                            Cảm Xúc
                                        </h3>

                                        <ul className="max-h-100 overflow-y-auto beautiful-scrollbar space-y-2 pr-1">
                                            {orderedReactions.map(({ emoji, userId }) => {
                                                const user = selectedConvo.participants.find((p) => p._id === userId);
                                                const displayName = user?.displayName ?? "Người dùng";
                                                const avatarUrl = user?.avatarUrl;
                                                const isMine = userId === currentUserId;

                                                return (
                                                    <li
                                                        key={`${emoji}-${userId}`}
                                                        className={`flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${isMine ? "hover:brightness-90 active:scale-[0.98]" : ""
                                                            }`} style={{
                                                                backgroundColor: isMine
                                                                    ? `hsl(${getColor(isDark ? "--chat-bubble-received-dark" : "--chat-bubble-received")} / 0.4)`
                                                                    : "transparent"
                                                            }}
                                                        onClick={() => {
                                                            if (isMine) removeReaction(emoji);
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <UserAvatar type="sidebar" name={displayName} avatarUrl={avatarUrl ?? undefined} />
                                                            <div className="flex flex-col">
                                                                <span
                                                                    className="text-sm font-semibold"
                                                                    style={{ color: `hsl(${getColor(isDark ? "--msg-received-text-dark" : "--msg-received-text")})` }}
                                                                >
                                                                    {displayName} {isMine && "(Bạn)"}
                                                                </span>
                                                                {isMine && (
                                                                    <span
                                                                        className="text-[10px] font-bold text-gray-900/70 dark:text-white/70"                                                                    >
                                                                        Nhấn để gỡ
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <span className="text-2xl">{emoji}</span>
                                                    </li>
                                                );
                                            })}
                                        </ul>

                                        <button
                                            className="mt-6 w-full py-3 text-sm font-bold rounded-xl transition-all active:scale-95 shadow-md hover:opacity-60"
                                            style={{
                                                background: getColor(isDark ? "--send-btn-bg-dark" : "--send-btn-bg").includes("gradient")
                                                    ? getColor(isDark ? "--send-btn-bg-dark" : "--send-btn-bg")
                                                    : `hsl(${getColor(isDark ? "--send-btn-bg-dark" : "--send-btn-bg")})`,
                                                color: `hsl(${getColor(isDark ? "--msg-sent-text-dark" : "--msg-sent-text")})`
                                            }}
                                            onClick={() => setIsReactionsModalOpen(false)}
                                        >
                                            Đóng
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* seen / delivered */}
                    {message.isOwn &&
                        message._id === selectedConvo.lastMessage?._id && (
                            <Badge
                                className="text-xs px-2 py-1.5 h-6 border-0 mt-2 mb-1"
                                style={{
                                    marginTop: message.reactions && message.reactions.length > 0 ? '1rem' : '0.5rem',
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