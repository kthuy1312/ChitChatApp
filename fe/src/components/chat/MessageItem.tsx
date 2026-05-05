import { cn, formatMessageTime } from "@/lib/utils";
import type { Conversation, Message } from "@/types/chat";
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
    lastMessageStatus: "delivered" | "seen" | "hidden";
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
        p => String(p._id) === String(message.senderId)
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
    const { toggleReaction, conversations } = useChatStore();
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
    const displayName = participant?.displayName || message.sender?.displayName || "Người dùng đã rời";
    const avatarUrl = participant?.avatarUrl || message.sender?.avatarUrl || undefined;
    const nickname = participant?.nickname;

    // nếu message là của người bị hạn chế thì không hiện nút ghim
    const { user } = useAuthStore()

    const conversation = conversations.find(c => c._id === message.conversationId);

    const shouldShowPin = (() => {
        if (!conversation) return true;
        const me = conversation.participants.find(p => p._id === user?._id);
        const sender = conversation.participants.find(p => p._id !== me?._id);
        if (!sender) return true;
        return !me?.isRestricted;
    })();

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
                    {/* tên của ng gửi nếu là nhóm */}
                    {selectedConvo.type === "group" && !message.isOwn && isGroupBreak && (
                        <span className="text-xs text-muted-foreground mb-1 px-1">
                            {nickname ? nickname : displayName}
                        </span>
                    )}

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
                                {shouldShowPin && (
                                    <button
                                        className="ml-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                        onClick={() => setShowReactionsMenu(prev => !prev)}
                                    >
                                        <Smile className="size-4" />
                                    </button>
                                )}

                                {/* menu reaction */}
                                {showReactionsMenu && (
                                    <div
                                        className={cn(
                                            "absolute bottom-full mb-3 flex gap-2 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg z-50 transform origin-bottom pop-bounce backdrop-blur-sm",
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
                                                        "w-8 h-8 rounded-full transition-all duration-200 flex items-center justify-center text-lg hover:scale-125 active:scale-95",
                                                        "hover:bg-gray-200 dark:hover:bg-gray-800",
                                                        isSelected ? "bg-blue-200 dark:bg-blue-900/50 scale-110" : ""
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
                                        "transition-all duration-200 text-sm border-none",

                                        message.isUnsent
                                            ? "italic bg-gray-200/60 dark:bg-gray-700/40 text-muted-foreground shadow-none border border-gray-300/60 dark:border-gray-600/40 p-3"
                                            : message.imgUrl
                                                ? "p-0 bg-transparent shadow-none"
                                                : "p-3 shadow-md"
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

                                    {message.isUnsent ? (
                                        message.isOwn
                                            ? "Bạn đã thu hồi tin nhắn"
                                            : "Tin nhắn đã được thu hồi"
                                    ) : message.imgUrl ? (
                                        <img
                                            src={message.imgUrl}
                                            alt="chat-img"
                                            className="
                                                    max-w-[220px]
                                                    object-conver
                                                    cursor-pointer
                                                    hover:scale-[1.02]
                                                    transition
                                                    rounded-xl
                                                    shadow-sm
                                                    block
                                                "
                                            onClick={() => message.imgUrl && window.open(message.imgUrl, "_blank")}
                                        />
                                    ) : (
                                        message.content
                                    )}
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
                                    className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm"
                                    onClick={() => setIsReactionsModalOpen(false)}
                                >
                                    <div
                                        className="p-6 rounded-3xl shadow-2xl max-w-md w-full animate-scaleIn border border-white/20 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800"
                                        style={{
                                            borderColor: `hsl(${getColor(isDark ? "--msg-status-seen-dark" : "--msg-status-seen")} / 0.3)`,
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <h3
                                            className="text-lg font-bold mb-4 text-center tracking-wide"
                                            style={{ color: `hsl(${getColor(isDark ? "--msg-received-text-dark" : "--msg-received-text")})` }}
                                        >
                                            Cảm Xúc
                                        </h3>

                                        <ul className="max-h-100 overflow-y-auto beautiful-scrollbar space-y-1.5 pr-2">
                                            {orderedReactions.map(({ emoji, userId }) => {
                                                const user = selectedConvo.participants.find((p) => p._id === userId);
                                                const displayName = user?.displayName ?? "Người dùng";
                                                const avatarUrl = user?.avatarUrl;
                                                const isMine = userId === currentUserId;

                                                return (
                                                    <li
                                                        key={`${emoji}-${userId}`}
                                                        className={`flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer ${isMine
                                                            ? "hover:brightness-110 active:scale-95 hover:shadow-md"
                                                            : "hover:brightness-105"
                                                            }`}
                                                        style={{
                                                            backgroundColor: isMine
                                                                ? `hsl(${getColor(isDark ? "--chat-bubble-received-dark" : "--chat-bubble-received")} / 0.2)`
                                                                : isDark
                                                                    ? "rgba(255,255,255,0.05)"
                                                                    : "rgba(0,0,0,0.02)",
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
                                                                        className="text-[11px] font-medium"
                                                                        style={{
                                                                            color: `hsl(${getColor(isDark ? "--msg-status-seen-dark" : "--msg-status-seen")})`
                                                                        }}
                                                                    >
                                                                        Nhấn để gỡ bỏ
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <span className="text-3xl animate-bounce" style={{ animationDelay: "0s" }}>
                                                            {emoji}
                                                        </span>
                                                    </li>
                                                );
                                            })}
                                        </ul>

                                        <button
                                            className="mt-5 w-full py-2.5 text-sm font-bold rounded-2xl transition-all active:scale-95 shadow-md hover:shadow-lg hover:opacity-80"
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
                        message._id === selectedConvo.lastMessage?._id && 
                        lastMessageStatus !== "hidden" && (
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