import { TRANSCRIPT_CONFIG } from "@/config/transcript-config";
import type { TranscriptMessage, LocalTranscriptStatus } from "@/types/transcript";

export interface LocalTranscriptClientOptions {
  baseUrl?: string;
  onPartial?: (message: TranscriptMessage) => void;
  onFinal?: (message: TranscriptMessage) => void;
  onStatusChange?: (status: LocalTranscriptStatus) => void;
  onError?: (error: any) => void;
}

export class LocalTranscriptClient {
  private baseUrl: string;
  private options: LocalTranscriptClientOptions;
  
  private transcriptWs: WebSocket | null = null;
  private audioWs: WebSocket | null = null;
  
  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private fallbackResampler: ((input: Float32Array) => ArrayBuffer) | null = null;
  
  private sentBytes = 0;
  private isExplicitlyDisconnected = false;
  private activeMediaStream: MediaStream | null = null;
  
  private status: LocalTranscriptStatus = {
    transcriptSocket: "closed",
    audioSocket: "closed",
    audioStreaming: false,
  };
  
  private reconnectCountTranscript = 0;
  private reconnectCountAudio = 0;
  private reconnectTimerTranscript: any = null;
  private reconnectTimerAudio: any = null;

  constructor(options: LocalTranscriptClientOptions) {
    this.options = options;
    this.baseUrl = options.baseUrl || TRANSCRIPT_CONFIG.BASE_URL;
  }

  private updateStatus(updates: Partial<LocalTranscriptStatus>) {
    this.status = { ...this.status, ...updates };
    if (this.options.onStatusChange) {
      this.options.onStatusChange({ ...this.status });
    }
  }

  public getStatus(): LocalTranscriptStatus {
    return { ...this.status };
  }

  public getSentBytes(): number {
    return this.sentBytes;
  }

  public async connect(): Promise<void> {
    this.isExplicitlyDisconnected = false;
    this.connectTranscript();
    this.connectAudio();
  }

  private connectTranscript() {
    if (this.transcriptWs) {
      try { this.transcriptWs.close(); } catch (_) {}
    }

    const url = `${this.baseUrl}${TRANSCRIPT_CONFIG.TRANSCRIPT_PATH}`;
    console.log(`[TranscriptClient] Connecting transcript WebSocket to: ${url}`);
    
    this.updateStatus({ transcriptSocket: "connecting" });
    
    try {
      this.transcriptWs = new WebSocket(url);
      
      this.transcriptWs.onopen = () => {
        console.log("[TranscriptClient] Transcript WebSocket connected");
        this.reconnectCountTranscript = 0;
        this.updateStatus({ transcriptSocket: "open" });
      };
      
      this.transcriptWs.onclose = (event) => {
        console.warn(`[TranscriptClient] Transcript WebSocket closed: code=${event.code}`);
        this.updateStatus({ transcriptSocket: "closed" });
        this.transcriptWs = null;
        this.handleReconnectTranscript();
      };
      
      this.transcriptWs.onerror = (err) => {
        console.error("[TranscriptClient] Transcript WebSocket error:", err);
        this.updateStatus({ transcriptSocket: "error" });
        if (this.options.onError) {
          this.options.onError(err);
        }
      };
      
      this.transcriptWs.onmessage = (event) => {
        this.handleTranscriptMessage(event.data);
      };
    } catch (error) {
      console.error("[TranscriptClient] Failed to construct Transcript WebSocket:", error);
      this.updateStatus({ transcriptSocket: "error" });
      this.handleReconnectTranscript();
    }
  }

  private connectAudio() {
    if (this.audioWs) {
      try { this.audioWs.close(); } catch (_) {}
    }

    const url = `${this.baseUrl}${TRANSCRIPT_CONFIG.AUDIO_PATH}`;
    console.log(`[TranscriptClient] Connecting audio WebSocket to: ${url}`);
    
    this.updateStatus({ audioSocket: "connecting" });
    
    try {
      this.audioWs = new WebSocket(url);
      this.audioWs.binaryType = "arraybuffer";
      
      this.audioWs.onopen = () => {
        console.log("[TranscriptClient] Audio WebSocket connected");
        this.reconnectCountAudio = 0;
        this.updateStatus({ audioSocket: "open" });
        
        // If we have an active stream waiting, resume streaming
        if (this.activeMediaStream) {
          this.startAudioProcessing(this.activeMediaStream).catch((err) => {
            console.error("[TranscriptClient] Failed to resume audio streaming:", err);
          });
        }
      };
      
      this.audioWs.onclose = (event) => {
        console.warn(`[TranscriptClient] Audio WebSocket closed: code=${event.code}`);
        this.updateStatus({ audioSocket: "closed", audioStreaming: false });
        this.audioWs = null;
        this.stopAudioPipelineOnly();
        this.handleReconnectAudio();
      };
      
      this.audioWs.onerror = (err) => {
        console.error("[TranscriptClient] Audio WebSocket error:", err);
        this.updateStatus({ audioSocket: "error" });
        if (this.options.onError) {
          this.options.onError(err);
        }
      };
      
      this.audioWs.onmessage = (event) => {
        console.log(`[TranscriptClient] Audio WebSocket message: ${event.data}`);
      };
    } catch (error) {
      console.error("[TranscriptClient] Failed to construct Audio WebSocket:", error);
      this.updateStatus({ audioSocket: "error" });
      this.handleReconnectAudio();
    }
  }

