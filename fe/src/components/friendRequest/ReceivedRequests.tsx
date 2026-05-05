import { useFriendStore } from "@/stores/useFriendStore";
import FriendRequestItem from "./FriendRequestItem";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { useState } from "react";

const ReceivedRequests = () => {
  const { acceptRequest, declineRequest, loading, receivedList } = useFriendStore();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (!receivedList || receivedList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
        <p className="text-sm font-medium">
          Không có lời mời kết bạn
        </p>
        <p className="text-xs text-muted-foreground max-w-[260px]">
          Khi ai đó gửi lời mời kết bạn, bạn sẽ thấy tại đây
        </p>
      </div>
    );
  }

  const handleAccept = async (requestId: string) => {
    setLoadingId(requestId);
    try {
      await acceptRequest(requestId);
      toast.success("Đồng ý kết bạn thành công");
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    setLoadingId(requestId);
    try {
      await declineRequest(requestId);
      toast.info("Đã từ chối kết bạn");
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-3 mt-4 max-h-[500px] overflow-y-auto pr-2 beautiful-scrollbar">
      {receivedList.map((req) => (
        <FriendRequestItem
          key={req._id}
          requestInfo={req}
          actions={
            <>
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleAccept(req._id)}
                disabled={loading && loadingId === req._id}
                className="w-full"
              >
                {loading && loadingId === req._id ? "Đang xử lý..." : "Chấp nhận"}
              </Button>
              <Button
                size="sm"
                variant="destructiveOutline"
                onClick={() => handleDecline(req._id)}
                disabled={loading && loadingId === req._id}
                className="w-full"
              >
                {loading && loadingId === req._id ? "Đang xử lý..." : "Từ chối"}
              </Button>
            </>
          }

          type="received"
        />
      ))}
    </div>
  );
};

export default ReceivedRequests;
