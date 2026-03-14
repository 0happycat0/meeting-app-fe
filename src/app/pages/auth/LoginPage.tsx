import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input, InputPassword } from "@/components/ui/input";
import { LockSimpleIcon, UserIcon } from "@phosphor-icons/react";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

const loginSchema = z.object({
  username: z.string().min(1, { message: "Vui lòng nhập tên đăng nhập" }),
  password: z.string().min(1, { message: "Vui lòng nhập mật khẩu" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    //TODO: Call API
    console.log("Dữ liệu an toàn để gọi API:", values);
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-linear-to-br from-[#d1e8fe] via-[#f8fafc] to-[#dfedff]">
      <Card className="w-full max-w-sm shadow-xl border-0 backdrop-blur-sm mt-auto mb-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Đăng nhập</CardTitle>
          <CardDescription>
            Vui lòng đăng nhập để truy cập hệ thống
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent>
            <FieldGroup>
              <Field data-invalid={!!errors.username}>
                <FieldLabel htmlFor="username">Tên đăng nhập</FieldLabel>
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Nhập tên đăng nhập"
                  icon={<UserIcon weight="fill" />}
                  {...register("username")}
                  aria-invalid={!!errors.username}
                />
                {errors.username && <FieldError errors={[errors.username]} />}
              </Field>

              <Field data-invalid={!!errors.password}>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Quên mật khẩu?
                  </a>
                </div>
                <InputPassword
                  id="password"
                  placeholder="Nhập mật khẩu"
                  icon={<LockSimpleIcon weight="fill" />}
                  {...register("password")}
                  aria-invalid={!!errors.password}
                />
                {errors.password && <FieldError errors={[errors.password]} />}
              </Field>
            </FieldGroup>
          </CardContent>

          <CardFooter className="flex-col gap-2 mt-12">
            <Button
              type="submit"
              className="w-full h-9"
            >
              Đăng nhập
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
