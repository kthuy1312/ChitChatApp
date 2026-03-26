import { Heart, Loader2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { User } from "@/types/user";
import { useUserStore } from "@/stores/useUserStore";
import { useEffect, useState } from "react";

type EditableField = {
  key: keyof Pick<User, "displayName" | "username" | "email" | "phone">;
  label: string;
  type?: string;
};

const PERSONAL_FIELDS: EditableField[] = [
  { key: "displayName", label: "Tên hiển thị" },
  { key: "username", label: "Tên người dùng" },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Số điện thoại" },
];

type Props = {
  userInfo: User | null;
};
const PersonalInfoForm = ({ userInfo }: Props) => {
  const [formData, setFormData] = useState({
    displayName: "",
    username: "",
    phone: "",
    bio: "",
  });

  const { updateProfile } = useUserStore();
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (userInfo) {
      setFormData({
        displayName: userInfo.displayName || "",
        username: userInfo.username || "",
        phone: userInfo.phone || "",
        bio: userInfo.bio || "",
      });
    }
  }, [userInfo]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    setIsUpdating(true);
    await updateProfile(
      formData.username,
      formData.displayName,
      formData.phone,
      formData.bio
    );
    setIsUpdating(false);
  };

  if (!userInfo) return null;

  return (
    <Card className="glass-strong border-border/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="size-5 text-primary" />
          Thông tin cá nhân
        </CardTitle>
        <CardDescription>Cập nhật chi tiết cá nhân</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PERSONAL_FIELDS.map(({ key, label, type }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                type={type ?? "text"}
                disabled={key === "email" || isUpdating}
                //nếu là email thì dùng từ userInfo vì k cho sửa
                value={key === "email" ? (userInfo.email ?? "") : (formData[key as keyof typeof formData] ?? "")}
                onChange={handleInputChange}
                className={`glass-light border-border/30 ${key === "email" ? "bg-muted/50 cursor-not-allowed" : ""
                  }`}
              />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Giới thiệu</Label>
          <Textarea
            id="bio"
            rows={3}
            disabled={isUpdating}
            value={formData.bio}
            onChange={handleInputChange}
            className="glass-light border-border/30 resize-none"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isUpdating}
          className="w-full md:w-auto bg-gradient-primary hover:opacity-90 transition-opacity"
        >
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang lưu...
            </>
          ) : (
            "Lưu thay đổi"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoForm;
