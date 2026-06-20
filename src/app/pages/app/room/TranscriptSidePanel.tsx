import React, { useEffect, useRef } from "react";
import { AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TranscriptSegment, LocalTranscriptStatus } from "@/types/transcript";
import { Spinner } from "@/components/ui/spinner";

interface TranscriptSidePanelProps {
  segments: TranscriptSegment[];
  partialText: string;
  status: LocalTranscriptStatus;
  localParticipantName: string;
}

export function TranscriptSidePanel({ segments, partialText, status, localParticipantName }: TranscriptSidePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new transcripts
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [segments, partialText]);

  const isConnecting = status.transcriptSocket === "connecting" || status.audioSocket === "connecting";
  const isConnected = status.transcriptSocket === "open" && status.audioSocket === "open";
  const isDisconnected = !isConnecting && !isConnected;

  return (
    <div className="flex flex-col h-full bg-white text-neutral-900 overflow-hidden">
      {/* Scrollable Transcript Area */}
      <ScrollArea className="flex-1 px-4 min-h-0">
        <div className="space-y-4 py-4 flex flex-col w-full">
          {/* Connection Status Messaging */}
          {isConnecting && (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-500 space-y-2">
              <Spinner className="size-6" />
              <p className="text-xs font-medium">Đang kết nối dịch vụ phụ đề...</p>
            </div>
          )}

          {isDisconnected && (
            <div className="flex flex-col items-center justify-center py-12 text-red-500 space-y-2 text-center px-4">
              <AlertCircle className="size-6" />
              <p className="text-xs font-semibold">Không thể kết nối tới dịch vụ phụ đề.</p>
              <p className="text-[10px] text-neutral-400">Vui lòng kiểm tra lại dịch vụ chạy trên thiết bị.</p>
            </div>
          )}

          {isConnected && segments.length === 0 && !partialText && (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
              <p className="text-xs italic">Chưa có phụ đề.</p>
            </div>
          )}

          {/* Transcript bubble list */}
          {isConnected && (
            <>
              {segments.map((seg) => (
                <div key={seg.id} className="flex flex-col space-y-1 self-start w-full">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-neutral-700 truncate">
                      {seg.speakerName}
                      {seg.isMe && " (tôi)"}
                    </span>
                    <span className="text-[10px] text-neutral-400 shrink-0 ml-2">
                      {seg.timestamp}
                    </span>
                  </div>
                  <p
                    className={`text-sm p-2 rounded-lg break-words whitespace-pre-wrap w-fit max-w-[75%] ${
                      seg.isMe
                        ? "bg-primary text-primary-foreground"
                        : "bg-neutral-100 text-neutral-800"
                    }`}
                  >
                    {seg.text}
                  </p>
                </div>
              ))}

              {/* Real-time partial text bubble */}
              {partialText && (
                <div className="flex flex-col space-y-1 self-start w-full">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-blue-600 truncate animate-pulse">
                      {localParticipantName} (Đang nói...)
                    </span>
                  </div>
                  <p className="text-sm p-2 rounded-lg break-words whitespace-pre-wrap w-fit max-w-[75%] bg-primary/70 text-primary-foreground italic">
                    {partialText}
                  </p>
                </div>
              )}
            </>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
