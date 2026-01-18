import { Ellipsis } from "lucide-react";
import UserAvatar from "./UserAvatar";
import type { Participant } from "@/types/chat";

interface GroupChatAvatarProps {
    participants: Participant[];
    type: "chat" | "sidebar"
}

const GroupChatAvatar = ({ participants, type }: GroupChatAvatarProps) => {

    const avatars = [];
    const limit = Math.min(participants.length, 4) //số hình ava hiển thị

    for (let i = 0; i < limit; i++) {
        const member = participants[i]
        avatars.push(
            <UserAvatar
                key={i}
                type={type}
                name={member.displayName}
                avatarUrl={member.avatarUrl ?? undefined}
            />
        ) //them 1 component user avatar vao
    }

    return (
        <div className="relative flex -space-x-2 *:data-[slot=avatar]:ring-background *:data-[slot=avatar]:ring-2">
            {avatars}
            {/* dấu ... khi nhiều hơn 4 avatar */}
            {participants.length > limit && (
                <div className="flex items-center z-10 justify-center size-8 rounded-full bg-muted ring-2 ring-background text-muted-foreground">
                    <Ellipsis className="size-4" />
                </div>
            )}
        </div>
    )
}

export default GroupChatAvatar