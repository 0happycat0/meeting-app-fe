import React, { useState } from "react";
import {
  LayoutGrid,
  Info,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  useTracks,
  GridLayout,
  ParticipantTile,
  FocusLayout,
  FocusLayoutContainer,
  CarouselLayout,
  LayoutContextProvider,
  useCreateLayoutContext,
  usePinnedTracks,
  isTrackReference,
  useChat,
  useLocalParticipant,
} from "@livekit/components-react";
import { RoomEvent, Track } from "livekit-client";
import type { TrackReferenceOrPlaceholder } from "@livekit/components-core";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

import {
  useMeetingParticipants,
  useRemoveParticipant,
} from "@/features/meetings/api/use-meetings";
import type { Meeting, JoinMeeting } from "@/types/entities/meeting";

import { useLocalTranscript } from "@/hooks/use-local-transcript";
import { CustomControlBar } from "./CustomControlBar";
import { RoomSidePanel } from "./RoomSidePanel";
import { TranscriptSidePanel } from "./TranscriptSidePanel";

// Helper to safely compare track references
const isSameTrack = (a?: any, b?: any) => {
  if (!a || !b) return a === b;
  return a.participant.identity === b.participant.identity && a.source === b.source;
};

interface RoomActiveContentProps {
  meeting: JoinMeeting | Meeting;
  isHost: boolean;
  waitingParticipants: any[];
  handleApprove: (id: string) => void;
  handleReject: (id: string) => void;
  handleEndMeeting: () => Promise<void>;
  getUserFullName: (userId: string) => string;
  currentUserId: string;
  isLeavingRef: React.MutableRefObject<boolean>;
}

