import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFriendStore } from "@/stores/useFriendStore";
import SentRequests from "./SentRequests";
import ReceivedRequests from "./ReceivedRequests";
import { Users } from "lucide-react";

interface FriendRequestDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const FriendRequestDialog = ({ open, setOpen }: FriendRequestDialogProps) => {
  const [tab, setTab] = useState("received");
  const { getAllFriendRequests } = useFriendStore();

  useEffect(() => {
    const loadRequest = async () => {
      try {
        await getAllFriendRequests();
      } catch (error) {
        console.error("Lỗi xảy ra khi load requests", error);
      }
    };

    loadRequest();
  }, []);

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
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
            <Users className="h-5 w-5 text-primary" />
            Lời mời kết bạn
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={setTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received">Đã nhận</TabsTrigger>
            <TabsTrigger value="sent">Đã gửi</TabsTrigger>
          </TabsList>

          {/*lời mời đã nhận */}
          <TabsContent value="received">
            <ReceivedRequests />
          </TabsContent>

          {/*lời mời đã gửi */}
          <TabsContent value="sent">
            <SentRequests />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default FriendRequestDialog;