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
  X,
  MessageCircle,
} from "lucide-react";
import { useParticipants, type ReceivedChatMessage } from "@livekit/components-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { CustomChatPanel } from "./CustomChatPanel";

interface RoomSidePanelProps {
  isPanelOpen: boolean;
  onClose: () => void;
  activePanelTab: "participants" | "chat";
  setActivePanelTab: (tab: "participants" | "chat") => void;
  isHost: boolean;
  currentUserId: string;
  waitingParticipants: any[];
  dbParticipants: any[];
  handleApprove: (id: string) => void;
  handleReject: (id: string) => void;
  handleRemoveParticipant: (id: string) => void;
  getUserFullName: (userId: string) => string;
  chatMessages: ReceivedChatMessage[];
  send: (message: string) => Promise<ReceivedChatMessage>;
  isSending: boolean;
}

export function RoomSidePanel({
  isPanelOpen,
  onClose,
  activePanelTab,
  setActivePanelTab,
  isHost,
  currentUserId,
  waitingParticipants,
  dbParticipants,
  handleApprove,
  handleReject,
  handleRemoveParticipant,
  getUserFullName,
  chatMessages,
  send,
  isSending,
}: RoomSidePanelProps) {
  const [showWaitingList, setShowWaitingList] = useState(false);
  const participants = useParticipants();

  if (!isPanelOpen) return null;

  return (
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
            onClick={onClose}
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
                            <span className="truncate max-w-[200px] font-medium text-neutral-800">
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
  );
}
