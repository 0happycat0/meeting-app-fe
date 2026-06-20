export const TRANSCRIPT_CONFIG = {
  BASE_URL: "ws://127.0.0.1:9001",
  TRANSCRIPT_PATH: "/transcript",
  AUDIO_PATH: "/audioPhisical",
  TARGET_SAMPLE_RATE: 16000,
  RECONNECT_INTERVALS: [1000, 2000, 5000],
  MAX_VISIBLE_SEGMENTS: 150,
};

export const getBackendSseUrl = (meetingId: string) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${cleanBase}/meetings/${meetingId}/transcript-events`;
};

export const getLocalTranscriptWsUrl = () => {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const localWs = params.get("local_ws");
    if (localWs) return localWs;
    
    const localIp = params.get("local_ip");
    if (localIp) return `ws://${localIp}:9001`;
  }
  return TRANSCRIPT_CONFIG.BASE_URL;
};


