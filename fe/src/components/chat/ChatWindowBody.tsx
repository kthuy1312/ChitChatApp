import { useChatStore } from "@/stores/useChatStore";
import ChatWelcomeScreen from "./ChatWelcomeScreen";
import MessageItem from "./MessageItem";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import InfiniteScroll from 'react-infinite-scroll-component'

const ChatWindowBody = () => {
    const {
        activeConversationId,
        conversations,
        messages: allMessages,
        fetchMessages,
    } = useChatStore();

    const messages = allMessages[activeConversationId!]?.items ?? []; //lấy messages của cuộc hội thoại đang active
    const selectedConvo = conversations.find((c) => c._id === activeConversationId);

    const hasMore = allMessages[activeConversationId!]?.hasMore ?? false;
    const reversedMessages = [...messages].reverse();

    //ref
    const messageEndRed = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const key = `chat-scroll-${activeConversationId}`

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

    //kéo xuống dưới khi load comversation
    useLayoutEffect(() => {

        if (!messageEndRed.current) {
            return;
        }

        messageEndRed.current.scrollIntoView({
            block: "end"
        })
    }, [activeConversationId])

    //tải thêm tn khi ng dùng load lên trên
    const fetchMoreMessages = async () => {

        if (!activeConversationId) { return; }

        try {
            await fetchMessages(activeConversationId)
        } catch (error) {
            console.error("lỗi xảy ra khi fetch thêm tin nhắn", error)
        }
    }

    //lưu vị trí cuộn hiện tại 
    const handleScrollSave = () => {
        const container = containerRef.current;
        if (!container || !activeConversationId) {
            return;
        }

        sessionStorage.setItem(key, JSON.stringify({
            scrollTop: container.scrollTop, //vị trí cuộn hiện tại
            scrollHeight: container.scrollHeight //tổng chiều cao có thể cuộn được
        }))
    }

    //cuộn tới vị trí đã lưu
    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const item = sessionStorage.getItem(key);
        if (item) {
            const { scrollTop } = JSON.parse(item);
            requestAnimationFrame(() => {
                container.scrollTop = scrollTop
            })
        }
    }, [messages.length])

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
            <div
                id="scrollableDiv"
                ref={containerRef}
                onScroll={handleScrollSave}
                className="flex flex-col-reverse overflow-y-auto overflow-x-hidden beautiful-scrollbar"
            >

                <div ref={messageEndRed}></div>

                <InfiniteScroll
                    dataLength={messages.length}
                    next={fetchMoreMessages}
                    hasMore={hasMore}
                    scrollableTarget="scrollableDiv"
                    loader={<p>Đang tải...</p>}
                    inverse={true}
                    style={{ display: "flex", flexDirection: "column-reverse", overflow: "visible" }}
                >
                    {
                        reversedMessages.map((message, index) => (
                            <>
                                <MessageItem
                                    key={message._id ?? index}
                                    message={message}
                                    index={index}
                                    messages={reversedMessages}
                                    selectedConvo={selectedConvo}
                                    lastMessageStatus={lastMessageStatus}
                                />
                            </>
                        ))
                    }
                </InfiniteScroll>
            </div>
        </div>
    );
};

export default ChatWindowBody;