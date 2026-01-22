import { Card } from "@/components/ui/card"
import { cn, formatOnlineTime } from "@/lib/utils"
import ChatCardOptions from "./ChatCardOptions";

interface ChatCardProps {
    converId: string;
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
    name,
    isActive,
    onSelect,
    unreadCounts,
    leftSection,
    subtitle,
    isGroup = false,
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
                <ChatCardOptions
                    converId={converId}
                    isGroup={isGroup}
                    onArchive={(id) => console.log("archive", id)}
                    onPin={(id) => console.log("pin", id)}
                    onRestrict={(id) => console.log("restrict", id)}
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