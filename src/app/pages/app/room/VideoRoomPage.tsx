import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import { VideoPresets } from "livekit-client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import { useAuth } from "@/hooks/use-auth";
import {
  useMeetingDetail,
  useWaitingRoomList,
  useApproveWaitingParticipant,
  useRejectWaitingParticipant,
  useLeaveMeeting,
  useLiveKitJoinToken,
  useEndMeeting,
  useResolveJoinCode,
} from "@/features/meetings/api/use-meetings";
import { useUsers } from "@/features/users/api/use-users";
import { paths } from "@/config/paths";
import { RoomActiveContent } from "./RoomActiveContent";

export default function VideoRoomPage() {
  const { joinCode: routeParam } = useParams<{ joinCode: string }>();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const currentUserId = authUser?.sub;

  const isLeavingRef = useRef(false);

  // LiveKit Token State
  const [tokenData, setTokenData] = useState<{ token: string; liveKitUrl: string } | null>(null);
  const [isTokenLoading, setIsTokenLoading] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const isUuid = routeParam && routeParam.length === 36 && routeParam.includes("-");
  const meetingIdFromRoute = isUuid ? routeParam : null;
  const joinCode = isUuid ? null : routeParam;

  // Queries
  const { data: resolveResponse, isLoading: isResolveLoading } = useResolveJoinCode(
    joinCode ?? "",
    { enabled: !!joinCode }
  );

  const { data: detailResponse, isLoading: isDetailLoading } = useMeetingDetail(
    meetingIdFromRoute ?? "",
    { enabled: !!meetingIdFromRoute }
  );

  const meeting = joinCode ? resolveResponse?.result : detailResponse?.result;
  const isMeetingLoading = joinCode ? isResolveLoading : isDetailLoading;
  const isHost = meeting?.hostId === currentUserId;
  const meetingId = meeting?.id;

  // Token Fetch Mutation
  const fetchTokenMutation = useLiveKitJoinToken(meetingId ?? "");

  // Host Waiting Room Polling (Poll every 3000ms if host)
  const { data: waitingRoomResponse } = useWaitingRoomList(meetingId ?? "", {
    enabled: !!meetingId && isHost,
    refetchInterval: 3000,
  });

  const waitingParticipants = waitingRoomResponse?.result.items ?? [];

  // Mutations
  const approveMutation = useApproveWaitingParticipant(meetingId ?? "");
  const rejectMutation = useRejectWaitingParticipant(meetingId ?? "");
  const leaveMutation = useLeaveMeeting(meetingId ?? "");
  const endMeetingMutation = useEndMeeting();

  const { data: usersResponse } = useUsers();
  const systemUsers = usersResponse?.result.items ?? [];

  // Load token on mount
  useEffect(() => {
    if (meetingId && authUser) {
      const savedName = sessionStorage.getItem("preview_username");
      const displayName = savedName || authUser.name || authUser.preferred_username || "User";
      setIsTokenLoading(true);
      fetchTokenMutation.mutate(displayName, {
        onSuccess: (response) => {
          setTokenData(response.result);
          setIsTokenLoading(false);
        },
        onError: (err: any) => {
          setTokenError(err.message || "Không thể lấy token LiveKit.");
          setIsTokenLoading(false);
          toast.error("Không thể lấy token tham gia cuộc họp.");
        },
      });
    }
  }, [meetingId, authUser]);

  // Redirect on meeting ending
  useEffect(() => {
    if (meeting && (meeting.status === "ENDED" || meeting.status === "CANCELLED")) {
      toast.info("Cuộc họp đã kết thúc.");
      navigate(paths.app.meetings.path);
    }
  }, [meeting, navigate]);

  const handleLeave = async () => {
    if (!isLeavingRef.current) {
      toast.info("Bạn đã rời khỏi phòng họp.");
      navigate(paths.app.meetings.path);
      return;
    }

    try {
      await leaveMutation.mutateAsync();
      toast.success("Đã rời cuộc họp.");
    } catch (err) {
      console.warn("Failed to notify backend of leave, forcing route change.");
    } finally {
      navigate(paths.app.meetings.path);
    }
  };

  const handleApprove = async (participantId: string) => {
    try {
      await approveMutation.mutateAsync(participantId);
      toast.success("Đã duyệt người tham gia.");
    } catch (error: any) {
      toast.error(error.message || "Duyệt thất bại.");
    }
  };

  const handleReject = async (participantId: string) => {
    try {
      await rejectMutation.mutateAsync({ participantId, reason: "Bị từ chối bởi host" });
      toast.success("Đã từ chối người tham gia.");
    } catch (error: any) {
      toast.error(error.message || "Từ chối thất bại.");
    }
  };

  const handleEndMeeting = async () => {
    try {
      await endMeetingMutation.mutateAsync(meetingId ?? "");
      toast.success("Đã kết thúc cuộc họp.");
    } catch (err: any) {
      toast.error(err.message || "Không thể kết thúc cuộc họp.");
      throw err;
    }
  };

  const getUserFullName = (userId: string) => {
    const found = systemUsers.find((u) => u.id === userId);
    return found ? `${found.lastName} ${found.firstName}` : "Thành viên hệ thống";
  };

  if (isMeetingLoading || isTokenLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-white space-y-4">
        <Spinner className="size-8 text-white" />
        <p className="text-sm text-neutral-400">Đang chuẩn bị vào cuộc họp...</p>
      </div>
    );
  }

  if (tokenError || !meeting || !tokenData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-white space-y-4 text-center px-4">
        <p className="text-red-400 font-semibold">{tokenError || "Không tìm thấy cuộc họp."}</p>
        <Button onClick={() => navigate(paths.app.meetings.path)}>
          <ChevronLeft className="size-4 mr-2" /> Quay lại danh sách
        </Button>
      </div>
    );
  }

  // Read preview choices from sessionStorage
  const initialCamOn = sessionStorage.getItem("preview_camera_enabled") !== "false";
  const initialMicOn = sessionStorage.getItem("preview_mic_enabled") !== "false";
  const initialVideoDeviceId = sessionStorage.getItem("preview_video_device_id");
  const initialAudioDeviceId = sessionStorage.getItem("preview_audio_device_id");

  return (
    <main data-lk-theme="default" style={{ height: "100vh" }}>
      <div className="lk-room-container">
        <LiveKitRoom
          token={tokenData.token}
          serverUrl={tokenData.liveKitUrl}
          connect={true}
          audio={initialMicOn ? { deviceId: initialAudioDeviceId || undefined } : false}
          video={initialCamOn ? { deviceId: initialVideoDeviceId || undefined } : false}
          onDisconnected={handleLeave}
          options={{
            publishDefaults: {
              simulcast: true,
            },
            adaptiveStream: true,
            dynacast: true,
            videoCaptureDefaults: {
              resolution: VideoPresets.h1080.resolution,
            },
          }}
        >
          <RoomActiveContent
            meeting={meeting}
            isHost={isHost}
            waitingParticipants={waitingParticipants}
            handleApprove={handleApprove}
            handleReject={handleReject}
            handleEndMeeting={handleEndMeeting}
            getUserFullName={getUserFullName}
            currentUserId={currentUserId ?? ""}
            isLeavingRef={isLeavingRef}
          />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </main>
  );
}
