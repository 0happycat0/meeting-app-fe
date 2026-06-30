import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShieldAlert, Users, LogOut, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

import { useAuth } from "@/hooks/use-auth";
import {
  useMeetingDetail,
  useMyParticipantStatus,
  useResolveJoinCode,
} from "@/features/meetings/api/use-meetings";
import { paths } from "@/config/paths";

export default function LobbyPage() {
  const { joinCode: routeParam } = useParams<{ joinCode: string }>();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const currentUserId = authUser?.sub;

  const [hasRequested, setHasRequested] = useState(true);
  const [useBackendMockBypass, setUseBackendMockBypass] = useState(false);

  const isUuid = routeParam && routeParam.length === 36 && routeParam.includes("-");
  const meetingId = isUuid ? routeParam : null;
  const joinCode = isUuid ? null : routeParam;

  // Queries & Mutations
  const { data: resolveResponse, isLoading: isResolveLoading } = useResolveJoinCode(
    joinCode ?? "",
    { enabled: !!joinCode }
  );

  const { data: detailResponse, isLoading: isDetailLoading } = useMeetingDetail(
    meetingId ?? "",
    { enabled: !!meetingId }
  );

  const meeting = joinCode ? resolveResponse?.result : detailResponse?.result;
  const isMeetingLoading = joinCode ? isResolveLoading : isDetailLoading;
  const isHost = meeting?.hostId === currentUserId;

  // Poll participant status every 2500ms
  const {
    data: statusResponse,
    error: statusError,
    isLoading: isStatusLoading,
  } = useMyParticipantStatus(meeting?.id ?? "", {
    enabled: !!meeting?.id && !isHost && hasRequested && !useBackendMockBypass,
    refetchInterval: 2500,
  });

  const participantStatus = statusResponse?.result;

  // Redirect host immediately
  useEffect(() => {
    if (meeting && isHost) {
      navigate(paths.app.room.path(meeting.joinCode));
    }
  }, [meeting, isHost, navigate]);

  // Handle status transitions
  useEffect(() => {
    if (participantStatus && meeting) {
      const status = participantStatus.participationStatus;
      if (status === "APPROVED" || status === "JOINED") {
        toast.success("Yêu cầu tham gia đã được duyệt!");
        navigate(paths.app.room.path(meeting.joinCode));
      } else if (status === "REJECTED") {
        toast.error("Bạn đã bị từ chối tham gia cuộc họp.");
      } else if (status === "REMOVED") {
        toast.error("Bạn đã bị xóa khỏi cuộc họp.");
      }
    }
  }, [participantStatus, meeting, navigate]);

  if (isMeetingLoading || (isStatusLoading && hasRequested && !useBackendMockBypass)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Spinner className="size-8" />
        <p className="text-sm text-muted-foreground">Đang tải thông tin phòng chờ...</p>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <p className="text-red-500 font-semibold">Không tìm thấy cuộc họp.</p>
        <Button onClick={() => navigate(paths.app.meetings.path)}>
          <ChevronLeft className="size-4 mr-2" /> Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center mb-2">
            <Users className="size-6 text-neutral-600 dark:text-neutral-300" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight">{meeting.title}</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center space-y-6">
          {useBackendMockBypass ? (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-lg text-sm text-blue-700 dark:text-blue-400">
                Chế độ phát triển: Auto-bypass phòng chờ
              </div>
              <Button
                onClick={() => navigate(paths.app.room.path(meeting.joinCode))}
                className="w-full bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
              >
                Vào phòng họp ngay
              </Button>
            </div>
          ) : participantStatus?.participationStatus === "REJECTED" ? (
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-500">
                <ShieldAlert className="size-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg text-red-600">Yêu cầu bị từ chối</h3>
                <p className="text-sm text-muted-foreground">
                  Chủ phòng họp đã từ chối yêu cầu tham gia của bạn.
                </p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => navigate(paths.app.meetings.path)}>
                Quay lại trang chủ
              </Button>
            </div>
          ) : participantStatus?.participationStatus === "REMOVED" ? (
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-500">
                <ShieldAlert className="size-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg text-red-600">Bạn đã bị xóa</h3>
                <p className="text-sm text-muted-foreground">
                  Bạn đã bị quản trị viên xóa khỏi cuộc họp này.
                </p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => navigate(paths.app.meetings.path)}>
                Quay lại trang chủ
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center pb-6 space-y-4">
                <div className="pb-6">

                  <Spinner className="size-10" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-neutral-800 dark:text-neutral-200">
                    Đang chờ chủ phòng phê duyệt...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Yêu cầu tham gia của bạn đã được gửi. Vui lòng giữ kết nối.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => navigate(paths.app.meetings.path)}
                >
                  <LogOut className="size-4 mr-2" />
                  Rời phòng chờ
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
