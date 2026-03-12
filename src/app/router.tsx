import LandingPage from "@/features/landing/LandingPage";
import LoginPage from "@/features/auth/LoginPage";
import { createBrowserRouter } from "react-router-dom";
import { paths } from "@/config/paths";

export const router = createBrowserRouter([
  {
    path: paths.auth.login.path,
    element: <LoginPage />,
  },
	{
    path: "/",
    element: <LandingPage />,
  },
]);
