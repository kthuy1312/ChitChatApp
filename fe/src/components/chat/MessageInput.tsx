import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation } from "@/types/chat";
import { useState } from "react";
import { Button } from "../ui/button";
import { ImagePlus, Send } from "lucide-react";
import { Input } from "../ui/input";
import EmojiPicker from "./EmojiPicker";
import { useChatStore } from "@/stores/useChatStore";
import { toast } from "sonner";

const MessageInput = ({ selectedConvo }: { selectedConvo: Conversation }) => {
    const { user } = useAuthStore();

    const { sendDirectMessage, sendGroupMessage, toggleRestrict } = useChatStore();

    const [unrestricting, setUnrestricting] = useState(false) //để loading khi bỏ hạn chế cho nút

    const [value, setValue] = useState("");

    if (!user) return;

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
    return (
        <div className="p-3 min-h-[56px] bg-background">
            {/* khi người dùng bị hạn chế thì hiện ra nút bỏ hạn chế */}
            {isRestricted ? (
                <div
                    className="
                           flex flex-col items-center gap-1
                           px-4 py-3
                           rounded-xl
                           bg-muted
                           border border-border
                           text-center
                       "
                >
                    <span className="text-sm font-medium text-foreground">
                        Bạn đã hạn chế {otherUser.displayName}
                    </span>

                    <span className="text-xs text-muted-foreground">
                        Họ sẽ không biết khi nào bạn online hoặc đọc tin nhắn của họ
                    </span>

                    <Button
                        onClick={handleUnrestrict}
                        disabled={unrestricting}
                        size="lg"
                        variant="outline"
                        className="
                               mt-1
                               h-8
                               px-9
                               rounded-full
                               text-xs
                           "
                    >
                        {unrestricting ? "Đang xử lý..." : "Bỏ hạn chế"}
                    </Button>
                </div>
            ) : (

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-primary/10 transition-smooth"
                    >
                        <ImagePlus className="size-4" />
                    </Button>

                    <div className="flex-1 relative">
                        <Input
                            onKeyPress={handleKeyPress}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder="Soạn tin nhắn..."
                            className="pr-20 h-9"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <EmojiPicker onChange={(emoji: string) => setValue(`${value}${emoji}`)} />
                        </div>
                    </div>

                    <Button
                        disabled={!value.trim()}
                        onClick={sendMessage}
                        className="bg-gradient-chat"
                    >
                        <Send className="size-4 text-white" />
                    </Button>
                </div>
            )}
        </div>
    )

};

export default MessageInput;