import { useChatStore } from "@/stores/useChatStore"
import ChatWelcomeScreen from "./ChatWelcomeScreen"
import { SidebarInset } from "../ui/sidebar"
import ChatWindowHeader from "./ChatWindowHeader"
import ChatWindowBody from "./ChatWindowBody"
import MessageInput from "./MessageInput"
import { useEffect, useRef } from "react"
import ChatWindowSkeleton from "../skeleton/ChatWindowSkeleton"
import { chatThemes } from "@/chatThemes"
import { useDarkMode } from "@/hooks/useDarkMode"

const ChatWindowLayout = () => {

    const { activeConversationId, conversations, messageLoading: loading, markAsSeen } = useChatStore()
    const scrollToPinnedRef = useRef<((messageId: string) => void) | undefined>(undefined);
    const selectedConver = conversations.find((c) => c._id === activeConversationId) ?? null
    const isDark = useDarkMode();

    const themeKey = selectedConver?.theme || "default";
    const theme = chatThemes[themeKey as keyof typeof chatThemes];

    const getThemeVariables = () => {
        const vars: Record<string, string> = {};
        Object.entries(theme).forEach(([key, value]) => {
            const isDarkKey = key.endsWith('-dark'); // ktra có phải biến dark kh

            if (isDarkKey) {
                const baseName = key.slice(0, -5); //bỏ '-dark'
                //nếu đang ở dark  mode
                if (isDark) {
                    vars[baseName] = value as string;
                }
            } else {
                //nếu light mode
                if (!isDark) {
                    vars[key] = value as string;
                }
            }
        });
        return vars as React.CSSProperties;
    };

    //seen
    useEffect(() => {
        if (!selectedConver) { return; }

        const markSeen = async () => {
            try {
                await markAsSeen();
            } catch (error) {
                console.error("lỗi khi markSeen", error);
            }
        }

        markSeen();

    }, [markAsSeen, selectedConver])

    if (!selectedConver) {
        return <ChatWelcomeScreen />
    }

    if (loading) {
        return <ChatWindowSkeleton />
    }

    return (
        <div style={getThemeVariables()} className="w-full h-full">
            <SidebarInset className="flex flex-col h-full flex-1 w-full overflow-hidden rounded-sm shadow-md">
                {/* Header */}
                <ChatWindowHeader chat={selectedConver} scrollToPinnedRef={scrollToPinnedRef} />

                {/* Body */}
                <div className="flex-1 overflow-y-auto bg-primary-foreground">
                    <ChatWindowBody scrollToPinnedRef={scrollToPinnedRef} />
                </div>

                {/* Footer */}
                <MessageInput selectedConvo={selectedConver} />
            </SidebarInset>
        </div>
    )
}

export default ChatWindowLayout