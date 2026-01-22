import { MessageCircle } from "lucide-react";
import { useChatStore } from "@/stores/useChatStore";
import DirectMessageCard from "./DirectMessageCard";

const DirectMessageList = () => {
    const { conversations } = useChatStore();

    if (!conversations) return null;

    const directConversations = conversations.filter(
        (conver) => conver.type === "direct"
    );

    if (directConversations.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground shadow-sm">
                        <MessageCircle className="h-7 w-7" />
                    </div>

                    <div className="space-y-1">
                        <p className="text-sm font-medium">
                            Chưa có cuộc trò chuyện nào
                        </p>
                        <p className="text-xs text-muted-foreground max-w-[220px]">
                            Bắt đầu nhắn tin riêng với bạn bè để kết nối nhanh hơn
                        </p>
                    </div>

                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {directConversations.map((conver) => (
                <DirectMessageCard
                    conver={conver}
                    key={conver._id}
                />
            ))}
        </div>
    );
};

export default DirectMessageList;
