import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"

interface IUserAvatarProps {
    type: "sidebar" | "chat" | "profile";
    name: string; //hien thi khi kh có ảnh
    avatarUrl?: string;
    className?: string;
}

const UserAvatar = ({ type, name, avatarUrl, className }: IUserAvatarProps) => {

    const bgColor = !avatarUrl ? "bg-blue-500" : ""; //nền nếu kh có ảnh

    if (!name) {
        name = "ChitChat"
    }

    return (
        <Avatar className={cn(
            className ?? "",
            type === "sidebar" && "size-12 text-base",
            type === "chat" && "size-8 text-sm",
            type === "profile" && "size-24 text-3xl shadow-md"
        )}
        >
            <AvatarImage src={avatarUrl} alt={name} />
            {/*  hiển thị chữ cái đầu khi kh có ảnh */}
            <AvatarFallback className={`${bgColor} text-white font-semibold uppercase`} >
                {name.charAt(0)}
            </AvatarFallback>
        </Avatar>
    )
}

export default UserAvatar