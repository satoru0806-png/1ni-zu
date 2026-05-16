"use client";
import { useEffect, useRef } from "react";

/**
 * SpeakNote 連携: WebSocket で SpeakNote (PC版) からテキストを直接受信し、
 * focused element に挿入する。
 *
 * フォーカス問題対策として、最後にフォーカスしたテキスト入力要素を記憶し、
 * paste 受信時に document.activeElement が無効でもそこに挿入する。
 */
export function SpeakNotePaste() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 最後にフォーカスしたテキスト入力要素 + そのカーソル位置を記憶
  const lastFocusedRef = useRef<{
    el: HTMLInputElement | HTMLTextAreaElement | HTMLElement;
    selStart: number;
    selEnd: number;
    isContentEditable: boolean;
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let closed = false;

    // フォーカス追跡: テキスト入力可能要素のフォーカスを記憶
    const focusInHandler = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        lastFocusedRef.current = {
          el: target,
          selStart: target.selectionStart ?? target.value.length,
          selEnd: target.selectionEnd ?? target.value.length,
          isContentEditable: false,
        };
      } else if (target.isContentEditable) {
        lastFocusedRef.current = {
          el: target,
          selStart: 0,
          selEnd: 0,
          isContentEditable: true,
        };
      }
    };
    // selectionchange でカーソル位置も追跡
    const selectionChangeHandler = () => {
      const active = document.activeElement;
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
        lastFocusedRef.current = {
          el: active,
          selStart: active.selectionStart ?? active.value.length,
          selEnd: active.selectionEnd ?? active.value.length,
          isContentEditable: false,
        };
      }
    };

    document.addEventListener("focusin", focusInHandler, true);
    document.addEventListener("selectionchange", selectionChangeHandler);

    const insertTextToTarget = (text: string) => {
      if (!text) return;

      // 優先順位: 1. document.activeElement が input/textarea
      //          2. 最後にフォーカスした要素
      let target: HTMLInputElement | HTMLTextAreaElement | HTMLElement | null = null;
      let selStart = 0, selEnd = 0;
      let isCE = false;

      const active = document.activeElement;
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
        target = active;
        selStart = active.selectionStart ?? active.value.length;
        selEnd = active.selectionEnd ?? active.value.length;
      } else if (active instanceof HTMLElement && active.isContentEditable) {
        target = active;
        isCE = true;
      } else if (lastFocusedRef.current) {
        // フォールバック: 最後にフォーカスした要素を使用
        const cached = lastFocusedRef.current;
        target = cached.el;
        selStart = cached.selStart;
        selEnd = cached.selEnd;
        isCE = cached.isContentEditable;
        // フォーカスを戻す
        try { (target as HTMLElement).focus(); } catch {}
      }

      if (!target) {
        console.warn("[SpeakNotePaste] insert先が見つからない（lastFocused なし）");
        return;
      }

      console.log("[SpeakNotePaste] insert先:", target.tagName, "text:", text.substring(0, 30));

      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        const newValue = target.value.slice(0, selStart) + text + target.value.slice(selEnd);
        const proto = target instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
        const nativeSetter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
        if (nativeSetter) {
          nativeSetter.call(target, newValue);
          target.dispatchEvent(new Event("input", { bubbles: true }));
        } else {
          target.value = newValue;
        }
        const cursor = selStart + text.length;
        target.setSelectionRange(cursor, cursor);
        // 記憶も更新
        lastFocusedRef.current = {
          el: target,
          selStart: cursor,
          selEnd: cursor,
          isContentEditable: false,
        };
      } else if (isCE) {
        // contenteditable
        target.focus();
        document.execCommand("insertText", false, text);
      }
    };

    const connect = () => {
      if (closed) return;
      try {
        const ws = new WebSocket("ws://localhost:3457/");
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("[SpeakNotePaste] WebSocket 接続成功");
          ws.send(JSON.stringify({ type: "register_external", client: "yumenavi" }));
        };

        ws.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);
            if (msg.type === "external_paste" && typeof msg.text === "string") {
              insertTextToTarget(msg.text);
            } else if (msg.type === "registered") {
              console.log("[SpeakNotePaste] 登録完了");
            }
          } catch {}
        };

        ws.onclose = () => {
          wsRef.current = null;
          if (closed) return;
          reconnectTimer.current = setTimeout(connect, 5000);
        };

        ws.onerror = () => {};
      } catch {
        if (!closed) reconnectTimer.current = setTimeout(connect, 5000);
      }
    };

    // F19 フォールバック
    const f19Handler = async (e: KeyboardEvent) => {
      if (e.key !== "F19") return;
      e.preventDefault();
      e.stopPropagation();
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;
      try {
        const text = await navigator.clipboard.readText();
        if (text) insertTextToTarget(text);
      } catch (err) {
        console.warn("[SpeakNotePaste] clipboard read failed:", err);
      }
    };

    connect();
    window.addEventListener("keydown", f19Handler, { capture: true });

    return () => {
      closed = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        try { wsRef.current.close(); } catch {}
      }
      document.removeEventListener("focusin", focusInHandler, true);
      document.removeEventListener("selectionchange", selectionChangeHandler);
      window.removeEventListener("keydown", f19Handler, { capture: true });
    };
  }, []);

  return null;
}
