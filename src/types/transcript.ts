export type TranscriptMessage = {
  type: "partial" | "final";
  text: string;
  latencyMsFromFirstAudio?: number;
  tokenCount?: number;
  totalTokensEmitted?: number;
};

export type LocalTranscriptStatus = {
  transcriptSocket: "closed" | "connecting" | "open" | "error";
  audioSocket: "closed" | "connecting" | "open" | "error";
  audioStreaming: boolean;
};

export interface TranscriptSegment {
  id: string;
  speakerId: string;
  speakerName: string;
  text: string;
  timestamp: string; // HH:MM:SS format
  isMe: boolean;
}

export interface SseTranscriptEvent {
  id: string;
  meetingId: string;
  participantId: string;
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  segmentId: string;
  text: string;
  latencyMsFromFirstAudio?: number;
  tokenCount?: number;
  totalTokensEmitted?: number;
  clientCreatedAt: string;
  createdAt: string;
}

