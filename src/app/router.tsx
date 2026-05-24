import LandingPage from "@/app/pages/landing/LandingPage";
import AuthRedirectPage from "@/app/pages/auth/AuthRedirectPage";
import { createBrowserRouter } from "react-router-dom";
import { paths } from "@/config/paths";
import AppRoot from "./pages/app/AppRoot";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";

export const router = createBrowserRouter([
  {
    path: paths.landing.path,
    element: <LandingPage />,
  },
  {
    path: paths.auth.redirect.path,
    element: <AuthRedirectPage />,
  },
  {
    path: paths.app.root.path,
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        element: <AppRoot />,
      }
    ]
  },
  {
    element: <AdminRoute />,
    children: [
      {
        
      }
    ]
  },
]);
