import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Search, Ellipsis, Loader2 } from "lucide-react";
import { useChatStore } from "@/stores/useChatStore";
import type { Conversation, Participant } from "@/types/chat";
import { chatService } from "@/services/chatService";

/* 🔥 Avatar group viết inline luôn */
const GroupMiniAvatar = ({ participants }: { participants: Participant[] }) => {
  const limit = Math.min(participants.length, 4);

  return (
    <div className="relative flex -space-x-2">
      {participants.slice(0, limit).map((member, index) => (
        <img
          key={index}
          src={member.avatarUrl || "/default-avatar.png"}
          alt={member.displayName}
          className="w-8 h-8 rounded-full object-cover ring-2 ring-background"
        />
      ))}

      {/* nếu >4 thì hiện ... */}
      {participants.length > limit && (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground ring-2 ring-background">
          <Ellipsis className="size-4" />
        </div>
      )}
    </div>
  );
};

const SearchGroupChatModal = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [filteredGroups, setFilteredGroups] = useState<Conversation[]>([]);

  const { setActiveConversation } = useChatStore();

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      try {
        const groups = await chatService.searchGroupChats(search);
        setFilteredGroups(groups);
      } catch (error) {
        console.error("Lỗi khi tìm kiếm nhóm", error);
        setFilteredGroups([]);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchGroups();
    }
  }, [search, open]);

  const handleSelectGroup = async (group: Conversation) => {
    const store = useChatStore.getState();
    const exists = store.conversations.find((c) => c._id === group._id);
    if (!exists) {
        useChatStore.setState((state) => ({
            conversations: [group, ...state.conversations]
        }));
    }
    
    setActiveConversation(group._id);
    setOpen(false);
    setSearch("");

    // Fetch messages if not already loaded
    if (!store.messages[group._id]) {
      await store.fetchMessages(group._id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* nút mở */}
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="flex justify-center items-center w-8 h-8 rounded-full hover:bg-sidebar-accent transition cursor-pointer"
        >
          <Search className="size-4" />
        </Button>
      </DialogTrigger>

      {/* modal */}
      <DialogContent className="sm:max-w-[425px] border-none">
        <DialogHeader>
          <DialogTitle className="capitalize">tìm nhóm chat</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Nhập tên nhóm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* list */}
          <div className="max-h-60 overflow-y-auto space-y-2">
            {loading ? (
              <div className="flex justify-center py-4">
                  <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : filteredGroups.length > 0 ? (
              filteredGroups.map((group) => (
                <div
                  key={group._id}
                  onClick={() => handleSelectGroup(group)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent cursor-pointer transition"
                >
                  {/* 🔥 avatar group xịn */}
                  <GroupMiniAvatar participants={group.participants} />

                  <div className="flex flex-col">
                    <p className="font-medium">{group.group?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {group.participants?.length || 0} thành viên
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                Không tìm thấy nhóm
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchGroupChatModal;
