import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import type { LocalUserChoices } from "@livekit/components-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar, Clock, User, Info, ChevronLeft, Video, VideoOff, Mic, MicOff, Settings } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import {
  useMeetingDetail,
  useResolveJoinCode,
  useRequestWaitingRoomByJoinCode,
  useRequestWaitingRoomByInvitation,
} from "@/features/meetings/api/use-meetings";
import { paths } from "@/config/paths";
import { getErrorMessage } from "@/config/error-messages";

export default function PreviewPage() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user: authUser } = useAuth();
  const currentUserId = authUser?.sub;

  const joinCode = searchParams.get("joinCode");
  const invitationId = searchParams.get("invitationId");

  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string>("");
  const [selectedAudioId, setSelectedAudioId] = useState<string>("");
  const [videoEnabled, setVideoEnabled] = useState<boolean>(false);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize display name and settings from sessionStorage
  useEffect(() => {
    if (authUser) {
      setUsername(authUser.name || authUser.preferred_username || "Participant");
    }
    const camOn = sessionStorage.getItem("preview_camera_enabled") === "true";
    const micOn = sessionStorage.getItem("preview_mic_enabled") === "true";
    const camId = sessionStorage.getItem("preview_video_device_id") || "";
    const micId = sessionStorage.getItem("preview_audio_device_id") || "";

    setVideoEnabled(camOn);
    setAudioEnabled(micOn);
    setSelectedVideoId(camId);
    setSelectedAudioId(micId);
  }, [authUser]);

  // Request permissions and enumerate devices
  useEffect(() => {
    async function initDevices() {
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }).catch(() => null);
        if (tempStream) {
          tempStream.getTracks().forEach((track) => track.stop());
        }

        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const vDevices = allDevices.filter((d) => d.kind === "videoinput" && d.deviceId);
        const aDevices = allDevices.filter((d) => d.kind === "audioinput" && d.deviceId);

        setVideoDevices(vDevices);
        setAudioDevices(aDevices);

        if (vDevices.length > 0 && !selectedVideoId) {
          setSelectedVideoId(vDevices[0].deviceId);
        }
        if (aDevices.length > 0 && !selectedAudioId) {
          setSelectedAudioId(aDevices[0].deviceId);
        }
      } catch (err) {
        console.error("Error initializing devices", err);
      }
    }

    initDevices();
  }, [selectedVideoId, selectedAudioId]);

  // Handle local camera stream preview
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function startCamera() {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (!videoEnabled) {
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        return;
      }

      try {
        const constraints: MediaStreamConstraints = {
          video: selectedVideoId ? { deviceId: selectedVideoId } : true,
          audio: false,
        };
        activeStream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = activeStream;
        if (videoRef.current) {
          videoRef.current.srcObject = activeStream;
        }
      } catch (err) {
        console.error("Failed to start preview camera", err);
        setVideoEnabled(false);
      }
    }

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [videoEnabled, selectedVideoId]);

  // Fetch meeting details using joinCode if present, otherwise fallback to meetingId
  const {
    data: resolveResponse,
    isLoading: isResolveLoading,
    error: resolveError,
  } = useResolveJoinCode(joinCode ?? "", { enabled: !!joinCode });

  const {
    data: detailResponse,
    isLoading: isDetailLoading,
    error: detailError,
  } = useMeetingDetail(meetingId ?? "", { enabled: !joinCode && !!meetingId });

  const meeting = joinCode ? resolveResponse?.result : detailResponse?.result;
  const isMeetingLoading = joinCode ? isResolveLoading : isDetailLoading;
  const meetingError = joinCode ? resolveError : detailError;

  const isHost = meeting?.hostId === currentUserId;

  const requestJoinByCodeMutation = useRequestWaitingRoomByJoinCode();
  const requestJoinByInvitationMutation = useRequestWaitingRoomByInvitation();

  const handleJoinSubmit = async (choices: LocalUserChoices) => {
    if (!meeting) return;

    // Save preferences to sessionStorage
    sessionStorage.setItem("preview_camera_enabled", choices.videoEnabled ? "true" : "false");
    sessionStorage.setItem("preview_mic_enabled", choices.audioEnabled ? "true" : "false");
    sessionStorage.setItem("preview_video_device_id", choices.videoDeviceId);
    sessionStorage.setItem("preview_audio_device_id", choices.audioDeviceId);
    sessionStorage.setItem("preview_username", choices.username);

    try {
      if (isHost) {
        // Host skips waiting room and goes directly to Video Room
        toast.success("Đang kết nối vào phòng họp...");
        navigate(paths.app.room.path(meeting.id));
      } else {
        // Participant requests waiting room entry
        if (invitationId) {
          await requestJoinByInvitationMutation.mutateAsync(invitationId);
        } else if (joinCode) {
          await requestJoinByCodeMutation.mutateAsync(joinCode);
        } else {
          toast.error("Không xác định được nguồn tham gia (Join Code hoặc Lời mời).");
          return;
        }

        toast.success("Yêu cầu tham gia đã được gửi!");
        navigate(paths.app.lobby.path(meeting.id));
      }
    } catch (err: any) {
      toast.error(err.message || "Gửi yêu cầu tham gia thất bại.");
    }
  };

  const handleJoinClick = () => {
    if (!username.trim()) {
      toast.error("Vui lòng nhập tên hiển thị");
      return;
    }
    handleJoinSubmit({
      username,
      videoEnabled,
      audioEnabled,
      videoDeviceId: selectedVideoId,
      audioDeviceId: selectedAudioId,
    });
  };

  if (isMeetingLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Spinner className="size-8" />
        <p className="text-sm text-muted-foreground">Đang tải thông tin cuộc họp...</p>
      </div>
    );
  }

  if (meetingError || !meeting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <p className="text-red-500 font-semibold">{meetingError?.message}</p>
        <Button onClick={() => navigate(paths.app.meetings.path)}>
          <ChevronLeft className="size-4 mr-2" /> Quay lại
        </Button>
      </div>
    );
  }

  const formatMeetingTime = (dateStr: string) => {
    return format(new Date(dateStr), "HH:mm d 'thg' M, yyyy", { locale: vi });
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-4">
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          onClick={() => navigate(paths.app.meetings.path)}
        >
          <ChevronLeft className="size-4 mr-2" /> Quay lại
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: PreJoin Media Preview (7/12 cols) */}
        <div className="lg:col-span-7 bg-white border border-neutral-200 rounded-xl p-6 shadow-sm text-neutral-900 dark:text-neutral-100 flex flex-col gap-6">
          <div className="relative aspect-video w-full max-h-[300px] bg-neutral-700 border border-neutral-200 dark:border-neutral-850 rounded-lg overflow-hidden flex items-center justify-center group shadow-inner mx-auto">
            {videoEnabled ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain scale-x-[-1]"
              />
            ) : (
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-200">
                  <VideoOff className="size-8" />
                </div>
                <p className="text-xs text-neutral-200 font-medium font-sans">Camera đang tắt</p>
              </div>
            )}

            {/* Video Overlay controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/30 backdrop-blur-xs px-4 py-2 rounded-full border border-neutral-700 shadow-lg">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`size-10 rounded-full cursor-pointer transition-all ${
                  audioEnabled
                    ? "bg-neutral-800 text-white hover:bg-neutral-750 hover:text-neutral-200"
                    : "bg-red-600 text-white hover:bg-red-700 hover:text-neutral-200"
                }`}
                title={audioEnabled ? "Tắt Micro" : "Bật Micro"}
              >
                {audioEnabled ? <Mic className="size-5" /> : <MicOff className="size-5" />}
              </Button>

              <Button
                size="icon"
                variant="ghost"
                onClick={() => setVideoEnabled(!videoEnabled)}
                className={`size-10 rounded-full cursor-pointer transition-all ${
                  videoEnabled
                    ? "bg-neutral-800 text-white hover:bg-neutral-750 hover:text-neutral-200"
                    : "bg-red-600 text-white hover:bg-red-700 hover:text-neutral-200"
                }`}
                title={videoEnabled ? "Tắt Camera" : "Bật Camera"}
              >
                {videoEnabled ? <Video className="size-5" /> : <VideoOff className="size-5" />}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Device selection dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
                  <Video className="size-3.5" /> Camera
                </Label>
                <Select value={selectedVideoId} onValueChange={setSelectedVideoId}>
                  <SelectTrigger className="w-full bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 h-9 text-xs">
                    <SelectValue placeholder="Chọn Camera..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200">
                    {videoDevices.length === 0 ? (
                      <SelectItem value="none" disabled className="text-xs">
                        Không tìm thấy camera
                      </SelectItem>
                    ) : (
                      videoDevices.map((d) => (
                        <SelectItem key={d.deviceId} value={d.deviceId} className="text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:bg-neutral-100 dark:focus:bg-neutral-800">
                          {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
                  <Mic className="size-3.5" /> Microphone
                </Label>
                <Select value={selectedAudioId} onValueChange={setSelectedAudioId}>
                  <SelectTrigger className="w-full bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 h-9 text-xs">
                    <SelectValue placeholder="Chọn Micro..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200">
                    {audioDevices.length === 0 ? (
                      <SelectItem value="none" disabled className="text-xs">
                        Không tìm thấy microphone
                      </SelectItem>
                    ) : (
                      audioDevices.map((d) => (
                        <SelectItem key={d.deviceId} value={d.deviceId} className="text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:bg-neutral-100 dark:focus:bg-neutral-800">
                          {d.label || `Micro ${d.deviceId.slice(0, 5)}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Username input */}
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                Tên hiển thị trong phòng họp
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên của bạn..."
              />
            </div>

            {/* Join Action button */}
            <Button
              onClick={handleJoinClick}
              disabled={
                requestJoinByCodeMutation.isPending ||
                requestJoinByInvitationMutation.isPending ||
                !username.trim()
              }
              className="w-full h-11 text-sm"
            >
              {requestJoinByCodeMutation.isPending || requestJoinByInvitationMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner className="size-4 text-current animate-spin" />
                  Đang gửi yêu cầu...
                </span>
              ) : isHost ? (
                "Vào phòng họp"
              ) : (
                "Yêu cầu tham gia"
              )}
            </Button>
          </div>
        </div>

        {/* Right Column: Meeting Info Card (5/12 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <CardHeader className="pb-3 border-b border-neutral-150 dark:border-neutral-850">
              <div className="flex gap-2 mb-2">
                <Badge variant="secondary">
                  {meeting.meetingType === "INSTANT" ? "Tức thì" : "Đặt lịch"}
                </Badge>
                {meeting.status === "ACTIVE" && <Badge>Đang diễn ra</Badge>}
                {meeting.status === "SCHEDULED" && (
                  <Badge variant="outline" className="text-blue-600 border-blue-200">
                    Sắp diễn ra
                  </Badge>
                )}
                {meeting.status === "ENDED" && (
                  <Badge variant="secondary">Đã kết thúc</Badge>
                )}
                {meeting.status === "CANCELLED" && (
                  <Badge variant="destructive">Đã hủy</Badge>
                )}
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                {meeting.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-sm">
              {/* Host info */}
              <div className="flex items-start gap-3">
                <User className="size-5 text-neutral-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-neutral-800 dark:text-neutral-200">Chủ trì cuộc họp</p>
                  <p className="text-neutral-600">
                    Chủ trì: {meeting.hostLastName || meeting.hostFirstName ? `${meeting.hostLastName ?? ""} ${meeting.hostFirstName ?? ""}`.trim() : meeting.hostId}
                  </p>
                </div>
              </div>

              {/* Time info if scheduled */}
              {meeting.meetingType === "SCHEDULED" && (
                <div className="space-y-4">
                  {meeting.scheduledStartAt && (
                    <div className="flex items-start gap-3">
                      <Calendar className="size-5 text-neutral-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold text-neutral-800 dark:text-neutral-200">Thời gian bắt đầu</p>
                        <p className="text-neutral-600 dark:text-neutral-400">{formatMeetingTime(meeting.scheduledStartAt)}</p>
                      </div>
                    </div>
                  )}
                  {meeting.scheduledEndAt && (
                    <div className="flex items-start gap-3">
                      <Clock className="size-5 text-neutral-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold text-neutral-800 dark:text-neutral-200">Thời gian kết thúc</p>
                        <p className="text-neutral-600 dark:text-neutral-400">{formatMeetingTime(meeting.scheduledEndAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              <div className="flex items-start gap-3 pt-4 border-t border-neutral-150 dark:border-neutral-850">
                <Info className="size-5 text-neutral-500 shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <p className="font-semibold text-neutral-800 dark:text-neutral-200">Mô tả cuộc họp</p>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {meeting.description || "Không có mô tả cho cuộc họp này."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
