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

interface MessageOptionsProps {
    messageId: string;
    isOwn?: boolean;

    onForward?: (id: string) => void;
    onPin?: (id: string) => void;
    onDelete?: (id: string) => void;
    onRecall?: (id: string) => void; // thu hồi
}

const MessageOptions = ({
    messageId,
    isOwn,
    onForward,
    onPin,
    onRecall,
}: MessageOptionsProps) => {

    //modal chuyển tiêp tn
    const [openForward, setOpenForward] = useState(false);

    const handleForward = () => {
        setOpenForward(true);
    };

    const handlePin = async () => {
        try {
            await onPin?.(messageId);
            toast.success("Đã ghim tin nhắn");
        } catch {
            toast.error("Không thể thực hiện");
        }
    };

    const handleRecall = async () => {
        try {
            await onRecall?.(messageId);
            toast.success("Đã thu hồi tin nhắn");
        } catch {
            toast.error("Không thể thực hiện");
        }
    };


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

                    <DropdownMenuItem
                        onClick={handlePin}
                        className="flex items-center gap-2 cursor-pointer"
                    >
                        <Pin className="h-4 w-4" />
                        Ghim
                    </DropdownMenuItem>

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
                onSend={async (ids) => {
                    console.log("forward to:", ids);
                    await new Promise(r => setTimeout(r, 1000)); // fake API
                }}
            />
        </>
    );
};

export default MessageOptions;