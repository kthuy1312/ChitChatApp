import { useFriendStore } from "@/stores/useFriendStore";
import FriendRequestItem from "./FriendRequestItem";
import { Clock } from "lucide-react";

const SentRequests = () => {
  const { sentList } = useFriendStore();

  if (!sentList || sentList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
        <p className="text-sm font-medium">
          Chưa có lời mời nào được gửi
        </p>
        <p className="text-xs text-muted-foreground max-w-[260px]">
          Khi bạn gửi lời mời kết bạn, trạng thái chờ phản hồi sẽ hiển thị tại đây
        </p>
      </div>
    );
  }


  return (
    <div className="space-y-3 mt-4">
      <>
        {sentList.map((req) => (
          <FriendRequestItem
            key={req._id}
            requestInfo={req}
            type="sent"
            actions={
              <div className="
                col-span-2
                w-full
                flex items-center justify-center gap-2
                rounded-lg
                bg-background/60
                backdrop-blur
                border
                px-3 py-2
                text-xs font-medium
                text-muted-foreground
              ">
                <Clock className="h-4 w-4 opacity-70" />
                Đang chờ phản hồi
              </div>
            }


          />
        ))}
      </>
    </div>
  );
};

export default SentRequests;
