import { useFriendStore } from "@/stores/useFriendStore";
import FriendRequestItem from "./FriendRequestItem";
import { Button } from "../ui/button";
import { toast } from "sonner";

const ReceivedRequests = () => {
  const { acceptRequest, declineRequest, loading, receivedList } = useFriendStore();

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
    try {
      await acceptRequest(requestId);
      toast.success("Đồng ý kết bạn thành công");
    } catch (error) {
      console.error(error);
    }
  };

  const handleDecline = async (requestId: string) => {
    try {
      await declineRequest(requestId);
      toast.info("Đã từ chối kết bạn");
    } catch (error) {
      console.error(error);
    }
  };

  console.log(receivedList)

  return (
    <div className="space-y-3 mt-4">
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
                disabled={loading}
                className="w-full"
              >
                {loading ? "Đang xử lý  ..." : "Chấp nhận"}
              </Button>
              <Button
                size="sm"
                variant="destructiveOutline"
                onClick={() => handleDecline(req._id)}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Đang xử lý..." : "Từ chối"}
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
