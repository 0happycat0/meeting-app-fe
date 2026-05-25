import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { useUsers } from "@/features/users/api/use-users";
import { Spinner } from "@/components/ui/spinner";
export default function AdminDashboard() {
  const { data: usersResponse, isLoading, error } = useUsers();
  const totalUsers = usersResponse?.result.total ?? 0;

  let totalContent;

  if (isLoading) {
    totalContent = <Spinner />;
  } else if (error) {
    totalContent = "-";
  } else {
    totalContent = <div className="text-2xl font-bold">{totalUsers}</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Chào mừng đến với trang quản trị</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số người dùng</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {totalContent}
            <p className="text-xs text-muted-foreground">
              Quản lý người dùng trong mục Người dùng
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