export function RoomActiveContent({
  meeting,
  isHost,
  waitingParticipants,
  handleApprove,
  handleReject,
  handleEndMeeting,
  getUserFullName,
  currentUserId,
  isLeavingRef,
}: RoomActiveContentProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [activePanelTab, setActivePanelTab] = useState<"participants" | "chat">("participants");
  const [layoutMode, setLayoutMode] = useState<"auto" | "grid" | "focus">("auto");
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);

  const { chatMessages, send, isSending } = useChat();
  const { segments, partialText, status: transcriptStatus } = useLocalTranscript(meeting.id);
  const { localParticipant } = useLocalParticipant();

  // Fetch full participants from DB to map user ID to participant ID for kicking
  const { data: dbParticipantsResponse } = useMeetingParticipants(meeting.id, {
    enabled: isHost,
    refetchInterval: 5000,
  });
  const dbParticipants = dbParticipantsResponse?.result.items ?? [];
  const removeParticipantMutation = useRemoveParticipant(meeting.id);

  const handleRemoveParticipant = async (participantId: string) => {
    try {
      await removeParticipantMutation.mutateAsync(participantId);
      toast.success("Đã xóa thành viên khỏi cuộc họp.");
    } catch (err: any) {
      toast.error(err.message || "Không thể xóa thành viên.");
    }
  };

  // Get active camera and screen share tracks
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { updateOnlyOn: [RoomEvent.ActiveSpeakersChanged], onlySubscribed: false }
  );

  const layoutContext = useCreateLayoutContext();
  const pinnedTrack = usePinnedTracks(layoutContext)?.[0];

  const screenShareTrack = tracks.find(
    (t) => isTrackReference(t) && t.publication.source === Track.Source.ScreenShare
  );

  let focusTrack: TrackReferenceOrPlaceholder | undefined = undefined;

  if (layoutMode === "auto") {
    if (screenShareTrack) {
      focusTrack = screenShareTrack;
    } else {
      focusTrack = undefined;
    }
  } else if (layoutMode === "focus") {
    if (pinnedTrack) {
      focusTrack = pinnedTrack;
    } else if (screenShareTrack) {
      focusTrack = screenShareTrack;
    } else {
      const speakingTrack = tracks.find((t) => t.participant.isSpeaking);
      if (speakingTrack) {
        focusTrack = speakingTrack;
      } else {
        const camEnabledTrack = tracks.find(
          (t) => isTrackReference(t) && t.publication.source === Track.Source.Camera && t.participant.isCameraEnabled
        );
        if (camEnabledTrack) {
          focusTrack = camEnabledTrack;
        } else {
          const localTrack = tracks.find((t) => t.participant.isLocal);
          focusTrack = localTrack || tracks[0];
        }
      }
    }
  }

  const carouselTracks = tracks.filter((track) => !isSameTrack(track, focusTrack));

  return (
    <LayoutContextProvider value={layoutContext}>
      <div className="flex flex-1 overflow-hidden relative w-full h-full bg-neutral-950 text-white">
        {/* Video Grid & Conference Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative h-full">
          {/* Header Info Overlay */}
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="bg-black/60 hover:bg-black/85 text-white rounded-full p-2 border border-neutral-800 transition-colors flex items-center justify-center cursor-pointer shadow-md">
                  <Info className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                <p className="font-medium text-xs">{meeting.title}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Layout Selector (Top-Center) */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-black/60 hover:bg-black-400 text-white hover:text-neutral-400 border-neutral-800 h-9 px-3 text-xs font-semibold gap-1.5">
                  <LayoutGrid className="size-4" />
                  Layout: {layoutMode === "auto" ? "Tự động" : layoutMode === "grid" ? "Lưới" : "Tập trung"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white border border-neutral-200 text-neutral-900 shadow-md">
                <DropdownMenuRadioGroup value={layoutMode} onValueChange={(v) => setLayoutMode(v as any)}>
                  <DropdownMenuRadioItem value="auto" className="text-xs font-semibold cursor-pointer">
                    Tự động (Ưu tiên Screen Share)
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="grid" className="text-xs font-semibold cursor-pointer">
                    Dạng lưới
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="focus" className="text-xs font-semibold cursor-pointer">
                    Tập trung
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Active Custom Meeting Layout */}
          <div className="lk-video-conference-inner relative flex-1 w-full h-full min-h-0 overflow-hidden">
            {layoutMode === "grid" || !focusTrack ? (
              <div className="lk-grid-layout-wrapper w-full h-full overflow-hidden">
                <GridLayout tracks={tracks}>
                  <ParticipantTile />
                </GridLayout>
              </div>
            ) : (
              <div className="lk-focus-layout-wrapper w-full h-full overflow-hidden">
                <FocusLayoutContainer>
                  {carouselTracks.length > 0 && (
                    <CarouselLayout tracks={carouselTracks}>
                      <ParticipantTile />
                    </CarouselLayout>
                  )}
                  {focusTrack && <FocusLayout trackRef={focusTrack} />}
                </FocusLayoutContainer>
              </div>
            )}

            {/* Custom Control Bar */}
            <CustomControlBar
              isHost={isHost}
              waitingCount={waitingParticipants.length}
              meetingId={meeting.id}
              onOpenParticipants={() => {
                setIsPanelOpen(true);
                setIsTranscriptOpen(false);
                setActivePanelTab("participants");
              }}
              onOpenChat={() => {
                setIsPanelOpen(true);
                setIsTranscriptOpen(false);
                setActivePanelTab("chat");
              }}
              onOpenTranscript={() => {
                setIsTranscriptOpen(!isTranscriptOpen);
                setIsPanelOpen(false);
              }}
              onEndMeeting={handleEndMeeting}
              isPanelOpen={isPanelOpen}
              activePanelTab={activePanelTab}
              isTranscriptOpen={isTranscriptOpen}
              isLeavingRef={isLeavingRef}
            />
          </div>
        </div>

        {/* Side Panel for Host & Participants & Chat details */}
        <RoomSidePanel
          isPanelOpen={isPanelOpen}
          onClose={() => setIsPanelOpen(false)}
          activePanelTab={activePanelTab}
          setActivePanelTab={setActivePanelTab}
          isHost={isHost}
          currentUserId={currentUserId}
          waitingParticipants={waitingParticipants}
          dbParticipants={dbParticipants}
          handleApprove={handleApprove}
          handleReject={handleReject}
          handleRemoveParticipant={handleRemoveParticipant}
          getUserFullName={getUserFullName}
          chatMessages={chatMessages}
          send={send}
          isSending={isSending}
        />

        {/* Side Panel for Transcript / Captions */}
        {isTranscriptOpen && (
          <div className="w-1/4 border-l border-neutral-200 bg-white flex flex-col h-full gap-0 z-20 shrink-0 text-neutral-900 shadow-xl">
            <div className="p-2 border-b border-neutral-200 bg-neutral-50/50 flex items-center justify-between h-[45px] shrink-0">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 ml-2">Phụ đề</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-neutral-500 hover:text-neutral-900 shrink-0 cursor-pointer"
                onClick={() => setIsTranscriptOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden relative">
              <TranscriptSidePanel 
                segments={segments} 
                partialText={partialText} 
                status={transcriptStatus} 
                localParticipantName={localParticipant?.name || localParticipant?.identity || "Tôi"}
              />
            </div>
          </div>
        )}
      </div>
    </LayoutContextProvider>
  );
}


