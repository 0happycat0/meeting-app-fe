import { paths } from "@/config/paths";
import { useAuth } from "@/hooks/use-auth";
import { Navigate, Outlet } from "react-router-dom";
import { useEffect } from "react";

export default function AdminRoute() {
  const { isInitialized, isAuthenticated, isAdmin, login } = useAuth();

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      login();
    }
  }, [isInitialized, isAuthenticated]);

  // Chờ keycloak khởi tạo xong
  if (!isInitialized) return null;
  
  // Chưa đăng nhập, đang redirect
  if (!isAuthenticated) return null;

  // Đã đăng nhập nhưng không phải admin
  if (!isAdmin()) {
    return <Navigate to={paths.app.root.path} replace />;
  }

  return <Outlet />;
}