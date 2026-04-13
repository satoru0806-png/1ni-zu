import { useState, useRef, useCallback, useEffect } from "react";
import { autoCorrect } from "../../shared/auto-correct";
import type { AppVoiceContext, VoiceResult } from "../../shared/types";
import { useElectronAPI } from "./useElectronAPI";

function playSound(type: "start" | "stop" | "done" | "error") {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "start") {
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === "stop") {
      osc.frequency.setValueAtTime(900, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === "done") {
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime + 0.15);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else {
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch {
    // Ignore audio errors
  }
}

type UseSpeechRecognitionOptions = {
  context: AppVoiceContext;
  autoCopy: boolean;
  autoPaste: boolean;
  onResult: (result: VoiceResult) => void;
  onError?: (message: string) => void;
};

function pickMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  for (const t of candidates) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}

export function useSpeechRecognition({
  context,
  autoCopy,
  autoPaste,
  onResult,
  onError,
}: UseSpeechRecognitionOptions) {
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [interim, setInterim] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mimeTypeRef = useRef<string>("");
  const chunksRef = useRef<Blob[]>([]);
  const cancelRef = useRef(false);
  const api = useElectronAPI();

  const ensureStream = useCallback(async (): Promise<MediaStream | null> => {
    const existing = streamRef.current;
    if (existing && existing.getAudioTracks().some((t) => t.readyState === "live")) {
      return existing;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000,
        },
      });
      streamRef.current = stream;
      if (!mimeTypeRef.current) mimeTypeRef.current = pickMimeType();
      return stream;
    } catch (err: any) {
      const msg =
        err?.name === "NotAllowedError"
          ? "マイクの使用が許可されていません。システム設定 → プライバシーとセキュリティ → マイク で SpeakNote を許可してください"
          : "マイクにアクセスできません";
      playSound("error");
      onError?.(msg);
      return null;
    }
  }, [onError]);

  useEffect(() => {
    ensureStream();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [ensureStream]);

  const processWithAI = useCallback(
    async (rawText: string) => {
      setProcessing(true);
      setInterim("");
      try {
        const settings = await api.getSettings();
        let voiceResult: VoiceResult;

        if (settings.apiKey) {
          const result = await api.processVoice(rawText, context);
          voiceResult = {
            cleaned: result.cleaned || rawText,
            tasks: result.tasks,
            error: result.error,
          };
          if (result.error) {
            playSound("error");
            onError?.(result.error);
          } else {
            playSound("done");
          }
        } else {
          const corrected = autoCorrect(rawText);
          voiceResult = { cleaned: corrected };
          playSound("done");
        }

        if (autoCopy && voiceResult.cleaned) {
          await api.copyToClipboard(voiceResult.cleaned);
          if (autoPaste && !voiceResult.error) {
            await api.pasteToPreviousApp();
          }
        }

        await api.addHistory({
          id: Date.now().toString(),
          raw: rawText,
          cleaned: voiceResult.cleaned,
          tasks: voiceResult.tasks,
          context,
          timestamp: Date.now(),
        });

        onResult(voiceResult);
      } catch {
        const corrected = autoCorrect(rawText);
        playSound("error");
        onError?.("処理中にエラーが発生しました");
        onResult({ cleaned: corrected });
      } finally {
        setProcessing(false);
        api.setRecordingState("idle");
      }
    },
    [context, autoCopy, autoPaste, onResult, onError, api]
  );

  const finalize = useCallback(
    async (blob: Blob, mimeType: string) => {
      setListening(false);
      setProcessing(true);
      api.setRecordingState("processing");
      try {
        const buf = await blob.arrayBuffer();
        const { text, error } = await api.transcribeAudio(buf, mimeType);
        if (error) {
          playSound("error");
          onError?.(error);
          setProcessing(false);
          api.setRecordingState("idle");
          return;
        }
        if (!text) {
          playSound("error");
          onError?.("音声が検出されませんでした");
          setProcessing(false);
          api.setRecordingState("idle");
          return;
        }
        await processWithAI(text);
      } catch (err) {
        console.error("transcribe failed", err);
        playSound("error");
        onError?.("音声の転写に失敗しました");
        setProcessing(false);
        api.setRecordingState("idle");
      }
    },
    [api, onError, processWithAI]
  );

  const start = useCallback(async () => {
    const stream = await ensureStream();
    if (!stream) return;

    const mimeType = mimeTypeRef.current || pickMimeType();
    if (!mimeType) {
      playSound("error");
      onError?.("対応する音声形式がありません");
      return;
    }
    mimeTypeRef.current = mimeType;

    const recorder = new MediaRecorder(stream, {
      mimeType,
      audioBitsPerSecond: 128000,
    });
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      recorderRef.current = null;
      const blob = new Blob(chunksRef.current, { type: mimeType });
      chunksRef.current = [];
      if (cancelRef.current) {
        cancelRef.current = false;
        setListening(false);
        api.setRecordingState("idle");
        return;
      }
      if (blob.size === 0) {
        setListening(false);
        api.setRecordingState("idle");
        playSound("error");
        onError?.("録音データがありません");
        return;
      }
      playSound("stop");
      finalize(blob, mimeType);
    };

    recorderRef.current = recorder;
    cancelRef.current = false;
    recorder.start();
    setListening(true);
    api.setRecordingState("recording");
    playSound("start");
  }, [ensureStream, finalize, onError, api]);

  const stop = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") {
      rec.stop();
    } else {
      setListening(false);
    }
  }, []);

  const cancel = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") {
      cancelRef.current = true;
      rec.stop();
    }
  }, []);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  useEffect(() => {
    api.onToggleRecording(() => {
      toggle();
    });
    api.onCancelRecording(() => {
      cancel();
    });
  }, [api, toggle, cancel]);

  return { listening, processing, interim, toggle, start, stop };
}
