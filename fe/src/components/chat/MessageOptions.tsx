import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import {
    CornerUpRight,
    Pin,
    RotateCcw,
    MoreVertical,
} from "lucide-react";

import { toast } from "sonner";
import ForwardMessageModal from "./ForwardMessageModal";
import { useState } from "react";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";

interface MessageOptionsProps {
    messageId: string;
    isOwn?: boolean;
    conversationId: string;
    isPinned?: boolean;

    onForward?: (id: string) => void;
    onDelete?: (id: string) => void;
    onRecall?: (id: string) => void; // thu hồi
}

const MessageOptions = ({
    messageId,
    conversationId,
    isOwn,
    isPinned
}: MessageOptionsProps) => {

    //modal chuyển tiêp tn
    const [openForward, setOpenForward] = useState(false);

    //thu hồi
    const { unsendMessage, togglePinMessage, conversations } = useChatStore()
    const { user } = useAuthStore()

    const handleForward = () => {
        setOpenForward(true);
    };

    const handlePin = async () => {
        try {
            await togglePinMessage(messageId)
            if (isPinned) {
                toast.success("Đã bỏ ghim tin nhắn");
            }
            else {
                toast.success("Đã ghim tin nhắn");
            }

        } catch {
            toast.error("Không thể thực hiện");
        }
    };

    const handleRecall = async () => {
        try {
            await unsendMessage?.(messageId, conversationId);
        } catch {
            toast.error("Không thể thực hiện");
        }
    };

    // nếu message là của người bị hạn chế thì không hiện nút ghim
    const conversation = conversations.find(c => c._id === conversationId);

    const shouldShowPin = (() => {
        if (!conversation) return true;
        const me = conversation.participants.find(p => p._id === user?._id);
        const sender = conversation.participants.find(p => p._id !== me?._id);
        if (!sender) return true;
        return !me?.isRestricted;
    })();

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        className="
                        rounded-md p-1
                        text-muted-foreground
                        opacity-0 group-hover:opacity-100
                        hover:bg-muted
                        hover:text-foreground
                        transition
                    "
                        onClick={(e) => e.stopPropagation()}
                    >
                        <MoreVertical className="h-4 w-4" />
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    side={isOwn ? "left" : "right"}
                    align="center"
                    sideOffset={6}
                    className="
        min-w-40
        rounded-lg
        border
        shadow-lg
        bg-background
        backdrop-blur-md
        bg-opacity-100
    "
                    onClick={(e) => e.stopPropagation()}
                >
                    <DropdownMenuItem
                        onClick={handleForward}
                        className="flex items-center gap-2 cursor-pointer"
                    >
                        <CornerUpRight className="h-4 w-4" />
                        Chuyển tiếp
                    </DropdownMenuItem>

                    {shouldShowPin && (
                        <DropdownMenuItem
                            onClick={handlePin}
                            className="flex items-center gap-2 cursor-pointer"
                        >
                            <Pin className="h-4 w-4" />
                            {!isPinned ? "Ghim" : "Bỏ ghim"}
                        </DropdownMenuItem>
                    )}

                    {isOwn && (
                        <DropdownMenuItem
                            onClick={handleRecall}
                            className="flex items-center gap-2 cursor-pointer"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Thu hồi
                        </DropdownMenuItem>
                    )}

                </DropdownMenuContent>
            </DropdownMenu>

            <ForwardMessageModal
                open={openForward}
                onOpenChange={setOpenForward}
                messageId={messageId}

            />
        </>
    );
};

export default MessageOptions;