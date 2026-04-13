import { useEffect, useRef } from "react";

// Voice Activity Detection: ストリームを監視し、発話開始/終了で onStart/onStop を呼ぶ
// 録音中 (busy=true) は監視をスキップし、無音検出中はカウントダウン

type Options = {
  enabled: boolean;
  busy: boolean; // 既に録音中 (重複起動防止)
  silenceMs: number;
  onStart: () => void;
  onSilence: () => void; // 無音継続後のコールバック (録音停止に使う)
};

const RMS_THRESHOLD = 0.012; // 概ね -38dB 程度
const MIN_SPEECH_FRAMES = 3; // 連続フレーム数 (~50ms × 3)

export function useVAD({
  enabled,
  busy,
  silenceMs,
  onStart,
  onSilence,
}: Options) {
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const speechFramesRef = useRef(0);
  const silenceStartRef = useRef<number | null>(null);
  const busyRef = useRef(busy);

  useEffect(() => {
    busyRef.current = busy;
    if (busy) {
      silenceStartRef.current = null;
    }
  }, [busy]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    const setup = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const ctx = new AudioContext();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        source.connect(analyser);

        streamRef.current = stream;
        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
        sourceRef.current = source;

        const buf = new Float32Array(analyser.fftSize);
        const tick = () => {
          if (cancelled || !analyserRef.current) return;
          analyser.getFloatTimeDomainData(buf);
          let sumSq = 0;
          for (let i = 0; i < buf.length; i++) sumSq += buf[i] * buf[i];
          const rms = Math.sqrt(sumSq / buf.length);

          if (busyRef.current) {
            // 録音中: 無音検出 → onSilence
            if (rms < RMS_THRESHOLD) {
              if (silenceStartRef.current === null) {
                silenceStartRef.current = performance.now();
              } else if (performance.now() - silenceStartRef.current >= silenceMs) {
                silenceStartRef.current = null;
                onSilence();
              }
            } else {
              silenceStartRef.current = null;
            }
            speechFramesRef.current = 0;
          } else {
            // 待機中: 発話検出 → onStart
            if (rms >= RMS_THRESHOLD) {
              speechFramesRef.current++;
              if (speechFramesRef.current >= MIN_SPEECH_FRAMES) {
                speechFramesRef.current = 0;
                onStart();
              }
            } else {
              speechFramesRef.current = 0;
            }
            silenceStartRef.current = null;
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch (err) {
        console.error("VAD setup failed:", err);
      }
    };
    setup();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      sourceRef.current?.disconnect();
      analyserRef.current?.disconnect();
      audioCtxRef.current?.close().catch(() => {});
      streamRef.current?.getTracks().forEach((t) => t.stop());
      sourceRef.current = null;
      analyserRef.current = null;
      audioCtxRef.current = null;
      streamRef.current = null;
      speechFramesRef.current = 0;
      silenceStartRef.current = null;
    };
  }, [enabled, silenceMs, onStart, onSilence]);
}
