import { useEffect, useRef, useState } from "react";
import { useLocalParticipant, useParticipants } from "@livekit/components-react";
import { Track } from "livekit-client";
import { LocalTranscriptClient } from "@/services/local-transcript-client";
import { TRANSCRIPT_CONFIG, getBackendSseUrl, getLocalTranscriptWsUrl } from "@/config/transcript-config";
import { uploadTranscriptBatch, type TranscriptSegmentPayload } from "@/features/meetings/api/meetings";
import type { TranscriptSegment, LocalTranscriptStatus, TranscriptMessage, SseTranscriptEvent } from "@/types/transcript";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import keycloak from "@/config/keycloak";

export function useLocalTranscript(meetingId: string) {
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();
  
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [partialText, setPartialText] = useState<string>("");
  const [status, setStatus] = useState<LocalTranscriptStatus>({
    transcriptSocket: "closed",
    audioSocket: "closed",
    audioStreaming: false,
  });

  const clientRef = useRef<LocalTranscriptClient | null>(null);
  const localParticipantRef = useRef(localParticipant);
  const sseControllerRef = useRef<AbortController | null>(null);
  
  // Queue state refs to avoid React state re-render overhead for background tasks
  const pendingSegmentsRef = useRef<TranscriptSegmentPayload[]>([]);
  const isFlushingRef = useRef(false);
  const meetingIdRef = useRef(meetingId);

  // Sync refs
  useEffect(() => {
    localParticipantRef.current = localParticipant;
  }, [localParticipant]);

  useEffect(() => {
    meetingIdRef.current = meetingId;
  }, [meetingId]);

  // SSE subscription for other participants' transcripts
  useEffect(() => {
    if (!meetingId) return;

    // Abort any existing/pending SSE connection before starting a new one
    if (sseControllerRef.current) {
      console.log("[useLocalTranscript] Aborting previous active SSE connection before starting new one");
      sseControllerRef.current.abort();
      sseControllerRef.current = null;
    }

    const ctrl = new AbortController();
    sseControllerRef.current = ctrl;
    let isAborted = false;

    const connectSse = async () => {
      try {
        // Refresh token if needed before connecting
        try {
          await keycloak.updateToken(30);
        } catch (tokenErr) {
          console.error("[useLocalTranscript] SSE token update failed:", tokenErr);
        }

        // Check if aborted during token refresh delay
        if (isAborted || ctrl.signal.aborted) {
          console.log("[useLocalTranscript] SSE connection setup aborted after token update");
          return;
        }

        const token = keycloak.token;
        if (!token) {
          console.error("[useLocalTranscript] No keycloak token available for SSE connection");
          return;
        }

        const sseUrl = getBackendSseUrl(meetingId);
        console.log(`[useLocalTranscript] Connecting SSE to: ${sseUrl}`);

        await fetchEventSource(sseUrl, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "text/event-stream",
          },
          signal: ctrl.signal,
          openWhenHidden: true,
          async onopen(response) {
            if (isAborted || ctrl.signal.aborted) return;
            if (response.ok && response.headers.get("content-type")?.includes("text/event-stream")) {
              console.log("[useLocalTranscript] SSE stream connected successfully");
              return;
            }
            console.error(`[useLocalTranscript] SSE connection failed with status ${response.status}`);
          },
          onmessage(msg) {
            if (isAborted || ctrl.signal.aborted) return;
            if (msg.event === "transcript.segment.created") {
              try {
                const data = JSON.parse(msg.data) as SseTranscriptEvent;
                console.log("[useLocalTranscript] SSE transcript received:", data);

                // Ignore if it's the current user's own transcript
                if (data.userId === keycloak.subject) {
                  console.log("[useLocalTranscript] Ignoring own transcript echoed from SSE");
                  return;
                }

                setSegments((prev) => {
                  // Deduplicate by segmentId
                  const exists = prev.some((s) => s.id === data.segmentId);
                  if (exists) {
                    return prev;
                  }

                  const name = [data.lastName, data.firstName].filter(Boolean).join(" ").trim() || data.username || "Other Participant";
                  
                  // Format timestamp
                  let formattedTime = "";
                  try {
                    const date = new Date(data.createdAt || data.clientCreatedAt || Date.now());
                    formattedTime = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                  } catch (e) {
                    formattedTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                  }

                  const newSegment: TranscriptSegment = {
                    id: data.segmentId,
                    speakerId: data.userId || data.participantId,
                    speakerName: name,
                    text: data.text || "",
                    timestamp: formattedTime,
                    isMe: false,
                  };

                  const updated = [...prev, newSegment];
                  if (updated.length > TRANSCRIPT_CONFIG.MAX_VISIBLE_SEGMENTS) {
                    return updated.slice(updated.length - TRANSCRIPT_CONFIG.MAX_VISIBLE_SEGMENTS);
                  }
                  return updated;
                });

              } catch (parseErr) {
                console.error("[useLocalTranscript] Error parsing SSE message data:", parseErr);
              }
            }
          },
          onclose() {
            if (isAborted || ctrl.signal.aborted) {
              console.log("[useLocalTranscript] SSE connection closed intentionally via AbortController");
              return;
            }
            console.log("[useLocalTranscript] SSE connection closed by server");
          },
          onerror(err) {
            if (isAborted || ctrl.signal.aborted || err?.name === "AbortError") {
              console.log("[useLocalTranscript] SSE connection aborted intentionally, skipping retry");
              return; // return void to stop fetch-event-source automatic retries
            }
            console.error("[useLocalTranscript] SSE stream error:", err);
            throw err;
          }
        });

      } catch (err: any) {
        if (isAborted || ctrl.signal.aborted || err?.name === "AbortError") {
          console.log("[useLocalTranscript] SSE connection aborted intentionally, skipping execution error logging");
          return;
        }
        console.error("[useLocalTranscript] SSE fetchEventSource execution error:", err);
      }
    };

    connectSse();

    return () => {
      console.log("[useLocalTranscript] Cleaning up SSE stream connection");
      isAborted = true;
      ctrl.abort();
      if (sseControllerRef.current === ctrl) {
        sseControllerRef.current = null;
      }
    };
  }, [meetingId]);


  // Flush pending segments to backend
  const flushBatch = async () => {
    const currentMeetingId = meetingIdRef.current;
    if (!currentMeetingId || pendingSegmentsRef.current.length === 0 || isFlushingRef.current) {
      return;
    }

    isFlushingRef.current = true;
    
    // Take up to 50 segments to avoid large payloads
    const batch = pendingSegmentsRef.current.slice(0, 50);
    console.log(`[useLocalTranscript] Flushing ${batch.length} segments to backend`);

    try {
      await uploadTranscriptBatch(currentMeetingId, { segments: batch });
      
      // Remove successfully sent items from queue
      const sentIds = new Set(batch.map((s) => s.segmentId));
      pendingSegmentsRef.current = pendingSegmentsRef.current.filter(
        (s) => !sentIds.has(s.segmentId)
      );
      console.log("[useLocalTranscript] Flush batch success");
    } catch (err) {
      console.error("[useLocalTranscript] Flush batch failed:", err);
    } finally {
      isFlushingRef.current = false;
    }
  };

  // Initialize client and background batch interval on mount
  useEffect(() => {
    const handlePartial = (msg: TranscriptMessage) => {
      setPartialText(msg.text || "");
    };

    const handleFinal = (msg: TranscriptMessage) => {
      setPartialText("");
      const text = msg.text?.trim();
      if (!text) return;

      const participant = localParticipantRef.current;
      const speakerId = participant?.identity || "me";
      const speakerName = participant?.name || participant?.identity || "Tôi";
      const segmentId = crypto.randomUUID();
      const now = new Date().toISOString();

      // Add to React state for local UI
      const newSegment: TranscriptSegment = {
        id: segmentId,
        speakerId: speakerId,
        speakerName: speakerName,
        text: text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        isMe: true,
      };

      setSegments((prev) => {
        const updated = [...prev, newSegment];
        if (updated.length > TRANSCRIPT_CONFIG.MAX_VISIBLE_SEGMENTS) {
          return updated.slice(updated.length - TRANSCRIPT_CONFIG.MAX_VISIBLE_SEGMENTS);
        }
        return updated;
      });

      // Add to background pending queue
      const payload: TranscriptSegmentPayload = {
        segmentId,
        text,
        latencyMsFromFirstAudio: msg.latencyMsFromFirstAudio,
        tokenCount: msg.tokenCount,
        totalTokensEmitted: msg.totalTokensEmitted,
        clientCreatedAt: now,
      };
      pendingSegmentsRef.current.push(payload);

      // If queue reaches 10 segments, flush immediately
      if (pendingSegmentsRef.current.length >= 10) {
        flushBatch().catch(console.error);
      }
    };

    const handleStatusChange = (newStatus: LocalTranscriptStatus) => {
      setStatus(newStatus);
    };

    const client = new LocalTranscriptClient({
      baseUrl: getLocalTranscriptWsUrl(),
      onPartial: handlePartial,
      onFinal: handleFinal,
      onStatusChange: handleStatusChange,
      onError: (err) => {
        console.error("[useLocalTranscript] Client error:", err);
      },
    });

    clientRef.current = client;
    client.connect();

    // Periodic flush interval
    const intervalId = setInterval(() => {
      flushBatch().catch(console.error);
    }, 5000);

    return () => {
      console.log("[useLocalTranscript] Component unmounted, cleaning up interval & client");
      clearInterval(intervalId);
      client.disconnect();
      clientRef.current = null;

      // Final unmount flush
      if (pendingSegmentsRef.current.length > 0 && !isFlushingRef.current) {
        const finalBatch = [...pendingSegmentsRef.current];
        const currentMeetingId = meetingIdRef.current;
        if (currentMeetingId) {
          uploadTranscriptBatch(currentMeetingId, { segments: finalBatch })
            .then(() => {
              console.log("[useLocalTranscript] Final unmount flush success");
            })
            .catch((err) => {
              console.error("[useLocalTranscript] Final unmount flush failed:", err);
            });
        }
      }
    };
  }, []);

  // Monitor microphone track publication and streaming status
  useEffect(() => {
    const client = clientRef.current;
    if (!client) return;

    // Get the audio track publication
    const trackPublication = localParticipant.getTrackPublication(Track.Source.Microphone);
    const audioTrack = trackPublication?.audioTrack;
    const isMuted = audioTrack?.isMuted ?? false;
    const mediaStreamTrack = audioTrack?.mediaStreamTrack;

    if (isMicrophoneEnabled && mediaStreamTrack && !isMuted) {
      console.log("[useLocalTranscript] Microphone is active, starting audio pipeline");
      const mediaStream = new MediaStream([mediaStreamTrack]);
      client.startAudio(mediaStream).catch((err) => {
        console.error("[useLocalTranscript] Error starting audio:", err);
      });
    } else {
      console.log("[useLocalTranscript] Microphone is muted or disabled, stopping audio pipeline");
      client.stopAudio();
    }
  }, [localParticipant, isMicrophoneEnabled, localParticipant.audioTrackPublications]);

  const participants = useParticipants();

  const clearTranscripts = () => {
    setSegments([]);
    setPartialText("");
  };

  // Map segments to resolve custom display names from LiveKit room participants
  const mappedSegments = segments.map((seg) => {
    if (seg.isMe) {
      return {
        ...seg,
        speakerName: localParticipant?.name || seg.speakerName,
      };
    }
    const found = participants.find((p) => p.identity === seg.speakerId);
    return {
      ...seg,
      speakerName: found?.name || seg.speakerName,
    };
  });

  return {
    segments: mappedSegments,
    partialText,
    status,
    clearTranscripts,
    flushRemaining: flushBatch, // Expose flush helper if parent wants to trigger it manually
  };
}