  private handleReconnectTranscript() {
    if (this.isExplicitlyDisconnected) return;
    
    if (this.reconnectTimerTranscript) {
      clearTimeout(this.reconnectTimerTranscript);
    }
    
    const intervals = TRANSCRIPT_CONFIG.RECONNECT_INTERVALS;
    const delay = intervals[Math.min(this.reconnectCountTranscript, intervals.length - 1)];
    this.reconnectCountTranscript++;
    
    console.log(`[TranscriptClient] Reconnecting transcript in ${delay}ms (attempt ${this.reconnectCountTranscript})`);
    this.reconnectTimerTranscript = setTimeout(() => {
      this.connectTranscript();
    }, delay);
  }

  private handleReconnectAudio() {
    if (this.isExplicitlyDisconnected) return;
    
    if (this.reconnectTimerAudio) {
      clearTimeout(this.reconnectTimerAudio);
    }
    
    const intervals = TRANSCRIPT_CONFIG.RECONNECT_INTERVALS;
    const delay = intervals[Math.min(this.reconnectCountAudio, intervals.length - 1)];
    this.reconnectCountAudio++;
    
    console.log(`[TranscriptClient] Reconnecting audio in ${delay}ms (attempt ${this.reconnectCountAudio})`);
    this.reconnectTimerAudio = setTimeout(() => {
      this.connectAudio();
    }, delay);
  }

  private handleTranscriptMessage(rawData: string) {
    try {
      const data = JSON.parse(rawData);
      if (data.type === "partial" && this.options.onPartial) {
        this.options.onPartial(data);
      } else if (data.type === "final" && this.options.onFinal) {
        this.options.onFinal(data);
      }
    } catch (err) {
      console.error("[TranscriptClient] Error parsing transcript message:", err, rawData);
    }
  }

  public async startAudio(mediaStream: MediaStream): Promise<void> {
    this.activeMediaStream = mediaStream;
    
    if (!this.audioWs || this.audioWs.readyState !== WebSocket.OPEN) {
      console.warn("[TranscriptClient] Audio WebSocket is not connected. Audio will stream once socket opens.");
      return;
    }
    
    await this.startAudioProcessing(mediaStream);
  }

