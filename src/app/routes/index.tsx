import HomePage from "@/features/auth/HomePage";
import LoginPage from "@/features/auth/LoginPage";
import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
	{
    path: "/",
    element: <HomePage />,
  },
]);
