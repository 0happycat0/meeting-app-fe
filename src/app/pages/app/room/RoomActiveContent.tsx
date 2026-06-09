import React, { useState } from "react";
import {
  Users,
  Hourglass,
  UserCheck,
  UserX,
  Video,
  VideoOff,
  Mic,
  MicOff,
  MoreVertical,
  Trash2,
  LayoutGrid,
  Info,
  X,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  useParticipants,
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
} from "@livekit/components-react";
import { RoomEvent, Track } from "livekit-client";
import type { TrackReferenceOrPlaceholder } from "@livekit/components-core";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

import {
  useMeetingParticipants,
  useRemoveParticipant,
} from "@/features/meetings/api/use-meetings";
import type { Meeting } from "@/types/entities/meeting";

import { CustomControlBar } from "./CustomControlBar";
import { CustomChatPanel } from "./CustomChatPanel";

// Helper to safely compare track references
const isSameTrack = (a?: any, b?: any) => {
  if (!a || !b) return a === b;
  return a.participant.identity === b.participant.identity && a.source === b.source;
};

interface RoomActiveContentProps {
  meeting: Meeting;
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
  const [showWaitingList, setShowWaitingList] = useState(false);

  const participants = useParticipants();
  const { chatMessages, send, isSending } = useChat();

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
                setActivePanelTab("participants");
              }}
              onOpenChat={() => {
                setIsPanelOpen(true);
                setActivePanelTab("chat");
              }}
              onEndMeeting={handleEndMeeting}
              isPanelOpen={isPanelOpen}
              activePanelTab={activePanelTab}
              isLeavingRef={isLeavingRef}
            />
          </div>
        </div>

        {/* Side Panel for Host & Participants & Chat details */}
        {isPanelOpen && (
          <div className="w-1/4 border-l border-neutral-200 bg-white flex flex-col h-full gap-0 z-20 shrink-0 text-neutral-900 shadow-xl">
            <Tabs
              value={activePanelTab}
              onValueChange={(v) => setActivePanelTab(v as any)}
              className="flex flex-col flex-1 h-full"
            >
              <div className="p-2 border-b border-neutral-200 bg-neutral-50/50 flex items-center justify-between">
                <TabsList variant="line" className="flex-1 mr-2 grid grid-cols-2">
                  <TabsTrigger value="participants" className="flex items-center gap-1.5 text-xs font-semibold px-2">
                    <Users className="size-3.5" />
                    Thành viên ({participants.length})
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="flex items-center gap-1.5 text-xs font-semibold px-2">
                    <MessageCircle className="size-3.5" />
                    Chat
                  </TabsTrigger>
                </TabsList>

                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-neutral-500 hover:text-neutral-900 shrink-0 cursor-pointer"
                  onClick={() => setIsPanelOpen(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-hidden relative">
                {/* Participants List & Waiting list inside same tab */}
                <TabsContent value="participants" className="h-full m-0 flex flex-col">
                  <ScrollArea className="h-full p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 truncate">
                          {showWaitingList ? "Yêu cầu chờ duyệt" : "Trong phòng họp"}
                        </h3>
                        {isHost && (
                          <Button
                            variant={showWaitingList ? "default" : "outline"}
                            size="sm"
                            className="h-7 px-2 text-[10px] font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                            onClick={() => setShowWaitingList(!showWaitingList)}
                          >
                            <Hourglass className="size-3 shrink-0" />
                            <span>Chờ duyệt</span>
                            {waitingParticipants.length > 0 && (
                              <span className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 ${showWaitingList ? "bg-white text-black" : "bg-red-500 text-white animate-pulse"}`}>
                                {waitingParticipants.length}
                              </span>
                            )}
                          </Button>
                        )}
                      </div>

                      {showWaitingList ? (
                        <div className="space-y-3">
                          {waitingParticipants.length === 0 ? (
                            <p className="text-xs text-neutral-500 italic py-4">Không có yêu cầu nào đang chờ.</p>
                          ) : (
                            waitingParticipants.map((p) => (
                              <Card key={p.id} className="py-0 border border-neutral-400 text-neutral-900 shadow-none">
                                <CardContent className="p-3 space-y-3">
                                  <div className="flex flex-col">
                                    <span className="text-md font-semibold text-neutral-800">{getUserFullName(p.userId)}</span>
                                    <span className="text-xs text-neutral-500 font-semibold mt-0.5">
                                      Nguồn: {p.joinSource === "JOIN_CODE" ? "Tham gia bằng mã" : p.joinSource === "INVITATION" ? "Tham gia từ lời mời" : p.joinSource}
                                    </span>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleApprove(p.id)}
                                      className="flex-1 text-xs font-semibold h-7 cursor-pointer"
                                    >
                                      <UserCheck className="size-3.5 mr-1" />
                                      Duyệt
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleReject(p.id)}
                                      className="flex-1 text-xs font-semibold h-7 cursor-pointer"
                                    >
                                      <UserX className="size-3.5 mr-1" />
                                      Từ chối
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {participants.map((p) => {
                            const dbParticipant = dbParticipants.find((dp) => dp.userId === p.identity);
                            const participantRecordId = dbParticipant?.id;
                            const canRemove = isHost && p.identity !== currentUserId && participantRecordId;

                            return (
                              <div key={p.sid} className="flex items-center justify-between text-sm py-2 border-b border-neutral-100">
                                <span className="flex items-center gap-2">
                                  <span className="truncate max-w-[140px] font-medium text-neutral-800">
                                    {p.name || p.identity} {p.identity === currentUserId && "(Bạn)"}
                                  </span>
                                </span>
                                <div className="flex items-center gap-2">
                                  {p.isCameraEnabled ? (
                                    <Video className="size-3.5 text-neutral-400" />
                                  ) : (
                                    <VideoOff className="size-3.5 text-red-500" />
                                  )}
                                  {p.isMicrophoneEnabled ? (
                                    <Mic className={`size-3.5 ${p.isSpeaking ? "text-green-500 animate-pulse font-bold" : "text-neutral-400"}`} />
                                  ) : (
                                    <MicOff className="size-3.5 text-red-500" />
                                  )}

                                  {canRemove && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="size-6 text-neutral-500 hover:text-neutral-900 cursor-pointer">
                                          <MoreVertical className="size-3.5" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="bg-white border border-neutral-200 text-neutral-900 shadow-md">
                                        <DropdownMenuItem
                                          onClick={() => handleRemoveParticipant(participantRecordId)}
                                          className="text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer flex items-center gap-1.5"
                                        >
                                          <Trash2 className="size-3.5" />
                                          Xóa khỏi cuộc họp
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* Chat Panel */}
                <TabsContent value="chat" className="h-full m-0 flex flex-col">
                  <CustomChatPanel chatMessages={chatMessages} send={send} isSending={isSending} />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        )}
      </div>
    </LayoutContextProvider>
  );
}


