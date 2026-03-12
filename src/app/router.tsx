import LandingPage from "@/app/pages/LandingPage";
import LoginPage from "@/app/pages/auth/LoginPage";
import { createBrowserRouter } from "react-router-dom";
import { paths } from "@/config/paths";

export const router = createBrowserRouter([
  {
    path: paths.landing.path,
    element: <LandingPage />,
  },
  {
    path: paths.auth.login.path,
    element: <LoginPage />,
  },
	
]);
