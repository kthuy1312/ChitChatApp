import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
    Pin,
    Archive,
    ShieldOff,
    LogOut,
    Ban,
    Trash2,
    MoreHorizontal
} from "lucide-react"

interface ChatCardOptionsProps {
    converId: string
    isPinned?: boolean
    onArchive?: (id: string) => void
    onPin?: (id: string) => void
    onRestrict?: (id: string) => void
    onDelete?: (id: string) => void
    onBlock?: (id: string) => void
    onLeaveGroup?: (id: string) => void

    isGroup?: boolean
}

const ChatCardOptions = ({
    converId,
    isPinned,
    onArchive,
    onPin,
    onRestrict,
    onDelete,
    onBlock,
    onLeaveGroup,
    isGroup = false,
}: ChatCardOptionsProps) => {

    return (
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
                    <MoreHorizontal className="h-4 w-4" />
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                side="right"
                align="start"
                sideOffset={8}
                className="
                       min-w-56
                       rounded-lg
                       bg-[hsl(var(--popover))]
                       text-[hsl(var(--popover-foreground))]
                       border
                       shadow-xl
                         "
                onClick={(e) => e.stopPropagation()}
            >
                <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => onPin?.(converId)}
                >
                    <Pin className="h-4 w-4" />
                    {isPinned ? "Bỏ ghim" : "Ghim"}
                </DropdownMenuItem>

                <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => onArchive?.(converId)}
                >
                    <Archive className="h-4 w-4" />
                    <span>Lưu trữ</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => onRestrict?.(converId)}
                >
                    <ShieldOff className="h-4 w-4" />
                    <span>Hạn chế</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {isGroup && (
                    <DropdownMenuItem
                        className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                        onClick={() => onLeaveGroup?.(converId)}
                    >
                        <LogOut className="h-4 w-4" />
                        <span>Rời nhóm</span>
                    </DropdownMenuItem>
                )}

                <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                    onClick={() => onBlock?.(converId)}
                >
                    <Ban className="h-4 w-4" />
                    <span>Chặn</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                    onClick={() => onDelete?.(converId)}
                >
                    <Trash2 className="h-4 w-4" />
                    <span>Xóa</span>
                </DropdownMenuItem>
            </DropdownMenuContent>


        </DropdownMenu>
    )
}

export default ChatCardOptions
