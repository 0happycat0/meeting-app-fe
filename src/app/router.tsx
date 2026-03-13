import LandingPage from "@/app/pages/landing/LandingPage";
import LoginPage from "@/app/pages/auth/LoginPage";
import { createBrowserRouter } from "react-router-dom";
import { paths } from "@/config/paths";
import AppRoot from "./pages/app/AppRoot";

export const router = createBrowserRouter([
  {
    path: paths.landing.path,
    element: <LandingPage />,
  },
  {
    path: paths.auth.login.path,
    element: <LoginPage />,
  },
  {
    path: paths.app.root.path,
    element: <AppRoot/>
  }
	
]);
