import { useRef, useState } from "react";
import { Button } from "../ui/button";
import { Camera, Loader2 } from "lucide-react";
import { useUserStore } from "@/stores/useUserStore";
import { toast } from "sonner";

const AvatarUploader = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { updateAvatarUrl } = useUserStore();
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    if (loading) return;
    fileInputRef.current?.click();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      toast.info("Đang tải ảnh lên, vui lòng chờ một chút...");

      await updateAvatarUrl(formData);

      toast.success("Cập nhật ảnh đại diện thành công 🎉");
    } catch (error) {
      console.error(error);
      toast.error("Tải ảnh thất bại, vui lòng thử lại");
    } finally {
      setLoading(false);
      e.target.value = ""; // reset input để upload lại cùng ảnh
    }
  };

  return (
    <>
      <Button
        size="icon"
        variant="secondary"
        onClick={handleClick}
        disabled={loading}
        className="absolute -bottom-2 -right-2 size-9 rounded-full shadow-md transition duration-300
                   hover:bg-background disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Camera className="size-4" />
        )}
      </Button>

      <input
        type="file"
        hidden
        ref={fileInputRef}
        accept="image/*"
        onChange={handleUpload}
      />
    </>
  );
};

export default AvatarUploader;
