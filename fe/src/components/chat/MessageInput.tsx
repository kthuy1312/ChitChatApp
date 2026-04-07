import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation } from "@/types/chat";
import { useRef, useState } from "react";
import { Button } from "../ui/button";
import { ImagePlus, Loader, Send } from "lucide-react";
import { Input } from "../ui/input";
import EmojiPicker from "./EmojiPicker";
import { useChatStore } from "@/stores/useChatStore";
import { toast } from "sonner";
import { chatThemes } from "@/chatThemes";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useSocketStore } from "@/stores/useSocketStore";

const MessageInput = ({ selectedConvo }: { selectedConvo: Conversation }) => {
    const { user } = useAuthStore();

    const { sendDirectMessage, sendGroupMessage, toggleRestrict, uploadImageMessage } = useChatStore();

    const [unrestricting, setUnrestricting] = useState(false) //để loading khi bỏ hạn chế cho nút

    const [value, setValue] = useState("");

    if (!user) return;

    //hiện ng dùng đang nhập tn real time
    const socket = useSocketStore.getState().socket;
    const { activeConversationId } = useChatStore.getState();
    const [typingTimeout, setTypingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

    //hội thoại bị hạn chế
    const me = selectedConvo.participants.find(p => p._id === user?._id)
    const isRestricted = me?.isRestricted

    //other user
    const participants = selectedConvo.participants;
    const otherUser = participants.filter((p) => p._id !== user._id)[0];

    const handleUnrestrict = async () => {
        if (!selectedConvo?._id) return

        try {
            setUnrestricting(true)
            await toggleRestrict(selectedConvo._id)
            toast.success("Đã bỏ hạn chế thành công")
        } catch (err) {
            console.error(err)
            toast.error("Bỏ hạn chế thất bại")
        } finally {
            setUnrestricting(false)
        }
    }

    const sendMessage = async () => {

        if (!value.trim()) return;

        //để set thành rỗng liền luôn
        const currValue = value;
        setValue("")

        try {
            if (selectedConvo.type === 'direct') {
                await sendDirectMessage(otherUser._id, currValue);
            } else {
                await sendGroupMessage(selectedConvo._id, currValue);
            }
        } catch (error) {
            console.error(error);
            toast.error("Lỗi xảy ra khi gửi tin nhắn vui lòng thử lại!")
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            sendMessage();
        }
    }

    //ng dùng nhập 
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);

        if (socket && activeConversationId && user) {
            socket.emit("user-typing", { conversationId: activeConversationId, userId: user._id });
        }

        if (typingTimeout) clearTimeout(typingTimeout);

        const timeout = setTimeout(() => {
            if (socket && activeConversationId && user) {
                socket.emit("user-stop-typing", { conversationId: activeConversationId, userId: user._id });
            }
        }, 2000);

        setTypingTimeout(timeout);
    };

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

    const bg = getColor("--background");

    //gửi ảnh
    const fileRef = useRef<HTMLInputElement>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedConvo?._id) return;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("conversationId", selectedConvo._id);

        try {
            setUploadingImage(true);
            await uploadImageMessage(formData);
        } catch (err) {
            toast.error("Upload ảnh thất bại");
        } finally {
            setUploadingImage(false);
        }

        e.target.value = ""; //reset để chọn lại cùng file
    };

    return (
        <div
            className="p-3 min-h-[56px]"
            style={{
                background: bg.includes("gradient")
                    ? bg
                    : `hsl(${bg})`
            }}
        >
            {/* khi người dùng bị hạn chế thì hiện ra nút bỏ hạn chế */}
            {isRestricted ? (
                <div
                    className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl border text-center transition-all shadow-sm"
                    style={{
                        backgroundColor: `hsl(${getColor(isDark ? "--chat-bubble-received-dark" : "--chat-bubble-received")} / 0.2)`,
                        borderColor: `hsl(${getColor(isDark ? "--msg-status-seen-dark" : "--msg-status-seen")} / 0.3)`,
                    }}
                >
                    <span
                        className="text-sm font-bold"
                        style={{ color: `hsl(${getColor(isDark ? "--msg-received-text-dark" : "--msg-received-text")})` }}
                    >
                        Bạn đã hạn chế {otherUser.displayName}
                    </span>

                    <span
                        className="text-xs opacity-80"
                        style={{ color: `hsl(${getColor(isDark ? "--msg-received-text-dark" : "--msg-received-text")})` }}
                    >
                        Họ sẽ không biết khi nào bạn online hoặc đọc tin nhắn của họ
                    </span>

                    <Button
                        onClick={handleUnrestrict}
                        disabled={unrestricting}
                        size="lg"
                        variant="outline"
                        className="mt-2 h-8 px-9 rounded-full text-xs font-bold border-none transition-all hover:scale-105 active:scale-95"
                        style={{
                            background: getColor(isDark ? "--send-btn-bg-dark" : "--send-btn-bg").includes("gradient")
                                ? getColor(isDark ? "--send-btn-bg-dark" : "--send-btn-bg")
                                : `hsl(${getColor(isDark ? "--send-btn-bg-dark" : "--send-btn-bg")})`,
                            color: `hsl(${getColor(isDark ? "--msg-sent-text-dark" : "--msg-sent-text")})`
                        }}
                    >
                        {unrestricting ? "Đang xử lý..." : "Bỏ hạn chế"}
                    </Button>
                </div>
            ) : (

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => fileRef.current?.click()}
                    >
                        <ImagePlus className="size-4" />
                    </Button>

                    <input
                        type="file"
                        hidden
                        ref={fileRef}
                        accept="image/*"
                        onChange={handleUpload}
                    />

                    <div className="flex-1 relative">
                        <Input
                            onKeyPress={handleKeyPress}
                            value={value}
                            onChange={handleInputChange}
                            placeholder={uploadingImage ? "Đang gửi ảnh..." : "Soạn tin nhắn..."}
                            className="pr-20 h-9"
                            disabled={uploadingImage}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            {uploadingImage && (
                                <Loader className="w-4 h-4 text-muted-foreground animate-spin" />
                            )}
                            <EmojiPicker onChange={(emoji: string) => setValue(`${value}${emoji}`)} />
                        </div>
                    </div>

                    <Button
                        disabled={!value.trim()}
                        onClick={sendMessage}
                        className="text-white border-0 transition-colors hover:brightness-90"
                        style={{
                            backgroundColor: `hsl(var(--send-btn-bg))`,
                        }}
                    >
                        <Send className="size-4" />
                    </Button>
                </div>
            )}
        </div>
    )

};

export default MessageInput;