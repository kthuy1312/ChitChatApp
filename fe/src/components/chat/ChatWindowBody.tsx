import { useChatStore } from "@/stores/useChatStore";
import ChatWelcomeScreen from "./ChatWelcomeScreen";
import MessageItem from "./MessageItem";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import InfiniteScroll from 'react-infinite-scroll-component'
import { Pin, X } from "lucide-react";
import { toast } from "sonner";
import { useSocketStore } from "@/stores/useSocketStore";
import { useAuthStore } from "@/stores/useAuthStore";

const ChatWindowBody = ({ scrollToPinnedRef, openPinnedModalRef }: { scrollToPinnedRef?: React.MutableRefObject<any>, openPinnedModalRef?: React.MutableRefObject<any> }) => {
    const {
        activeConversationId,
        conversations,
        messages: allMessages,
        fetchMessages,
    } = useChatStore();

    const { socket } = useSocketStore();
    const { user } = useAuthStore();

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

    //pin notification
    const [pinNotification, setPinNotification] = useState<{ type: "pin" | "unpin", senderName?: string } | null>(null)

    //hiện cho banner phần ghim
    const latestPinned = selectedConvo?.pinnedMessages
        ?.slice()
        .sort((a, b) => new Date(b.pinnedAt).getTime() - new Date(a.pinnedAt).getTime())?.[0];

    //scroll tới tin nhắn ghim khi click
    const scrollToPinned = async (messageId: string) => {
        const container = containerRef.current;
        if (!container || !activeConversationId) return;

        // Kiểm tra tin nhắn đã có trong DOM chưa
        let element = document.getElementById(`msg-${messageId}`);

        if (!element) {
            //Nếu chưa có thì load thêm tin nhắn cũ cho đến khi có hoặc hết
            let tries = 0;
            const maxTries = 20; //giới hạn tránh loop vô tận

            while (!element && tries < maxTries) {
                tries++;
                if (!hasMore) break; // hết messages thì thôi
                await fetchMessages(activeConversationId); //fetch thêm messages
                await new Promise(r => setTimeout(r, 50)); //chờ DOM render
                element = document.getElementById(`msg-${messageId}`);
            }
        }

        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });

            //highlight tạm để người dùng thấy
            element.classList.add("bg-black/10", "border", "border-white/50", "rounded-md");
            setTimeout(() => {
                element.classList.remove("bg-black/10", "border", "border-white/50", "rounded-md");
            }, 1200); // 1.2s
        } else {
            toast.error("Không tìm thấy tin nhắn ghim.");
        }
    };

    //lưu scrollToPinned function vào ref
    useEffect(() => {
        if (scrollToPinnedRef) {
            scrollToPinnedRef.current = scrollToPinned;
        }
    }, [scrollToPinnedRef, activeConversationId, hasMore]);


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
        <div className="relative p-4 bg-primary-foreground h-full flex flex-col overflow-hidden">
            {latestPinned && (
                <div
                    className="absolute top-0 left-0 right-0 bg-black/20 backdrop-blur-sm text-white p-2 mx-4 z-10 cursor-pointer flex items-center gap-2  rounded-sm"
                    onClick={() => scrollToPinned(latestPinned.messageId)}
                >
                    <div className=" bg-black/20 rounded-full p-1.5 flex items-center justify-center">
                        <Pin className="size-4 text-white fill-white" />
                    </div>
                    <span className="truncate">
                        {latestPinned.isUnsent ? "Tin nhắn đã thu hồi" : latestPinned.content}
                    </span>
                </div>
            )}
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