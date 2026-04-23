import { useFriendStore } from "@/stores/useFriendStore";
import { DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { MessageCircleMore, Users } from "lucide-react";
import { Card } from "../ui/card";
import UserAvatar from "../chat/UserAvatar";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useMemo } from "react";

const FriendListModal = () => {
  const { friends } = useFriendStore();
  const { createConversation, conversations } = useChatStore();
  const { user } = useAuthStore();

  const handleAddConversation = async (friendId: string) => {
    await createConversation("direct", "", [friendId]);
  };

  const getNickname = (friendId: string) => {
    if (!user?._id) return null;

    const convo = conversations.find(c =>
      c.type === "direct" &&
      c.participants.some(p => p._id === user._id) &&
      c.participants.some(p => p._id === friendId)
    );

    return convo?.participants.find(p => p._id === friendId)?.nickname || null;
  };

  const filteredFriends = useMemo(() => {
    if (!user?._id) return [];

    return friends.filter(friend => {
      // tìm conversation direct giữa mình và friend
      const convo = conversations.find(c =>
        c.type === "direct" &&
        c.participants.some(p => p._id === user._id) &&
        c.participants.some(p => p._id === friend._id)
      );

      // Nếu có conversation, kiểm tra isRestricted
      if (convo) {
        const me = convo.participants.find(p => p._id === user._id);
        return me && !me.isRestricted;
      }

      // Nếu chưa có conversation, vẫn hiển thị bạn bè
      return true;
    });
  }, [friends, conversations, user?._id]);

  return (
    <DialogContent className="glass max-w-md">
      <DialogHeader className="pb-4 border-b border-border/40">
        <DialogTitle className="flex items-center gap-3 text-lg font-semibold">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <MessageCircleMore className="size-5" />
          </span>

          <div className="flex flex-col">
            <span className="capitalize">Bắt đầu hội thoại mới</span>
            <span className="text-xs font-normal text-muted-foreground">
              Chọn bạn bè để nhắn tin ngay
            </span>
          </div>
        </DialogTitle>
      </DialogHeader>

      {/* friends list */}
      <div className="space-y-4">
        <h1 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          danh sách bạn bè
        </h1>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {filteredFriends.map((friend) => {
            const nickname = getNickname(friend._id);

            return (
              <Card
                onClick={() => handleAddConversation(friend._id)}
                key={friend._id}
                className="p-3 cursor-pointer transition-smooth hover:shadow-soft glass hover:bg-muted/30 group/friendCard"
              >
                <div className="flex items-center gap-3">
                  {/* avatar */}
                  <div className="relative">
                    <UserAvatar
                      type="sidebar"
                      name={friend.displayName}
                      avatarUrl={friend.avatarUrl}
                    />
                  </div>

                  {/* info */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <h2 className="font-semibold text-sm truncate">
                      {nickname || friend.displayName}
                    </h2>

                    {nickname && (
                      <span className="text-xs text-muted-foreground truncate">
                        {friend.displayName}
                      </span>
                    )}

                    <span className="text-xs text-muted-foreground truncate">
                      @{friend.username}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}

          {friends.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted/40 text-muted-foreground ring-1 ring-border/40">
                <Users className="size-7 opacity-70" />
              </div>

              <p className="text-sm font-medium text-foreground">
                Chưa có bạn bè nào
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Thêm bạn vô để bắt đầu trò chuyện nha
              </p>
            </div>
          )}

        </div>
      </div>
    </DialogContent>
  );
};

export default FriendListModal;
