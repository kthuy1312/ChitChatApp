import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import ChatCardOptions from "./ChatCardOptions";
import { Pin } from "lucide-react";
import { useChatStore } from "@/stores/useChatStore";

interface ChatCardProps {
    converId: string;
    isPinned?: boolean;
    name: string;
    isActive: boolean;
    onSelect: (id: string) => void;
    unreadCounts?: number;

    leftSection: React.ReactNode; //phan avatar
    subtitle: React.ReactNode; //phan hien thi preview tn cuoi 

    isGroup?: boolean
}

const ChatCard = ({
    converId,
    isPinned,
    name,
    isActive,
    onSelect,
    unreadCounts,
    leftSection,
    subtitle,
    isGroup = false,
}: ChatCardProps) => {

    const { togglePin, toggleArchive, toggleRestrict } = useChatStore()

    return (
        <Card
            key={converId}
            className={cn(
                "group relative border-none p-3 cursor-pointer transition-smooth glass hover:bg-muted/30",
                isActive &&
                "ring-2 ring-primary/50 bg-gradient-to-tr from-primary-glow/10 to-primary-foreground"
            )}
            onClick={() => onSelect(converId)}
        >

            {isPinned && (
                <div
                    className="
                            absolute
                            -top-2
                            -left-2
                            z-10
                            bg-background
                            rounded-full
                            p-1
                            shadow-md
                            rotate-[-20deg]
                         "
                >
                    <Pin
                        className="h-3.5 w-3.5 text-primary"
                        strokeWidth={2.3}
                    />
                </div>
            )}

            <div className="absolute bottom-2 right-2">
                <ChatCardOptions
                    converId={converId}
                    isPinned={isPinned}
                    isGroup={isGroup}
                    onArchive={(id) => toggleArchive(id)}
                    onPin={(id) => togglePin(id)}
                    onRestrict={(id) => toggleRestrict(id)}
                    onDelete={(id) => console.log("delete", id)}
                    onBlock={(id) => console.log("block", id)}
                    onLeaveGroup={(id) => console.log("leave group", id)}
                />
            </div>

            <div className="flex items-center gap-3">
                <div className="relative">{leftSection}</div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <h3
                            className={cn(
                                "font-semibold text-sm truncate",
                                unreadCounts && unreadCounts > 0 && "text-foreground"
                            )}
                        >
                            {name}
                        </h3>

                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 flex-1 min-w-0 pr-10">
                            {subtitle}
                        </div>
                    </div>

                </div>
            </div>
        </Card>
    )
}

export default ChatCard