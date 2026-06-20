import React, { useState, useEffect } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ReceivedChatMessage } from "@livekit/components-react";

interface CustomChatPanelProps {
  chatMessages: ReceivedChatMessage[];
  send: (message: string) => Promise<ReceivedChatMessage>;
  isSending: boolean;
}

export function CustomChatPanel({ chatMessages, send, isSending }: CustomChatPanelProps) {
  const [messageText, setMessageText] = useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!messageText.trim() || isSending) return;
    try {
      await send(messageText);
      setMessageText("");
      // Auto focus back to input after sending
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } catch (err) {
      toast.error("Không thể gửi tin nhắn.");
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-full bg-white text-neutral-900 overflow-hidden">
      <ScrollArea className="flex-1 px-4 min-h-0">
        <div className="space-y-4 pb-4 flex flex-col w-full">
          {chatMessages.map((msg, index) => (
            <div key={`${msg.from?.identity || ""}_${msg.timestamp}_${index}`} className="flex flex-col space-y-1 self-start w-full">
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold text-neutral-700 truncate">
                  {msg.from?.name || msg.from?.identity || "Người dùng"}
                  {msg.from?.isLocal && " (tôi)"}
                </span>
                <span className="text-[10px] text-neutral-400 shrink-0 ml-2">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
              <p className={`text-sm p-2 rounded-lg break-all whitespace-pre-wrap w-fit max-w-[80%] ${
                msg.from?.isLocal
                  ? "bg-primary text-primary-foreground"
                  : "bg-neutral-100 text-neutral-800"
              }`}>
                {msg.message}
              </p>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
      <form onSubmit={handleSend} className="p-3 border-t border-neutral-200 items-center bg-neutral-50 flex gap-2">
        <Input
          ref={inputRef}
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Nhập tin nhắn..."
          className="bg-white text-xs flex-1"
          disabled={isSending}
        />
        <Button variant="ghost" type="submit" disabled={isSending || !messageText.trim()} size="icon" className="text-xs cursor-pointer shrink-0">
          <Send className="size-5 text-blue-400" />
        </Button>
      </form>
    </div>
  );
}
