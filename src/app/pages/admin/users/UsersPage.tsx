import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/features/users/api/use-users";
import type { User } from "@/types/entities/user";
import UserDialog from "./UserDialog";
import DeleteUserDialog from "./DeleteUserDialog";
import { useToast } from "@/hooks/use-toast";

export default function UsersPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const { data: usersResponse, isLoading, error} = useUsers();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const users = usersResponse?.result.items ?? [];
  const total = usersResponse?.result.total ?? 0;

  const handleCreate = async (data: any) => {
    try {
      await createMutation.mutateAsync(data);
      setIsCreateDialogOpen(false);
      toast({
        title: "Thành công",
        description: "Tạo người dùng thành công",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo người dùng",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editingUser) return;

    try {
      await updateMutation.mutateAsync({
        ...editingUser,
        ...data,
      });
      setEditingUser(null);
      toast({
        title: "Thành công",
        description: "Cập nhật người dùng thành công",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật người dùng",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;

    try {
      const result = await deleteMutation.mutateAsync(deletingUser.id);
      setDeletingUser(null);
      toast({
        title: "Thành công",
        description: result || "Xóa người dùng thành công",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa người dùng",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Người dùng</h2>
          <p className="text-muted-foreground">Quản lý tài khoản người dùng</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm người dùng
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách người dùng</CardTitle>
          <CardDescription>
            Danh sách tất cả người dùng trong hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-500">Lỗi khi tải danh sách người dùng: {error.message}</p>
            </div>
          )}

          {!isLoading && !error && users && users.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Không tìm thấy người dùng nào</p>
            </div>
          )}

          {!isLoading && !error && users && users.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên đăng nhập</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Ngày sinh</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.dob}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingUser(user);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingUser(user)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={5} className="text-right">
                    <span className="text-md text-muted-foreground">
                      Tổng số người dùng: {total}
                    </span>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </CardContent>
      </Card>

      <UserDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreate}
        isLoading={createMutation.isPending}
      />

      <UserDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
      if (!open) {
        // Đợi 300ms cho animation chạy xong rồi xóa data
        setTimeout(() => setEditingUser(null), 300);
      }
        }}
        user={editingUser}
        onSubmit={handleUpdate}
        isLoading={updateMutation.isPending}
      />

      <DeleteUserDialog
        open={!!deletingUser}
        onOpenChange={(open) => !open && setDeletingUser(null)}
        user={deletingUser}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
