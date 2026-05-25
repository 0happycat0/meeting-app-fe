import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const { isInitialized, isAuthenticated, login } = useAuth();

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      login();
    }
  }, [isInitialized, isAuthenticated]);

  if (!isInitialized) return null;
  if (!isAuthenticated) return null;

  return <Outlet />;
}