  private async startAudioProcessing(mediaStream: MediaStream): Promise<void> {
    this.stopAudioPipelineOnly();
    
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      
      this.sourceNode = this.audioContext.createMediaStreamSource(mediaStream);
      
      try {
        await this.startAudioWorkletPipeline();
        console.log(`[TranscriptClient] Audio pipeline started using AudioWorklet. sampleRate=${this.audioContext.sampleRate}`);
      } catch (workletError) {
        console.warn(`[TranscriptClient] AudioWorklet failed, using fallback ScriptProcessorNode:`, workletError);
        this.startScriptProcessorFallback();
        console.log(`[TranscriptClient] Audio pipeline started using ScriptProcessor fallback. sampleRate=${this.audioContext?.sampleRate}`);
      }
      
      this.updateStatus({ audioStreaming: true });
    } catch (err) {
      console.error("[TranscriptClient] Failed to start audio processing:", err);
      this.updateStatus({ audioStreaming: false });
      if (this.options.onError) {
        this.options.onError(err);
      }
    }
  }

  private async startAudioWorkletPipeline(): Promise<void> {
    if (!this.audioContext || !this.sourceNode) return;
    
    const workletCode = this.getWorkletCode();
    const blob = new Blob([workletCode], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    
    try {
      await this.audioContext.audioWorklet.addModule(url);
    } finally {
      URL.revokeObjectURL(url);
    }
    
    this.workletNode = new AudioWorkletNode(this.audioContext, "pcm16-resampler", {
      processorOptions: {
        inputSampleRate: this.audioContext.sampleRate,
        outputSampleRate: TRANSCRIPT_CONFIG.TARGET_SAMPLE_RATE,
      },
    });
    
    this.workletNode.port.onmessage = (event) => {
      this.sendBinaryAudio(event.data);
    };
    
    this.sourceNode.connect(this.workletNode);
    this.workletNode.connect(this.audioContext.destination);
  }

  private startScriptProcessorFallback() {
    if (!this.audioContext || !this.sourceNode) return;
    
    const inputSampleRate = this.audioContext.sampleRate;
    const outputSampleRate = TRANSCRIPT_CONFIG.TARGET_SAMPLE_RATE;
    
    this.fallbackResampler = this.createResampler(inputSampleRate, outputSampleRate);
    this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
    
    this.scriptProcessor.onaudioprocess = (event) => {
      if (!this.fallbackResampler) return;
      const inputBuffer = event.inputBuffer.getChannelData(0);
      const pcmBuffer = this.fallbackResampler(inputBuffer);
      this.sendBinaryAudio(pcmBuffer);
    };
    
    this.sourceNode.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.audioContext.destination);
  }

  private sendBinaryAudio(buffer: ArrayBuffer) {
    if (this.audioWs && this.audioWs.readyState === WebSocket.OPEN && buffer.byteLength > 0) {
      this.audioWs.send(buffer);
      this.sentBytes += buffer.byteLength;
    }
  }

  private createResampler(inputSampleRate: number, outputSampleRate: number) {
    const ratio = inputSampleRate / outputSampleRate;
    let pending: number[] = [];
    let position = 0;
    
    return (input: Float32Array): ArrayBuffer => {
      for (let i = 0; i < input.length; i++) {
        pending.push(input[i]);
      }
      
      const out: number[] = [];
      while (position + 1 < pending.length) {
        const i0 = Math.floor(position);
        const i1 = i0 + 1;
        const frac = position - i0;
        out.push(pending[i0] + (pending[i1] - pending[i0]) * frac);
        position += ratio;
      }
      
      const consumed = Math.floor(position);
      if (consumed > 0) {
        pending = pending.slice(consumed);
        position -= consumed;
      }
      
      const buffer = new ArrayBuffer(out.length * 2);
      const view = new DataView(buffer);
      for (let i = 0; i < out.length; i++) {
        const s = Math.max(-1, Math.min(1, out[i]));
        const pcm = s < 0 ? s * 0x8000 : s * 0x7fff;
        view.setInt16(i * 2, pcm, true);
      }
      
      return buffer;
    };
  }

  private stopAudioPipelineOnly() {
    if (this.workletNode) {
      try { this.workletNode.disconnect(); } catch (_) {}
      this.workletNode = null;
    }
    
    if (this.scriptProcessor) {
      try { this.scriptProcessor.disconnect(); } catch (_) {}
      this.scriptProcessor.onaudioprocess = null;
      this.scriptProcessor = null;
    }
    
    if (this.sourceNode) {
      try { this.sourceNode.disconnect(); } catch (_) {}
      this.sourceNode = null;
    }
    
    if (this.audioContext) {
      try { this.audioContext.close(); } catch (_) {}
      this.audioContext = null;
    }
    
    this.fallbackResampler = null;
  }

  public stopAudio(): void {
    this.activeMediaStream = null;
    this.stopAudioPipelineOnly();
    this.updateStatus({ audioStreaming: false });
  }

  public disconnect(): void {
    this.isExplicitlyDisconnected = true;
    
    if (this.reconnectTimerTranscript) {
      clearTimeout(this.reconnectTimerTranscript);
      this.reconnectTimerTranscript = null;
    }
    if (this.reconnectTimerAudio) {
      clearTimeout(this.reconnectTimerAudio);
      this.reconnectTimerAudio = null;
    }
    
    this.stopAudio();
    
    if (this.transcriptWs) {
      try { this.transcriptWs.close(); } catch (_) {}
      this.transcriptWs = null;
    }
    
    if (this.audioWs) {
      try { this.audioWs.close(); } catch (_) {}
      this.audioWs = null;
    }
    
    this.updateStatus({
      transcriptSocket: "closed",
      audioSocket: "closed",
      audioStreaming: false,
    });
    
    this.reconnectCountTranscript = 0;
    this.reconnectCountAudio = 0;
    this.sentBytes = 0;
    console.log("[TranscriptClient] Disconnected successfully");
  }

  private getWorkletCode(): string {
    return `
      class Pcm16Resampler extends AudioWorkletProcessor {
        constructor(options) {
          super();
          this.inputSampleRate = options.processorOptions.inputSampleRate;
          this.outputSampleRate = options.processorOptions.outputSampleRate;
          this.ratio = this.inputSampleRate / this.outputSampleRate;
          this.pending = [];
          this.position = 0;
        }

        process(inputs) {
          const input = inputs[0];
          if (!input || !input[0] || input[0].length === 0) {
            return true;
          }

          const channel = input[0];
          for (let i = 0; i < channel.length; i++) {
            this.pending.push(channel[i]);
          }

          const out = [];
          while (this.position + 1 < this.pending.length) {
            const i0 = Math.floor(this.position);
            const i1 = i0 + 1;
            const frac = this.position - i0;
            const sample = this.pending[i0] + (this.pending[i1] - this.pending[i0]) * frac;
            out.push(sample);
            this.position += this.ratio;
          }

          const consumed = Math.floor(this.position);
          if (consumed > 0) {
            this.pending = this.pending.slice(consumed);
            this.position -= consumed;
          }

          if (out.length > 0) {
            const buffer = new ArrayBuffer(out.length * 2);
            const view = new DataView(buffer);
            for (let i = 0; i < out.length; i++) {
              const s = Math.max(-1, Math.min(1, out[i]));
              const pcm = s < 0 ? s * 0x8000 : s * 0x7fff;
              view.setInt16(i * 2, pcm, true);
            }
            this.port.postMessage(buffer, [buffer]);
          }

          return true;
        }
      }

      registerProcessor("pcm16-resampler", Pcm16Resampler);
    `;
  }
}
