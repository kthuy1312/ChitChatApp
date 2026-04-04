import {
    Palette,
    UserCog,
    Images,
    Pin,
    Search,
    Trash2,
    Users,
    User,
    ArrowLeft,
    PinOff
} from "lucide-react"; import UserAvatar from "./UserAvatar";
import GroupChatAvatar from "./GroupChatAvatar";
import StatusBadge from "./StatusBadge";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useChatStore } from "@/stores/useChatStore";
import type { PinnedMessage } from "@/types/chat";
import { chatThemes, themeInfo } from "@/chatThemes";
import { useDarkMode } from "@/hooks/useDarkMode";

const ConversationInfo = ({ chat, otherUser, isOnline, statusText, onPinnedMessageClick }: any) => {

    //pin modal
    const [view, setView] = useState<"info" | "pinned" | "theme" | "nickname">("info")
    const { togglePinMessage, updateTheme } = useChatStore()
    const isDark = useDarkMode();
    const [selectedTheme, setSelectedTheme] = useState(chat.theme || "default");
    const [nicknameMap, setNicknameMap] = useState<Record<string, string>>({})

    useEffect(() => {
        setSelectedTheme(chat.theme || "default");
    }, [chat.theme]);

    useEffect(() => {
        setNicknameMap((prev) => {
            const updated = { ...prev };

            chat.participants.forEach((p: any) => {
                const user = p.userID || p;
                updated[user._id] = p.nickname || "";
            });

            return updated;
        });
    }, [chat.participants]);

    //pin 
    const handlePin = async (messageId: string) => {
        try {
            await togglePinMessage(messageId)
            toast.success("Đã bỏ ghim tin nhắn");
        } catch {
            toast.error("Không thể thực hiện");
        }
    };

    const handlePinnedMessageClick = (messageId: string) => {
        if (onPinnedMessageClick) {
            onPinnedMessageClick(messageId);
        }
    };

    //theme
    const handleTheme = async (theme: string) => {
        try {
            const themeLabel = themeInfo[theme as keyof typeof themeInfo]?.label || theme;
            await updateTheme(chat._id, theme);
            toast.success(`Đã đổi thành chủ đề ${themeLabel}`);
        } catch (error) {
            console.error("Lỗi handleTheme:", error);
            toast.error("Cập nhật chủ đề thất bại. Vui lòng thử lại.");
        }
    };

    const getStyle = (value?: string) => {
        if (!value) return {};

        if (value.includes("gradient")) {
            return { background: value };
        }

        return { backgroundColor: `hsl(${value})` };
    };

    const currentTheme = chatThemes[selectedTheme as keyof typeof chatThemes];

    const previewBg = isDark
        ? currentTheme["--background-dark"]
        : currentTheme["--background"];

    const sentBg = isDark
        ? currentTheme["--chat-bubble-sent-dark"]
        : currentTheme["--chat-bubble-sent"];

    const receivedBg = isDark
        ? currentTheme["--chat-bubble-received-dark"]
        : currentTheme["--chat-bubble-received"];

    const receivedText = isDark
        ? currentTheme["--msg-received-text-dark"]
        : currentTheme["--msg-received-text"];

    //nickname
    const handleSetNickname = async (userId: string) => {
        try {
            const nickname = nicknameMap[userId]?.trim() || "";

            // validate
            if (nickname.length > 30) {
                toast.error("Biệt danh tối đa 30 ký tự");
                return;
            }

            if (!chat?._id) {
                toast.error("Không tìm thấy cuộc trò chuyện");
                return;
            }

            await useChatStore.getState().setNickname(
                chat._id,
                nickname,
                userId
            );

            toast.success("Đã cập nhật biệt danh");
        } catch (error) {
            console.error("Lỗi set nickname:", error);
            toast.error("Cập nhật thất bại");
        }
    };


    return (
        <div className="h-full flex flex-col overflow-hidden">
            {view === "info" && (
                <div className="flex flex-col overflow-hidden bg-background">
                    <div className="relative flex flex-col items-center p-7 bg-gradient-to-b from-primary/10 via-background to-background border-b border-border/50">
                        <div className="relative group">
                            {chat.type === "direct" ? (
                                <div className="relative">
                                    <UserAvatar
                                        type={"profile"}
                                        name={otherUser?.displayName}
                                        avatarUrl={otherUser?.avatarUrl}
                                        className="h-28 w-28 text-3xl shadow-2xl border-4 border-background transition-transform duration-300 group-hover:scale-105"
                                    />
                                    <div className="absolute bottom-2 right-2 scale-150">
                                        <StatusBadge status={isOnline ? "online" : "offline"} />
                                    </div>
                                </div>
                            ) : (
                                <div className="scale-150 py-6 transition-transform duration-300 group-hover:scale-[1.6]">
                                    <GroupChatAvatar participants={chat.participants} type="sidebar" />
                                </div>
                            )}
                        </div>

                        <div className="text-center mt-3 space-y-1">
                            <h3 className="font-bold text-2xl tracking-tight text-foreground">
                                {chat.type === "direct" ? otherUser?.displayName : chat.group?.name}
                            </h3>
                            {chat.type === "direct" ? (
                                <p className={`text-sm font-semibold px-3 py-1 rounded-full inline-block ${isOnline ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}>
                                    {statusText}
                                </p>
                            ) : (
                                <p className="text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full inline-block">
                                    {chat.participants.length} thành viên
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="p-4 space-y-6 overflow-y-auto beautiful-scrollbar max-h-[60vh]">


                        {/* Tùy chỉnh */}
                        <section className="space-y-1">
                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-2 mb-2">Tùy chỉnh</h4>
                            <OptionItem
                                icon={<Palette className="size-5 " />}
                                label="Chủ đề"
                                onClick={() => setView("theme")}
                            />

                            <OptionItem
                                icon={<UserCog className="size-5 " />}
                                label="Biệt danh"
                                onClick={() => setView("nickname")}
                            />
                        </section>

                        {chat.type === "direct" && (
                            <section className="pt-3 border-t border-border/40 space-y-1">
                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 ml-2 mb-2">
                                    Thông tin
                                </h4>

                                <OptionItem
                                    icon={<User className="size-5" />}
                                    label="Xem trang cá nhân"
                                />
                            </section>
                        )}
                        {chat.type === "group" && (
                            <section className="pt-3 border-t border-border/40 space-y-1">
                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-2 mb-2">
                                    Thông tin đoạn chat
                                </h4>
                                <OptionItem
                                    icon={<Users className="size-5" />}
                                    label="Thành viên trong nhóm"
                                    badge={chat.participants.length.toString()}
                                />
                            </section>
                        )}

                        {/* Kho lưu trữ */}
                        <section className="pt-3 border-t border-border/40 space-y-1">
                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-2 mb-2">Kho lưu trữ</h4>
                            <OptionItem
                                icon={<Images className="size-5 " />}
                                label="Xem ảnh"
                                badge="12"
                            />
                            <OptionItem
                                icon={<Pin className="size-5 " />}
                                label="Tin nhắn đã ghim"
                                onClick={() => setView("pinned")}
                            />
                            <OptionItem
                                icon={<Search className="size-5 " />}
                                label="Tìm kiếm tin nhắn"
                            />
                        </section>

                        <section className=" border-t border-border/40 space-y-1">
                            <OptionItem
                                icon={<Trash2 className="size-5" />}
                                label="Xóa lịch sử trò chuyện"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            />
                        </section>
                    </div>
                </div>
            )}

            {/* PIN */}
            {view === "pinned" && (
                <div className="flex flex-col h-full">
                    <div className="flex items-center gap-3 p-4 border-b shrink-0">
                        <button onClick={() => setView("info")}>
                            <ArrowLeft className="size-5" />
                        </button>
                        <h3 className="font-bold text-lg">Tin Nhắn Đã Ghim</h3>
                    </div>

                    {/* list pinned*/}
                    <div className="flex-1 overflow-y-auto beautiful-scrollbar p-4 space-y-3">
                        {chat.pinnedMessages?.length > 0 ? (
                            (chat.pinnedMessages as PinnedMessage[])
                                .slice()
                                .sort((a: PinnedMessage, b: PinnedMessage) => new Date(b.pinnedAt).getTime() - new Date(a.pinnedAt).getTime())
                                .map((p: any) => (
                                    <div
                                        key={p.messageId}
                                        onClick={() => handlePinnedMessageClick(p.messageId)}
                                        className="group flex items-start justify-between gap-3 p-3 rounded-xl bg-muted hover:bg-accent transition cursor-pointer"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {p.isUnsent ? "Tin nhắn đã thu hồi" : p.content}
                                            </p>

                                            <span className="text-xs text-muted-foreground">
                                                {new Date(p.createdAt).toLocaleString()}
                                            </span>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handlePin(p.messageId)
                                            }}
                                            className="opacity-0 group-hover:opacity-100 transition p-2 rounded-full hover:bg-destructive/10"
                                        >
                                            <PinOff className="size-4 text-primary" />
                                        </button>
                                    </div>
                                ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="bg-muted p-4 rounded-full mb-4">
                                    <Pin className="size-6 text-muted-foreground" />
                                </div>

                                <p className="text-sm font-medium text-foreground">
                                    Chưa có tin nhắn ghim
                                </p>

                                <p className="text-xs text-muted-foreground mt-1">
                                    Ghim tin nhắn để truy cập nhanh
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* THEME */}
            {view === "theme" && (<div className="flex flex-col h-full overflow-hidden">
                <div className="flex items-center gap-3 p-4 border-b shrink-0">
                    <button onClick={() => setView("info")}>
                        <ArrowLeft className="size-5" />
                    </button>
                    <h3 className="font-bold text-lg">Chủ đề cuộc trò chuyện</h3>
                </div>

                <div className="flex-1 overflow-y-auto beautiful-scrollbar p-4">
                    <div className="grid grid-cols-1 gap-3">
                        {Object.entries(chatThemes).map(([key]) => {
                            //key chính là tên theme
                            const info = themeInfo[key as keyof typeof themeInfo]; //info
                            const theme = chatThemes[key as keyof typeof chatThemes]; //chứa màu
                            const isSelectedTheme = chat.theme === key;

                            //lấy màu từ css vars
                            const bgColor = theme["--background"] as string;
                            const sentColor = theme["--chat-bubble-sent"] as string;
                            const receivedColor = theme["--chat-bubble-received"] as string;

                            return (
                                <button
                                    key={key}
                                    onMouseEnter={() => setSelectedTheme(key)}
                                    onMouseLeave={() => setSelectedTheme(chat.theme || "default")}
                                    onClick={() => {
                                        handleTheme(key);
                                        setSelectedTheme(key);
                                    }}
                                    className={`group relative flex items-center justify-between p-4 rounded-xl transition-all border-2 ${isSelectedTheme
                                        ? "border-primary bg-primary/10 shadow-md"
                                        : "border-border hover:border-primary/50 bg-muted/30 hover:bg-muted/50"
                                        }`}
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        {/* color preview (3 hình tròn)*/}
                                        <div className="flex gap-1 items-center">
                                            <div
                                                className="w-6 h-6 rounded-md border border-border/50 shadow-sm"
                                                style={getStyle(bgColor)}
                                                title="Nền"
                                            />
                                            <div
                                                className="w-6 h-6 rounded-md border border-border/50 shadow-sm"
                                                style={getStyle(sentColor)}
                                                title="Tin nhắn gửi"
                                            />
                                            <div
                                                className="w-6 h-6 rounded-md border border-border/50 shadow-sm"
                                                style={getStyle(receivedColor)}
                                                title="Tin nhắn nhận"
                                            />
                                        </div>

                                        {/* tên Theme */}
                                        <span className="font-semibold text-foreground text-left">
                                            {info.label}
                                        </span>
                                    </div>

                                    {/* icon check cho theme đang được chọn */}
                                    {isSelectedTheme && (
                                        <div className="flex-shrink-0">
                                            <div className="bg-primary rounded-full p-1">
                                                <svg
                                                    className="w-4 h-4 text-white"
                                                    fill="none"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Theme Preview */}
                    <div className="mt-8 p-4 rounded-xl border border-border/50 bg-muted/20">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                            Xem trước hiệu ứng
                        </h4>
                        <div
                            className="p-3 rounded-lg space-y-2"
                            style={getStyle(previewBg)}

                        >
                            <div
                                className="max-w-[70%] w-fit px-3 py-2 rounded-lg text-sm text-white ml-auto"
                                style={getStyle(sentBg)}
                            >
                                Tin nhắn của bạn
                            </div>
                            <div
                                className="max-w-[70%] w-fit px-3 py-2 rounded-lg text-sm"
                                style={{
                                    ...getStyle(receivedBg),
                                    color: `hsl(${receivedText})`
                                }}
                            >
                                Tin nhắn bạn bè
                            </div>
                        </div>
                    </div>
                </div>
            </div>)}

            {/* NICKNAME */}
            {view === "nickname" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chat.participants.map((p: any) => {
                        const user = p.userID || p
                        return (
                            <div
                                key={user._id}
                                className="flex items-center gap-3 p-3 rounded-xl bg-muted hover:bg-accent transition"
                            >
                                <UserAvatar
                                    type="sidebar"
                                    name={user.displayName}
                                    avatarUrl={user.avatarUrl}
                                    className="w-10 h-10 shrink-0"
                                />

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {user.displayName}
                                        {p.nickname && <span className="text-xs text-muted-foreground ml-1">({p.nickname})</span>}
                                    </p>

                                    <div className="mt-1 flex items-center gap-2">
                                        <input
                                            value={nicknameMap[user._id] || ""}
                                            onChange={(e) =>
                                                setNicknameMap({
                                                    ...nicknameMap,
                                                    [user._id]: e.target.value
                                                })
                                            }
                                            placeholder="Nhập biệt danh..."
                                            className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                                        />
                                        <button
                                            onClick={() => handleSetNickname(user._id)}
                                            className="px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition bg-primary text-white hover:opacity-90"

                                        >
                                            Lưu
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );

};

const OptionItem = ({ icon, label, className = "", onClick }: any) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-3 w-full p-3 hover:bg-accent rounded-xl transition-all font-medium text-sm ${className}`}
    >
        <div className="bg-muted p-2 rounded-full">{icon}</div>
        {label}
    </button>
)

export default ConversationInfo