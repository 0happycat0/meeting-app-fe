import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, InputPassword } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { User } from "@/types/entities/user";
import { DatePickerInput } from "@/components/DatePickerInput";

const baseUserSchema = z.object({
  username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
  email: z.string().email("Địa chỉ email không hợp lệ"),
  firstName: z.string().min(1, "Vui lòng nhập tên"),
  lastName: z.string().min(1, "Vui lòng nhập họ"),
  dob: z.string().min(1, "Vui lòng chọn ngày sinh"),
});

const createUserSchema = baseUserSchema.extend({
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

// cho phép mật khẩu là chuỗi rỗng 
const updateUserSchema = baseUserSchema.extend({
  password: z.union([
    z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    z.literal(""), // Chấp nhận chuỗi rỗng
  ]).optional(),
});

type UserFormData = z.infer<typeof updateUserSchema>;

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onSubmit: (data: UserFormData) => void;
  isLoading?: boolean;
}

export default function UserDialog({
  open,
  onOpenChange,
  user,
  onSubmit,
  isLoading,
}: Readonly<UserDialogProps>) {
  const isEditing = !!user;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      dob: "",
    },
  });

  const dobValue = watch("dob");

  useEffect(() => {
    if (user) {
      reset({
        username: user.username,
        email: user.email,
        password: "",
        firstName: user.firstName,
        lastName: user.lastName,
        dob: user.dob,
      });
    } else {
      reset({
        username: "",
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        dob: "",
      });
    }
  }, [user, reset]);

  const handleFormSubmit = (data: UserFormData) => {
    const submitData = { ...data };

    // nếu password trống và đang ở chế độ edit thì xóa
    if (isEditing && submitData.password === "") {
      delete submitData.password;
    }

    onSubmit(submitData);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Chỉnh sửa người dùng" : "Tạo người dùng mới"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Cập nhật thông tin người dùng. Nhấn lưu khi hoàn tất."
              : "Nhập thông tin người dùng. Nhấn lưu để tạo mới."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="username">Tên đăng nhập</Label>
            <Input
              id="username"
              {...register("username")}
              placeholder="nguyenbinhan"
              disabled={isLoading}
            />
            {errors.username && (
              <p className="text-sm text-red-500">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="nguyenbinhan@example.com"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Mật khẩu {isEditing && "(để trống nếu không đổi)"}
            </Label>
            <InputPassword
              id="password"
              type="password"
              {...register("password")}
              placeholder={
                isEditing
                  ? "Để trống nếu không đổi mật khẩu"
                  : "Nhập mật khẩu (ít nhất 6 ký tự)"
              }
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Tên</Label>
              <Input
                id="firstName"
                {...register("firstName")}
                placeholder="An"
                disabled={isLoading}
              />
              {errors.firstName && (
                <p className="text-sm text-red-500">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Họ và tên đệm</Label>
              <Input
                id="lastName"
                {...register("lastName")}
                placeholder="Nguyễn Bình"
                disabled={isLoading}
              />
              {errors.lastName && (
                <p className="text-sm text-red-500">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dob">Ngày sinh</Label>
            <DatePickerInput
              value={dobValue ? new Date(dobValue) : undefined}
              onChange={(date) => {
                if (date) {
                  const formattedDate = date.toISOString().split("T")[0];
                  setValue("dob", formattedDate);
                } else {
                  setValue("dob", "");
                }
              }}
              allowFutureDate={false}
            />
            {errors.dob && (
              <p className="text-sm text-red-500">{errors.dob.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Đang lưu..." : isEditing ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
