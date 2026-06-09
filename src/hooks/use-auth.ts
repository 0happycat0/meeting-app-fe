import { useEffect, useState } from "react";
import keycloak from "@/config/keycloak";
import { paths } from "@/config/paths";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(keycloak.authenticated || false);
  const [user, setUser] = useState(keycloak.tokenParsed);

  useEffect(() => {
    // Sync khi keycloak state thay đổi
    const updateAuth = () => {
      setIsAuthenticated(keycloak.authenticated || false);
      setUser(keycloak.tokenParsed);
    };

    // Keycloak events
    keycloak.onAuthSuccess = updateAuth;
    keycloak.onAuthLogout = updateAuth;
    keycloak.onAuthRefreshSuccess = updateAuth;
    
    return () => {
      keycloak.onAuthSuccess = undefined;
      keycloak.onAuthLogout = undefined;
      keycloak.onAuthRefreshSuccess = undefined;
    };
  }, []);

  return {
    isInitialized: keycloak.didInitialize,
    isAuthenticated,
    user,

    login: () => {
      const originalUrl = globalThis.location.pathname + globalThis.location.search;
      console.log("[useAuth] Storing redirect path:", originalUrl);
      if (
        !originalUrl.startsWith(paths.auth.redirect.path) &&
        originalUrl !== paths.landing.path
      ) {
        sessionStorage.setItem("redirect_after_login", originalUrl);
        localStorage.setItem("redirect_after_login", originalUrl);
      }
      return keycloak.login({
        redirectUri: globalThis.location.origin + paths.auth.redirect.path,
      });
    },
    logout: () =>
      keycloak.logout({
        redirectUri: globalThis.location.origin + paths.landing.path,
      }),

    isAdmin: () =>
      keycloak.hasRealmRole("admin"),

    getToken: () => keycloak.token,
  };
}