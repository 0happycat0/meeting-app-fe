import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { kcSanitize } from "keycloakify/lib/kcSanitize";

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

export default function Login(
  props: PageProps<Extract<KcContext, { pageId: "login.ftl" }>, I18n>
) {
  const { kcContext } = props;
  const { url, realm, login, messagesPerField } = kcContext;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      // Lấy username từ Keycloak nếu người dùng nhập sai pass ở lần trước đó
      username: login.username ?? "",
      password: "",
    },
  });

  const onSubmit = () => {
    // Khi Zod validate thành công ở client, tiến hành submit thật lên Keycloak
    const formElement = document.getElementById("kc-form-login") as HTMLFormElement;
    formElement.submit();
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

        {/* Form bắt buộc phải có ID, Action và Method POST để submit lên Keycloak */}
        <form id="kc-form-login" action={url.loginAction} method="post" onSubmit={handleSubmit(onSubmit)}>
          <CardContent>
            {/* Vùng hiển thị lỗi từ Server (Ví dụ: Sai mật khẩu) */}
            {messagesPerField.existsError("username", "password") && (
              <div 
                className="mb-4 p-3 rounded-md bg-red-100 text-red-600 text-sm"
                dangerouslySetInnerHTML={{
                  __html: kcSanitize(messagesPerField.getFirstError("username", "password"))
                }}
              />
            )}

            <FieldGroup>
              <Field data-invalid={!!errors.username}>
                <FieldLabel htmlFor="username">Tên đăng nhập</FieldLabel>
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Nhập tên đăng nhậpppppp"
                  icon={<UserIcon weight="fill" />}
                  // register("username") đã bao gồm thuộc tính name="username"
                  {...register("username")}
                  aria-invalid={!!errors.username}
                />
                {errors.username && <FieldError errors={[errors.username]} />}
              </Field>

              <Field data-invalid={!!errors.password}>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
                  
                  {/* Link Quên mật khẩu được trỏ động về cấu hình của Keycloak */}
                  {realm.resetPasswordAllowed && (
                    <a
                      href={url.loginResetCredentialsUrl}
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Quên mật khẩu?
                    </a>
                  )}
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
              name="login"
              id="kc-login"
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