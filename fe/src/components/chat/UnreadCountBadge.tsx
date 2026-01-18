import { Badge } from "../ui/badge";

const UnreadCountBadge = ({ unreadCounts }: { unreadCounts: number }) => {
    return (
        <div className="pulse-ring absolute z-20 -top-1 -right-1">
            <Badge
                className="
                     h-5 min-w-5 px-1
                         flex items-center justify-center
                         text-[10px] leading-none
                         bg-gradient-chat
                         border border-background
                    "
            >
                {unreadCounts > 9 ? "9+" : unreadCounts}
            </Badge>
        </div>
    );
};

export default UnreadCountBadge;