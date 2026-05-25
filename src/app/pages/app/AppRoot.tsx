import { useEffect, useState } from "react";
import keycloak from "@/config/keycloak";
import { fetchUsers } from "@/features/users/api/users";
import type { User } from "@/types/entities/user";
import { useUsers } from "@/features/users/api/use-users";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function AppRoot() {
  const { data: usersResponse, isLoading, error: errors } = useUsers();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const users = usersResponse?.result.items ?? [];
  useEffect(() => {
    // Chỉ gọi API nếu keycloak đã khởi tạo xong và user đã đăng nhập
    if (keycloak.authenticated) {
      const loadUsers = async () => {
        setLoading(true);
        console.log(keycloak.token);
        try {
          console.log("Danh sách users từ backend:", users);
        } catch (err: any) {
          setError(err.message || "Có lỗi xảy ra khi lấy dữ liệu");
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      loadUsers();
    }
  }, [keycloak.authenticated]); // Chạy lại effect nếu trạng thái auth thay đổi

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Trang chủ / Root</h1>

      {!keycloak.authenticated ? (
        <p>Bạn chưa đăng nhập.</p>
      ) : (
        <div>
          <p>Chào mừng, đã xác thực thành công!</p>

          <h2 className="text-xl mt-6 border-b pb-2">
            Danh sách Users từ Backend:
          </h2>
          {loading && <p>Đang tải...</p>}
          {error && <p className="text-red-500">{error}</p>}

          <ul className="mt-4 list-disc pl-5">
            {users?.map((user, index) => (
              <li key={index}>{JSON.stringify(user)}</li>
            ))}
          </ul>
          <Button onClick={logout}>
            Logout
          </Button>
        </div>
      )}
    </div>
  );
}
