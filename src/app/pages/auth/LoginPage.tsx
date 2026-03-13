import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LockSimpleIcon, UserIcon } from "@phosphor-icons/react";

export default function LoginPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-4 sm:p-8 bg-linear-to-br from-[#d1e8fe] via-[#f8fafc] to-[#dfedff]">
      <Card className="w-full max-w-sm shadow-xl border-0 backdrop-blur-sm mt-auto mb-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Đăng nhập</CardTitle>
          <CardDescription>
            Vui lòng đăng nhập để truy cập hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="username">Tên đăng nhập</Label>
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Nhập tên đăng nhập"
                  icon={<UserIcon weight="fill" />}
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Quên mật khẩu?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Nhập mật khẩu"
                  icon={<LockSimpleIcon weight="fill" />}
                  required
                />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-2 mt-6">
          <Button
            type="submit"
            className="w-full h-9"
          >
            Đăng nhập
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
