import { useChatStore } from "@/stores/useChatStore";
import type { Conversation, Participant } from "@/types/chat";
import { SidebarTrigger } from "../ui/sidebar";
import { useAuthStore } from "@/stores/useAuthStore";
import { Separator } from "../ui/separator";
import UserAvatar from "./UserAvatar";
import StatusBadge from "./StatusBadge";
import GroupChatAvatar from "./GroupChatAvatar";
import { useSocketStore } from "@/stores/useSocketStore";
// Thay đổi import formatUserStatus thành useTimeAgo
import { useTimeAgo } from "@/lib/utils";
import { MoreVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog"; // Import Modal từ shadcn
import { Button } from "../ui/button";
import ConversationInfo from "./ConversationInfo";
import { useState } from "react";
import { chatThemes } from "@/chatThemes";
import { useDarkMode } from "@/hooks/useDarkMode";
const ChatWindowHeader = ({
  chat,
  scrollToPinnedRef,
}: {
  chat?: Conversation;
  scrollToPinnedRef?: React.MutableRefObject<any>;
}) => {
  const { activeConversationId } = useChatStore();
  const { user } = useAuthStore();
  const { onlineUsers, offlineRecords } = useSocketStore();
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);

  let otherUser: Participant | null = null;
  let isOnline = false;

  const currentChat = useChatStore((state) =>
    state.conversations.find((c) => c._id === activeConversationId),
  );

  const isDark = useDarkMode();



  if (currentChat && currentChat.type === "direct") {
    const otherUsers = currentChat.participants.filter(
      (p) => p._id !== user?._id,
    );
    otherUser = otherUsers.length > 0 ? otherUsers[0] : null;

    if (otherUser) {
      isOnline = onlineUsers.includes(otherUser._id);
    }
  }

  //coi bị hạn chế không để ẩn status online
  const isRestricted =
    currentChat?.participants?.some((p) => p.isRestricted) ?? false;

  // Nó sẽ tự động quản lý setInterval và trả về chuỗi "Hoạt động... trước" tự cập nhật
  const offlineTime =
    otherUser && !isRestricted
      ? offlineRecords[otherUser._id] || otherUser.offlineAt
      : null;
  const rawStatusText = useTimeAgo(isOnline, offlineTime ?? null);
  const statusText = isRestricted ? null : rawStatusText;

  if (!currentChat) {
    return (
      <header className="md:hidden sticky top-0 z-10 flex items-center gap-2 px-4 py-2 w-full">
        <SidebarTrigger className="-ml-1 text-foreground" />
      </header>
    );
  }

  if (currentChat.type === "direct" && (!user || !otherUser)) return null;

  //theme
  const themeKey = currentChat?.theme || "default";
  const theme = chatThemes[themeKey as keyof typeof chatThemes];

  const getColor = (key: string) => {
    return isDark
      ? theme[`${key}-dark` as keyof typeof theme] ||
          theme[key as keyof typeof theme]
      : theme[key as keyof typeof theme];
  };
  const bg = getColor("--background");

  //nickname
  const nickname = currentChat.participants.find(
    (p) => p._id === otherUser?._id,
  )?.nickname;

  return (
    <header
      className="sticky top-0 z-10 px-4 py-2 flex items-center justify-between"
      style={{
        background: bg?.includes("gradient") ? bg : `hsl(${bg})`,
        borderBottom: `1px solid hsl(${getColor("--chat-bubble-received")} / 0.3)`,
      }}
    >
      {" "}
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 text-foreground" />
        <Separator orientation="vertical" className="mr-2 h-4" />

        <div className="p-2 flex items-center gap-3">
          <div className="relative">
            {currentChat.type === "direct" ? (
              <>
                <UserAvatar
                  type={"sidebar"}
                  name={otherUser?.displayName || "ChitChat"}
                  avatarUrl={otherUser?.avatarUrl || undefined}
                />
                {!isRestricted && (
                  <StatusBadge
                    status={
                      onlineUsers.includes(otherUser?._id ?? "")
                        ? "online"
                        : "offline"
                    }
                  />
                )}
              </>
            ) : (
              <GroupChatAvatar
                participants={currentChat.participants}
                type="sidebar"
              />
            )}
          </div>

          <div className="flex flex-col">
            <h2 className="font-semibold text-foreground leading-tight">
              {currentChat.type === "direct"
                ? nickname || otherUser?.displayName
                : currentChat.group?.name}{" "}
            </h2>
            {currentChat.type === "direct" && (
              <span
                className={`text-[11px] ${isOnline ? "text-green-500 font-medium" : "text-muted-foreground"}`}
              >
                <span>{statusText}</span>
              </span>
            )}
          </div>
        </div>
      </div>
      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <MoreVertical className="size-5 text-muted-foreground" />
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-md h-[80vh] p-0 overflow-hidden sm:rounded-2xl border-none shadow-2xl">
          <DialogTitle className="sr-only"></DialogTitle>
          <ConversationInfo
            chat={currentChat}
            otherUser={otherUser}
            isOnline={isOnline}
            statusText={statusText}
            onPinnedMessageClick={(messageId: string) => {
              scrollToPinnedRef?.current?.(messageId);
              setIsInfoDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default ChatWindowHeader;
