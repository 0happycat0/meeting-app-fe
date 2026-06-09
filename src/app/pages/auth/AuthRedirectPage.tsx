import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import keycloak from "@/config/keycloak";
import { paths } from "@/config/paths";
import { useAuth } from "@/hooks/use-auth";
import { Spinner } from "@/components/ui/spinner";
export default function AuthRedirectPage() {
  const navigate = useNavigate();
  const { isInitialized, isAuthenticated, login } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      void login();
      return;
    }

    if (hasRedirected.current) return;
    hasRedirected.current = true;

    const redirectPath = sessionStorage.getItem("redirect_after_login") || localStorage.getItem("redirect_after_login");
    console.log("[AuthRedirectPage] Retrieved redirect path:", redirectPath);
    sessionStorage.removeItem("redirect_after_login");
    localStorage.removeItem("redirect_after_login");

    if (redirectPath) {
      navigate(redirectPath, { replace: true });
    } else if (keycloak.hasRealmRole("admin")) {
      navigate(paths.admin.root.path, { replace: true });
    } else {
      navigate(paths.app.root.path, { replace: true });
    }
  }, [isInitialized, isAuthenticated, navigate, login]);

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <Spinner className="size-10"/>
    </div>
  );
}
