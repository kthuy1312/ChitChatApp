import { useChatStore } from "@/stores/useChatStore"
import DirectMessageCard from "./DirectMessageCard";

const DirectMessageList = () => {
    const { conversations } = useChatStore();

    if (!conversations) return;
    const directconversations = conversations.filter((conver) => conver.type === 'direct')

    return (
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {
                directconversations.map((conver) => (
                    <DirectMessageCard conver={conver} key={conver._id}
                    />
                ))
            }
        </div>
    )
}

export default DirectMessageList