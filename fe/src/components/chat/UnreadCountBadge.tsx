import { Badge } from "../ui/badge"

const UnreadCountBadge = ({ unreadCounts }: { unreadCounts: number }) => {
    return (
        <div className="pulse-ring absolute z-20 -top-1 -right-1">
            <Badge className="size-5 text-xs bg-gradient-chat border border-background">
                {unreadCounts > 9 ? "9+" : unreadCounts}
            </Badge>
        </div>
    )
}

export default UnreadCountBadge