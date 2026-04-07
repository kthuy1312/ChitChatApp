import { useState } from "react";
import { Shield } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // giả sử bạn có component Input
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";

const PrivacySettings = () => {
  const changePassword = useAuthStore((state) => state.changePassword);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmNewPwd, setConfirmNewPwd] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (newPwd !== confirmNewPwd) {
      toast.error("Mật khẩu mới không khớp");
      return;
    }

    setLoading(true);
    const result = await changePassword(oldPwd, newPwd, confirmNewPwd);

    if (result.success) {
      toast.success(result.message);
      setIsChangingPassword(false);
      setOldPwd("");
      setNewPwd("");
      setConfirmNewPwd("");

    } else {
      toast.error(result.message);
    }

    setLoading(false);
  };

  return (
    <Card className="glass-strong border-border/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Quyền riêng tư & Bảo mật
        </CardTitle>
        <CardDescription>
          {isChangingPassword
            ? "Điền thông tin để đổi mật khẩu"
            : "Quản lý cài đặt quyền riêng tư và bảo mật của bạn"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {isChangingPassword ? (
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Mật khẩu hiện tại"
              value={oldPwd}
              onChange={(e) => setOldPwd(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Mật khẩu mới"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Nhập lại mật khẩu mới"
              value={confirmNewPwd}
              onChange={(e) => setConfirmNewPwd(e.target.value)}
            />

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsChangingPassword(false)}
              >
                Huỷ
              </Button>
              <Button disabled={loading} onClick={handleChangePassword}>
                {loading ? "Đang xử lý..." : "Xác nhận"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start glass-light border-border/30 hover:text-warning"
              onClick={() => setIsChangingPassword(true)}
            >
              <Shield className="h-4 w-4 mr-2" />
              Đổi mật khẩu
            </Button>
          </div>
        )}

        <div className="pt-4 border-t border-border/30">
          <h4 className="font-medium mb-3 text-destructive/90">Khu vực nguy hiểm</h4>
          <Button variant="destructive" className="w-full">
            Xoá tài khoản
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrivacySettings;