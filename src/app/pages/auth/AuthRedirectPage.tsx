import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import keycloak from "@/config/keycloak";
import { paths } from "@/config/paths";
import { useAuth } from "@/hooks/use-auth";
import { Spinner } from "@/components/ui/spinner";
export default function AuthRedirectPage() {
  const navigate = useNavigate();
  const { isInitialized, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      void keycloak.login({
        redirectUri: globalThis.location.origin + paths.auth.redirect.path,
      });
      return;
    }

    if (keycloak.hasRealmRole("admin")) {
      navigate(paths.admin.root.path, { replace: true });
    } else {
      navigate(paths.app.root.path, { replace: true });
    }
  }, [isInitialized, isAuthenticated, navigate]);

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <Spinner className="size-10"/>
    </div>
  );
}
