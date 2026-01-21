import { useChatStore } from "@/stores/useChatStore";
import ChatWelcomeScreen from "./ChatWelcomeScreen";
import MessageItem from "./MessageItem";
import { useEffect, useState } from "react";

const ChatWindowBody = () => {
    const {
        activeConversationId,
        conversations,
        messages: allMessages,
    } = useChatStore();

    const messages = allMessages[activeConversationId!]?.items ?? []; //lấy messages của cuộc hội thoại đang active
    const selectedConvo = conversations.find((c) => c._id === activeConversationId);

    //ktr tn đã đọc hay chưa
    const [lastMessageStatus, setLastMessageStatus] = useState<"delivered" | "seen">("delivered")

    //chat status
    useEffect(() => {
        const lastMessage = selectedConvo?.lastMessage;
        if (!lastMessage) { return; }

        //đã có ai đó đọc r thì set thành seen
        const seenBy = selectedConvo?.seenBy ?? []
        setLastMessageStatus(seenBy.length > 0 ? "seen" : "delivered")
    }, [selectedConvo])

    if (!selectedConvo) {
        return <ChatWelcomeScreen />;
    }

    if (!messages?.length) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground ">
                Chưa có tin nhắn nào trong cuộc trò chuyện này.
            </div>
        );
    }

    return (
        <div className="p-4 bg-primary-foreground h-full flex flex-col overflow-hidden">
            <div className="flex flex-col overflow-y-auto overflow-x-hidden beautiful-scrollbar">
                {
                    messages.map((message, index) => (
                        <>
                            <MessageItem
                                key={message._id ?? index}
                                message={message}
                                index={index}
                                messages={messages}
                                selectedConvo={selectedConvo}
                                lastMessageStatus={lastMessageStatus}
                            />
                        </>
                    ))
                }
            </div>
        </div>
    );
};

export default ChatWindowBody;