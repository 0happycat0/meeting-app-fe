import LandingPage from "@/app/pages/landing/LandingPage";
import AuthRedirectPage from "@/app/pages/auth/AuthRedirectPage";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { paths } from "@/config/paths";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersPage from "./pages/admin/users/UsersPage";
import AppLayout from "./pages/app/AppLayout";
import MeetingsPage from "./pages/app/meetings/MeetingsPage";
import MeetingDetailPage from "./pages/app/meetings/MeetingDetailPage";
import LobbyPage from "./pages/app/lobby/LobbyPage";
import VideoRoomPage from "./pages/app/room/VideoRoomPage";
import JoinCodeResolvePage from "./pages/app/join/JoinCodeResolvePage";
import { InvitationListPage } from "./pages/app/invitations/InvitationListPage";
import PreviewPage from "./pages/app/preview/PreviewPage";
import MinutesListPage from "./pages/app/minutes/MinutesListPage";
import MinutesDetailPage from "./pages/app/minutes/MinutesDetailPage";

export const router = createBrowserRouter([
  {
    path: paths.landing.routePath,
    element: <LandingPage />,
  },
  {
    path: paths.auth.redirect.routePath,
    element: <AuthRedirectPage />,
  },
  {
    path: paths.app.root.routePath,
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <Navigate to={paths.app.meetings.path} replace />,
          },
          {
            path: paths.app.home.routePath,
            element: <Navigate to={paths.app.meetings.path} replace />,
          },
          {
            path: paths.app.meetings.routePath,
            element: <MeetingsPage />,
          },
          {
            path: paths.app.meetingDetails.routePath,
            element: <MeetingDetailPage />,
          },
          {
            path: paths.app.preview.routePath,
            element: <PreviewPage />,
          },
          {
            path: paths.app.lobby.routePath,
            element: <LobbyPage />,
          },
          {
            path: paths.app.join.routePath,
            element: <JoinCodeResolvePage />,
          },
          {
            path: paths.app.invitations.routePath,
            element: <InvitationListPage />,
          },
          {
            path: paths.app.minutes.routePath,
            element: <MinutesListPage />,
          },
          {
            path: paths.app.minutesDetails.routePath,
            element: <MinutesDetailPage />,
          },
        ],
      },
      {
        path: paths.app.room.routePath,
        element: <VideoRoomPage />,
      },
    ],
  },
  {
    path: paths.admin.root.routePath,
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: <Navigate to={paths.admin.dashboard.path} replace />,
          },
          {
            path: paths.admin.dashboard.routePath,
            element: <AdminDashboard />,
          },
          {
            path: paths.admin.users.routePath,
            element: <UsersPage />,
          },
        ],
      },
    ],
  },
]);
