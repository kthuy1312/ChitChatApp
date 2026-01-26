import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Archive,
    ShieldOff,
    Ban,
    Settings,
} from "lucide-react";
import ArchivedChatList from "./ArchivedChatList";
import RestrictedChatList from "./RestrictedChatList";

interface ManageChatDialogProps {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
}

const ManageChatDialog = ({ open, setOpen }: ManageChatDialogProps) => {
    const [tab, setTab] = useState<"archived" | "restricted" | "blocked">(
        "archived"
    );

    useEffect(() => {
        if (!open) {
            setTab("archived");
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader className="pb-3 border-b border-primary/10">
                    <DialogTitle
                        className="
              flex items-center gap-2
              text-lg font-semibold
              bg-gradient-primary
              bg-clip-text
              text-transparent
            "
                    >
                        <Settings className="h-5 w-5 text-primary" />
                        Quản lý chat
                    </DialogTitle>
                </DialogHeader>

                <Tabs
                    value={tab}
                    onValueChange={(v) =>
                        setTab(v as "archived" | "restricted" | "blocked")
                    }
                    className="w-full"
                >
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="archived" className="flex items-center gap-1">
                            <Archive className="h-4 w-4" />
                            Lưu trữ
                        </TabsTrigger>

                        <TabsTrigger value="restricted" className="flex items-center gap-1">
                            <ShieldOff className="h-4 w-4" />
                            Hạn chế
                        </TabsTrigger>

                        <TabsTrigger value="blocked" className="flex items-center gap-1">
                            <Ban className="h-4 w-4" />
                            Chặn
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="archived" className="mt-4">
                        <div className="text-sm text-muted-foreground">
                            <ArchivedChatList />
                        </div>
                    </TabsContent>

                    <TabsContent value="restricted" className="mt-4">
                        <div className="text-sm text-muted-foreground">
                            <RestrictedChatList />
                        </div>
                    </TabsContent>

                    <TabsContent value="blocked" className="mt-4">
                        <div className="text-sm text-muted-foreground">
                            Danh sách người dùng đã chặn
                        </div>
                        {/* TODO: BlockedUserList */}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default ManageChatDialog;
