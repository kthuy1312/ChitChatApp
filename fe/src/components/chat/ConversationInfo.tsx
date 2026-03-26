import {
    Palette,      // Chủ đề
    UserCog,      // Biệt danh
    Images,       // Xem ảnh
    Pin,      // Tin nhắn đã ghim (dùng PushPin cho khác biệt)
    Search,       // Tìm kiếm
    Trash2,        // Xóa
    Users,
    User
} from "lucide-react"; import UserAvatar from "./UserAvatar";
import GroupChatAvatar from "./GroupChatAvatar";
import StatusBadge from "./StatusBadge";

const ConversationInfo = ({ chat, otherUser, isOnline, statusText }: any) => {
    return (
        <div className="flex flex-col overflow-hidden bg-background">
            <div className="relative flex flex-col items-center p-7 bg-gradient-to-b from-primary/10 via-background to-background border-b border-border/50">
                <div className="relative group">
                    {chat.type === "direct" ? (
                        <div className="relative">
                            <UserAvatar
                                type={"profile"}
                                name={otherUser?.displayName}
                                avatarUrl={otherUser?.avatarUrl}
                                className="h-28 w-28 text-3xl shadow-2xl border-4 border-background transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute bottom-2 right-2 scale-150">
                                <StatusBadge status={isOnline ? "online" : "offline"} />
                            </div>
                        </div>
                    ) : (
                        <div className="scale-150 py-6 transition-transform duration-300 group-hover:scale-[1.6]">
                            <GroupChatAvatar participants={chat.participants} type="sidebar" />
                        </div>
                    )}
                </div>

                <div className="text-center mt-3 space-y-1">
                    <h3 className="font-bold text-2xl tracking-tight text-foreground">
                        {chat.type === "direct" ? otherUser?.displayName : chat.group?.name}
                    </h3>
                    {chat.type === "direct" ? (
                        <p className={`text-sm font-semibold px-3 py-1 rounded-full inline-block ${isOnline ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}>
                            {statusText}
                        </p>
                    ) : (
                        <p className="text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full inline-block">
                            {chat.participants.length} thành viên
                        </p>
                    )}
                </div>
            </div>

            <div className="p-4 space-y-6 overflow-y-auto beautiful-scrollbar max-h-[60vh]">


                {/* Tùy chỉnh */}
                <section className="space-y-1">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-2 mb-2">Tùy chỉnh</h4>
                    <OptionItem
                        icon={<Palette className="size-5 " />}
                        label="Chủ đề"
                    />
                    <OptionItem
                        icon={<UserCog className="size-5 " />}
                        label="Biệt danh"
                    />
                </section>

                {chat.type === "direct" && (
                    <section className="pt-3 border-t border-border/40 space-y-1">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 ml-2 mb-2">
                            Thông tin
                        </h4>

                        <OptionItem
                            icon={<User className="size-5" />}
                            label="Xem trang cá nhân"
                        />
                    </section>
                )}
                {chat.type === "group" && (
                    <section className="pt-3 border-t border-border/40 space-y-1">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-2 mb-2">
                            Thông tin đoạn chat
                        </h4>
                        <OptionItem
                            icon={<Users className="size-5" />}
                            label="Thành viên trong nhóm"
                            badge={chat.participants.length.toString()}
                        />
                    </section>
                )}

                {/* Kho lưu trữ */}
                <section className="pt-3 border-t border-border/40 space-y-1">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-2 mb-2">Kho lưu trữ</h4>
                    <OptionItem
                        icon={<Images className="size-5 " />}
                        label="Xem ảnh"
                        badge="12"
                    />
                    <OptionItem
                        icon={<Pin className="size-5 " />}
                        label="Tin nhắn đã ghim"
                    />
                    <OptionItem
                        icon={<Search className="size-5 " />}
                        label="Tìm kiếm tin nhắn"
                    />
                </section>

                <section className=" border-t border-border/40 space-y-1">
                    <OptionItem
                        icon={<Trash2 className="size-5" />}
                        label="Xóa lịch sử trò chuyện"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    />
                </section>
            </div>
        </div>
    );
};

const OptionItem = ({ icon, label, className = "" }: any) => (
    <button className={`flex items-center gap-3 w-full p-3 hover:bg-accent rounded-xl transition-all font-medium text-sm ${className}`}>
        <div className="bg-muted p-2.5 rounded-full">{icon}</div>
        {label}
    </button>
);


export default ConversationInfo