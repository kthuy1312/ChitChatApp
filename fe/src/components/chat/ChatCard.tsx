import { Card } from "@/components/ui/card"
import { cn, formatOnlineTime } from "@/lib/utils"
import { MoreHorizontal } from "lucide-react";

interface ChatCardProps {
    converId: string;
    name: string;
    isActive: boolean;
    onSelect: (id: string) => void;
    unreadCounts?: number;

    isMyLastMessage: boolean;
    isSeen: boolean;

    leftSection: React.ReactNode; //phan avatar
    subtitle: React.ReactNode; //phan hien thi preview tn cuoi 
}

const ChatCard = ({
    converId,
    name,
    isActive,
    onSelect,
    unreadCounts,
    isMyLastMessage,
    isSeen,
    leftSection,
    subtitle,
}: ChatCardProps) => {

    return (
        <Card key={converId}
            className={cn(
                "group relative border-none p-3 cursor-pointer transition-smooth glass hover:bg-muted/30",
                isActive &&
                "ring-2 ring-primary/50 bg-gradient-to-tr from-primary-glow/10 to-primary-foreground"
            )}
            onClick={() => onSelect(converId)}
        >

            <div className="absolute right-3 top-3 bottom-3 flex flex-col justify-between items-end">
                {/* MORE */}
                <button
                    className="
                          text-muted-foreground
                          opacity-0 group-hover:opacity-100
                          hover:text-foreground
                          transition
                      "
                    onClick={(e) => e.stopPropagation()}
                >
                    <MoreHorizontal className="h-4 w-4" />
                </button>

                {/* SEEN */}
                {isMyLastMessage && (
                    <span className="text-[11px] text-muted-foreground">
                        {isSeen ? "Seen" : "Delivered"}
                    </span>
                )}

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