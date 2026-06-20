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
import { Checkbox } from "@/components/ui/checkbox";
import { InputPassword } from "@/components/ui/input";
import { LockSimpleIcon } from "@phosphor-icons/react";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

const updatePasswordSchema = z
  .object({
    "password-new": z.string().min(1, { message: "Vui lòng nhập mật khẩu mới" }),
    "password-confirm": z
      .string()
      .min(1, { message: "Vui lòng xác nhận mật khẩu" }),
  })
  .refine((data) => data["password-new"] === data["password-confirm"], {
    message: "Mật khẩu xác nhận không khớp",
    path: ["password-confirm"],
  });

type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>;

export default function LoginUpdatePassword(
  props: Readonly<
    PageProps<Extract<KcContext, { pageId: "login-update-password.ftl" }>, I18n>
  >,
) {
  const { kcContext } = props;
  const { url, messagesPerField, isAppInitiatedAction } = kcContext;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      "password-new": "",
      "password-confirm": "",
    },
  });

  const onSubmit = () => {
    const formElement = document.getElementById(
      "kc-passwd-update-form",
    ) as HTMLFormElement;
    formElement.submit();
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-linear-to-br from-[#d1e8fe] via-[#f8fafc] to-[#dfedff]">
      <Card className="w-full max-w-sm shadow-xl border-0 backdrop-blur-sm mt-auto mb-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Cập nhật mật khẩu</CardTitle>
          <CardDescription>Vui lòng nhập mật khẩu mới của bạn</CardDescription>
        </CardHeader>

        <form
          id="kc-passwd-update-form"
          action={url.loginAction}
          method="post"
          onSubmit={handleSubmit(onSubmit)}
        >
          <CardContent>
            {/* Vùng hiển thị lỗi từ Server */}
            {messagesPerField.existsError("password", "password-confirm") && (
              <div
                className="mb-4 p-3 rounded-md bg-red-100 text-red-600 text-sm"
                dangerouslySetInnerHTML={{
                  __html: kcSanitize(
                    messagesPerField.getFirstError(
                      "password",
                      "password-confirm",
                    ),
                  ),
                }}
              />
            )}

            <FieldGroup>
              <Field data-invalid={!!errors["password-new"]}>
                <FieldLabel htmlFor="password-new">Mật khẩu mới</FieldLabel>
                <InputPassword
                  id="password-new"
                  placeholder="Nhập mật khẩu mới"
                  icon={<LockSimpleIcon weight="fill" />}
                  autoComplete="new-password"
                  autoFocus
                  {...register("password-new")}
                  aria-invalid={!!errors["password-new"]}
                />
                {errors["password-new"] && (
                  <FieldError errors={[errors["password-new"]]} />
                )}
              </Field>

              <Field data-invalid={!!errors["password-confirm"]}>
                <FieldLabel htmlFor="password-confirm">
                  Xác nhận mật khẩu
                </FieldLabel>
                <InputPassword
                  id="password-confirm"
                  placeholder="Nhập lại mật khẩu mới"
                  icon={<LockSimpleIcon weight="fill" />}
                  autoComplete="new-password"
                  {...register("password-confirm")}
                  aria-invalid={!!errors["password-confirm"]}
                />
                {errors["password-confirm"] && (
                  <FieldError errors={[errors["password-confirm"]]} />
                )}
              </Field>

              {/* Checkbox đăng xuất khỏi các thiết bị khác */}
              <Field orientation="horizontal">
                <Checkbox
                  id="logout-sessions"
                  name="logout-sessions"
                  value="on"
                  defaultChecked={true}
                />
                <FieldLabel htmlFor="logout-sessions">
                  Đăng xuất khỏi các thiết bị khác
                </FieldLabel>
              </Field>
            </FieldGroup>
          </CardContent>

          <CardFooter className="flex-col gap-2 mt-4">
            <Button
              type="submit"
              className="w-full h-9"
            >
              Xác nhận
            </Button>

            {isAppInitiatedAction && (
              <Button
                type="submit"
                name="cancel-aia"
                value="true"
                variant="outline"
                className="w-full h-9"
              >
                Hủy
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
