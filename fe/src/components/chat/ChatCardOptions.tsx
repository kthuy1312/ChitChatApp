import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Pin,
  Archive,
  ShieldOff,
  LogOut,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface ChatCardOptionsProps {
  converId: string;
  isPinned?: boolean;
  onArchive?: (id: string) => void;
  onPin?: (id: string) => void;
  onRestrict?: (id: string) => void;
  onDelete?: (id: string) => void;
  onBlock?: (id: string) => void;
  onLeaveGroup?: (id: string) => void;

  isGroup?: boolean;
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
  const [openLeaveDialog, setOpenLeaveDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const handlePin = async () => {
    try {
      await onPin?.(converId);
      toast.success(
        isPinned ? "Đã bỏ ghim cuộc trò chuyện" : "Đã ghim cuộc trò chuyện",
      );
    } catch {
      toast.error("Không thể thực hiện thao tác");
    }
  };

  const handleArchive = async () => {
    try {
      await onArchive?.(converId);
      toast.success("Đã lưu trữ cuộc trò chuyện");
    } catch {
      toast.error("Không thể thực hiện thao tác");
    }
  };

  const handleRestrict = async () => {
    try {
      await onRestrict?.(converId);
      toast.success("Đã hạn chế người dùng");
    } catch (err) {
      console.error(err);
      toast.error("Không thể thực hiện thao tác");
    }
  };

  const handleLeaveGroup = async () => {
    try {
      await onLeaveGroup?.(converId);
      toast.success("Rời nhóm thành công");
      setOpenLeaveDialog(false);
    } catch (err) {
      console.error(err);
      toast.error("Không thể thực hiện thao tác");
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete?.(converId);
      toast.success("Xóa cuộc hội thoại thành công");
      setOpenDeleteDialog(false);
    } catch (err) {
      console.error(err);
      toast.error("Không thể thực hiện thao tác");
    }
  };

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
          onClick={() => handlePin()}
        >
          <Pin className="h-4 w-4" />
          {isPinned ? "Bỏ ghim" : "Ghim"}
        </DropdownMenuItem>

        <DropdownMenuItem
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => handleArchive()}
        >
          <Archive className="h-4 w-4" />
          <span>Lưu trữ</span>
        </DropdownMenuItem>

        {!isGroup && (
          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => handleRestrict()}
          >
            <ShieldOff className="h-4 w-4" />
            <span>Hạn chế</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />

        {isGroup && (
          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
            onClick={() => setOpenLeaveDialog(true)}
          >
            <LogOut className="h-4 w-4" />
            <span>Rời nhóm</span>
          </DropdownMenuItem>
        )}
        {/* 
                {!isGroup && (
                    <DropdownMenuItem
                        className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                        onClick={() => onBlock?.(converId)}
                    >
                        <Ban className="h-4 w-4" />
                        <span>Chặn</span>
                    </DropdownMenuItem>
                )} */}

        <DropdownMenuItem
          className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
          onClick={() => setOpenDeleteDialog(true)}
        >
          <Trash2 className="h-4 w-4" />
          <span>Xóa</span>
        </DropdownMenuItem>
      </DropdownMenuContent>

      {/* modal rời nhóm */}
      <AlertDialog open={openLeaveDialog} onOpenChange={setOpenLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn chắc chắn muốn rời nhóm?</AlertDialogTitle>
            <AlertDialogDescription>
              Sau khi rời nhóm bạn sẽ không còn nhận được tin nhắn từ nhóm này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveGroup}
              className="bg-red-400 hover:bg-red-500"
            >
              Rời nhóm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* modal xóa tn */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Bạn chắc chắn muốn xoá cuộc trò chuyện?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Sau khi xoá, bạn sẽ không còn thấy cuộc trò chuyện này nữa.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-400 hover:bg-red-500"
            >
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DropdownMenu>
  );
};

export default ChatCardOptions;
