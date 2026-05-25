import { useEffect, useRef, useState } from "react";
import keycloak from "@/config/keycloak";
import { Spinner } from "@/components/ui/spinner";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const isRun = useRef(false);

  useEffect(() => {
    // Ngăn chặn keycloak.init() chạy 2 lần trong môi trường Dev do React.StrictMode
    if (isRun.current) return;
    isRun.current = true;

    keycloak
      .init({
        onLoad: "check-sso", // Kiểm tra đăng nhập ngầm, không tự động chuyển hướng
        pkceMethod: "S256",
      })
      .then((authenticated) => {
        console.log(`[Keycloak] User authenticated: ${authenticated}`);
        setIsInitialized(true);
      })
      .catch((error) => {
        console.error("[Keycloak] Initialization failed", error);
        setIsInitialized(true); 
      });
  }, []);

  // Hiển thị màn hình chờ trong lúc Keycloak đang kiểm tra trạng thái
  if (!isInitialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spinner className="size-10"/>
      </div>
    );
  }

  return (
    <>{children}</>
  )
}