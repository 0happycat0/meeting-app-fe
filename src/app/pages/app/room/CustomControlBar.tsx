import React from "react";
import {
  useRoomContext,
  TrackToggle,
  MediaDeviceMenu,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { Users, MessageCircle, LogOut, Subtitles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface CustomControlBarProps {
  isHost: boolean;
  waitingCount: number;
  meetingId: string;
  onOpenParticipants: () => void;
  onOpenChat: () => void;
  onOpenTranscript: () => void;
  onEndMeeting: () => Promise<void>;
  isPanelOpen: boolean;
  activePanelTab: string;
  isTranscriptOpen: boolean;
  isLeavingRef: React.MutableRefObject<boolean>;
}

export function CustomControlBar({
  isHost,
  waitingCount,
  onOpenParticipants,
  onOpenChat,
  onOpenTranscript,
  onEndMeeting,
  isPanelOpen,
  activePanelTab,
  isTranscriptOpen,
  isLeavingRef,
}: CustomControlBarProps) {
  const room = useRoomContext();

  const handleActiveLeave = () => {
    isLeavingRef.current = true;
    room.disconnect();
  };

  const handleActiveEnd = async () => {
    try {
      await onEndMeeting();
      isLeavingRef.current = true;
      room.disconnect();
    } catch (error) {
      // Error handled by handleEndMeeting toast
    }
  };

  const browserSupportsScreenSharing = typeof navigator !== "undefined" &&
    navigator.mediaDevices &&
    "getDisplayMedia" in navigator.mediaDevices;

  return (
    <div className="lk-control-bar absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center gap-2 px-4 py-2 bg-black/65 backdrop-blur-md border border-neutral-800 rounded-full shadow-xl">
      {/* Microphone Toggle Group */}
      <div className="lk-button-group">
        <TrackToggle source={Track.Source.Microphone} showIcon={true} />
        <div className="lk-button-group-menu">
          <MediaDeviceMenu kind="audioinput" />
        </div>
      </div>

      {/* Camera Toggle Group */}
      <div className="lk-button-group">
        <TrackToggle source={Track.Source.Camera} showIcon={true} />
        <div className="lk-button-group-menu">
          <MediaDeviceMenu kind="videoinput" />
        </div>
      </div>

      {/* Screen Share Toggle */}
      {browserSupportsScreenSharing && (
        <TrackToggle
          source={Track.Source.ScreenShare}
          captureOptions={{ audio: true, selfBrowserSurface: "include" }}
          showIcon={true}
        />
      )}

      {/* Participants List Toggle */}
      <button
        className={`lk-button ${isPanelOpen && activePanelTab === "participants" ? "lk-button-active" : ""} cursor-pointer`}
        onClick={onOpenParticipants}
        title="Thành viên"
      >
        <Users className="size-4" />
        {isHost && waitingCount > 0 && (
          <span className="ml-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
            {waitingCount}
          </span>
        )}
      </button>

      {/* Chat Toggle */}
      <button
        className={`lk-button ${isPanelOpen && activePanelTab === "chat" ? "lk-button-active" : ""} cursor-pointer`}
        onClick={onOpenChat}
        title="Trò chuyện"
      >
        <MessageCircle className="size-4" />
      </button>

      {/* Transcript Toggle */}
      <button
        className={`lk-button ${isTranscriptOpen ? "lk-button-active" : ""} cursor-pointer`}
        onClick={onOpenTranscript}
        title="Phụ đề"
      >
        <Subtitles className="size-4" />
      </button>

      {/* Leave Button */}
      {isHost ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="lk-button bg-red-600 hover:bg-red-700 text-white border-none flex items-center gap-1 cursor-pointer">
              <LogOut className="size-4" />
              <span className="text-xs hidden md:inline font-semibold">Rời họp</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white border border-neutral-200 text-neutral-900 shadow-md">
            <DropdownMenuItem onClick={handleActiveLeave} className="text-xs font-semibold text-neutral-700 cursor-pointer">
              Rời cuộc họp
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleActiveEnd} className="text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer">
              Kết thúc cuộc họp
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <button
          className="lk-button bg-red-600 hover:bg-red-700 text-white border-none flex items-center gap-1 cursor-pointer"
          onClick={handleActiveLeave}
          title="Rời cuộc họp"
        >
          <LogOut className="size-4" />
          <span className="text-xs hidden md:inline font-semibold">Rời cuộc họp</span>
        </button>
      )}
    </div>
  );
}
