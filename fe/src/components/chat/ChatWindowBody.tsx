import { useChatStore } from "@/stores/useChatStore";
import { useSocketStore } from "@/stores/useSocketStore";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Message } from "@/types/chat";
import ChatWelcomeScreen from "./ChatWelcomeScreen";
import MessageItem from "./MessageItem";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import InfiniteScroll from 'react-infinite-scroll-component'
import { Pin } from "lucide-react";
import { toast } from "sonner";
import { chatThemes } from "@/chatThemes";
import { useDarkMode } from "@/hooks/useDarkMode";

const ChatWindowBody = ({ scrollToPinnedRef }: { scrollToPinnedRef?: React.MutableRefObject<any> }) => {
    const {
        activeConversationId,
        conversations,
        messages: allMessages,
        fetchMessages,
    } = useChatStore();

    const isDark = useDarkMode();

    const messages = allMessages[activeConversationId!]?.items ?? []; //lấy messages của cuộc hội thoại đang active
    const selectedConvo = conversations.find((c) => c._id === activeConversationId);

    //lấy theme cho nền 
    const themeKey = selectedConvo?.theme || "default";
    const theme = chatThemes[themeKey as keyof typeof chatThemes];

    //dựa vào theme chính mà lấy màu cho theme chat
    const getBackgroundColor = () => {
        const bgKey = isDark ? "--background-dark" : "--background";
        return theme[bgKey as keyof typeof theme];
    };

    const bg = getBackgroundColor();

    const hasMore = allMessages[activeConversationId!]?.hasMore ?? false;
    const reversedMessages = [...messages].reverse();

    //khi ng dùng nhập tn
    const currentUserId = useAuthStore().user?._id;
    const typingUsers = useSocketStore((state) => state.typingUsers);
    const activeTypingUsers = (typingUsers[activeConversationId!] || []).filter(
        (userId: string) => userId !== currentUserId
    );

    const typingMessage: Message | null = activeTypingUsers.length > 0 && selectedConvo ? {
        _id: `typing-${selectedConvo._id}`,
        conversationId: selectedConvo._id,
        senderId: activeTypingUsers[0],
        content: "...",
        createdAt: new Date().toISOString(),
        isOwn: false,
    } as Message : null;

    const displayMessages = typingMessage
        ? [typingMessage, ...reversedMessages]
        : reversedMessages;

    //ref
    const messageEndRed = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const key = `chat-scroll-${activeConversationId}`
    const [showScrollDown, setShowScrollDown] = useState(false);

    //ktr tn đã đọc hay chưa
    const [lastMessageStatus, setLastMessageStatus] = useState<"delivered" | "seen">("delivered")

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
        if (!container || !activeConversationId) return;
        const isAtBottom = Math.abs(container.scrollTop) < 100;
        setShowScrollDown(!isAtBottom);

        sessionStorage.setItem(key, JSON.stringify({
            scrollTop: container.scrollTop,
            scrollHeight: container.scrollHeight
        }));
    };

    //hàm cuộn xuống đáy
    const scrollToBottom = () => {
        messageEndRed.current?.scrollIntoView({ behavior: "smooth" });
    };

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
            <div
                className="flex h-full items-center justify-center text-muted-foreground"
                style={{
                    background: bg?.includes("gradient")
                        ? bg
                        : `hsl(${bg})`
                }}
            >
                Chưa có tin nhắn nào trong cuộc trò chuyện này.
            </div>
        );
    }

    return (
        <div
            className="relative p-4 h-full flex flex-col overflow-hidden"
            style={{
                background: bg?.includes("gradient")
                    ? bg
                    : `hsl(${bg})`
            }}
        >
            {latestPinned && (
                <div
                    onClick={() => scrollToPinned(latestPinned.messageId)}
                    className="absolute top-0 left-0 right-0 p-2 mx-4 z-10 cursor-pointer flex items-center gap-2 rounded-sm backdrop-blur-sm border transition-all hover:shadow-md"
                    style={{
                        backgroundColor: `hsla(${isDark
                            ? theme["--background-pinned-dark"]
                            : theme["--background-pinned"]
                            } / 0.6)`,
                        borderColor: `hsl(${isDark
                            ? theme["--chat-bubble-received-dark"]
                            : theme["--chat-bubble-received"]
                            } / 0.6)`,
                    }}
                >
                    <div className="bg-black/20 rounded-full p-1.5 flex items-center justify-center flex-shrink-0">
                        <Pin className="size-4 text-white fill-white" />
                    </div>

                    {latestPinned.isUnsent ? (
                        <span className="truncate text-white italic">
                            Tin nhắn đã thu hồi
                        </span>
                    ) : latestPinned.imgUrl ? (
                        <div className="flex items-center gap-2 min-w-0">
                            <img
                                src={latestPinned.imgUrl}
                                alt="pinned-img"
                                className="w-8 h-8 rounded object-cover flex-shrink-0"
                            />
                            <span className="truncate text-white font-medium">
                                Ảnh
                            </span>
                        </div>
                    ) : (
                        <span className="truncate text-white font-medium">
                            {latestPinned.content}
                        </span>
                    )}
                </div>
            )}

            {showScrollDown && (
                <button
                    onClick={scrollToBottom}
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 p-1.5 rounded-full shadow-md border transition-all animate-bounce active:scale-95 hover:scale-110 flex items-center justify-center"
                    style={{
                        backgroundColor: `hsl(${isDark ? theme["--chat-bubble-sent-dark"] : theme["--chat-bubble-sent"]})`,
                        borderColor: `hsl(${isDark ? theme["--msg-status-seen-dark"] : theme["--msg-status-seen"]})`,
                        color: "white"
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14" height="14"
                        viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="3"
                        strokeLinecap="round" strokeLinejoin="round"
                    >
                        <path d="m7 13 5 5 5-5M7 6l5 5 5-5" />
                    </svg>
                </button>
            )}

            <div
                id="scrollableDiv"
                ref={containerRef}
                onScroll={handleScrollSave}
                className="flex flex-col-reverse overflow-y-auto overflow-x-hidden beautiful-scrollbar"
            >

                <div ref={messageEndRed}></div>

                <InfiniteScroll
                    dataLength={displayMessages.length}
                    next={fetchMoreMessages}
                    hasMore={hasMore}
                    scrollableTarget="scrollableDiv"
                    loader={<p>Đang tải...</p>}
                    inverse={true}
                    style={{ display: "flex", flexDirection: "column-reverse", overflow: "visible", marginBottom: "8px" }}
                >
                    {
                        displayMessages.map((message, index) => (
                            <MessageItem
                                key={message._id ?? index}
                                message={message}
                                index={index}
                                messages={displayMessages}
                                selectedConvo={selectedConvo}
                                lastMessageStatus={lastMessageStatus}
                                isTyping={message._id.toString().startsWith("typing-")}
                            />
                        ))
                    }
                </InfiniteScroll>

            </div>
        </div>
    );
};

export default ChatWindowBody;