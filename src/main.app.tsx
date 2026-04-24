import "./index.css";
import App from "./app/App.tsx";
import keycloak from "./config/keycloak.ts";
import { useEffect, useState, useRef } from "react";

export default function AppEntrypoint() {
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
        Đang khởi tạo xác thực...
      </div>
    );
  }

  return <App />;
}

// createRoot(document.getElementById("root")!).render(
//   <StrictMode>
//     <App />
//   </StrictMode>,
// );
