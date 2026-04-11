import { useState, useRef, useCallback, useEffect } from "react";
import { autoCorrect } from "../../shared/auto-correct";
import type { AppVoiceContext, VoiceResult } from "../../shared/types";
import { useElectronAPI } from "./useElectronAPI";

// Sound effects using Web Audio API
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
      // Error - low buzz
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
  onResult: (result: VoiceResult) => void;
  onError?: (message: string) => void;
};

export function useSpeechRecognition({
  context,
  autoCopy,
  onResult,
  onError,
}: UseSpeechRecognitionOptions) {
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [interim, setInterim] = useState("");
  const recRef = useRef<any>(null);
  const api = useElectronAPI();

  const processWithAI = useCallback(
    async (rawText: string) => {
      setProcessing(true);
      setInterim("");
      try {
        // Check if API key is configured
        const settings = await api.getSettings();
        let voiceResult: VoiceResult;

        if (settings.apiKey) {
          // AI整形モード
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
          // ダイレクトモード（APIキーなし）— そのままコピー
          const corrected = autoCorrect(rawText);
          voiceResult = { cleaned: corrected };
          playSound("done");
        }

        if (autoCopy && voiceResult.cleaned) {
          await api.copyToClipboard(voiceResult.cleaned);
        }

        // Save to history
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
      }
    },
    [context, autoCopy, onResult, onError, api]
  );

  const start = useCallback(() => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      onError?.("音声認識が利用できません");
      return;
    }

    const rec = new SR();
    rec.lang = "ja-JP";
    rec.continuous = false;
    rec.interimResults = true;

    rec.onresult = (e: any) => {
      const result = e.results[e.results.length - 1];
      if (result.isFinal) {
        const raw = result[0].transcript;
        setListening(false);
        playSound("stop");
        processWithAI(raw);
      } else {
        setInterim(result[0].transcript);
      }
    };

    rec.onerror = (e: any) => {
      setListening(false);
      setInterim("");
      const errorMap: Record<string, string> = {
        "no-speech": "音声が検出されませんでした",
        "audio-capture": "マイクにアクセスできません",
        "not-allowed": "マイクの使用が許可されていません",
        network: "ネットワークエラー",
      };
      const msg = errorMap[e.error] || "音声認識エラー";
      playSound("error");
      onError?.(msg);
    };

    rec.onend = () => {
      setListening(false);
    };

    recRef.current = rec;
    rec.start();
    setListening(true);
    playSound("start");
  }, [processWithAI, onError]);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
    playSound("stop");
  }, []);

  const toggle = useCallback(() => {
    if (listening) {
      stop();
    } else {
      start();
    }
  }, [listening, start, stop]);

  // Listen for global shortcut from main process
  useEffect(() => {
    api.onToggleRecording(() => {
      toggle();
    });
  }, [api, toggle]);

  return { listening, processing, interim, toggle, start, stop };
}
