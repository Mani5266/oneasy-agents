"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { deepMergeFormData, type ExtractedDeedData } from "../lib/merge";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  onExtractedData: (data: ExtractedDeedData) => void;
  onClose: () => void;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  latestExtractedData: ExtractedDeedData;
  setLatestExtractedData: React.Dispatch<React.SetStateAction<ExtractedDeedData>>;
}

// ─── ChatPanel ───────────────────────────────────────────────────────────────

export function ChatPanel({
  onExtractedData,
  onClose,
  messages,
  setMessages,
  latestExtractedData,
  setLatestExtractedData,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const extractedCount = Object.keys(latestExtractedData).length;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending, transcribing]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setVoiceSupported(
      typeof window !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia &&
        typeof MediaRecorder !== "undefined"
    );
  }, []);

  useEffect(() => {
    return () => {
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
      if (mediaRecorderRef.current?.state === "recording")
        mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleSend = useCallback(
    async (overrideText?: string) => {
      const trimmed = (overrideText ?? input).trim();
      if (!trimmed || sending) return;

      if (!overrideText) setInput("");
      setError(null);

      const userMsg: ChatMessage = { role: "user", content: trimmed };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setSending(true);

      try {
        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const res = await fetch("/api/partnership/ai-intake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages,
            currentExtractedData: latestExtractedData,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errBody = await res
            .json()
            .catch(() => ({ error: `Request failed (${res.status})` }));
          throw new Error(errBody.error || `Request failed (${res.status})`);
        }

        const data = await res.json();

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message },
        ]);

        if (data.extractedData && typeof data.extractedData === "object") {
          setLatestExtractedData((prev) => {
            const merged = deepMergeFormData(prev, data.extractedData);
            return merged;
          });
          onExtractedData(data.extractedData);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again."
        );
      } finally {
        setSending(false);
        inputRef.current?.focus();
      }
    },
    [input, sending, messages, latestExtractedData, onExtractedData, setMessages, setLatestExtractedData]
  );

  const handleVoiceProcess = useCallback(
    async (blob: Blob) => {
      if (!blob || blob.size === 0) {
        setError("No audio detected. Please try again.");
        return;
      }

      setTranscribing(true);

      try {
        const formData = new FormData();
        formData.append("file", blob, "recording.webm");

        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const res = await fetch("/api/partnership/stt", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        if (!res.ok) {
          const errBody = await res
            .json()
            .catch(() => ({ error: `STT failed (${res.status})` }));
          throw new Error(errBody.error || `STT failed (${res.status})`);
        }

        const data = await res.json();

        if (!data.success || !data.text?.trim()) {
          setError("Couldn't understand audio. Please try again.");
          return;
        }

        await handleSend(data.text.trim());
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(
          err instanceof Error
            ? err.message
            : "Voice transcription failed. Please try typing instead."
        );
      } finally {
        setTranscribing(false);
      }
    },
    [handleSend]
  );

  const handleVoiceStart = useCallback(async () => {
    if (recording || sending || transcribing) return;
    setError(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        handleVoiceProcess(blob);
      };

      mediaRecorder.start();
      setRecording(true);

      autoStopTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          handleVoiceStop();
        }
      }, 30_000);
    } catch {
      setError(
        "Microphone access denied. Please allow microphone in browser settings."
      );
    }
  }, [recording, sending, transcribing, handleVoiceProcess]);

  const handleVoiceStop = useCallback(() => {
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }

    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    setRecording(false);
  }, []);

  return (
    <div className="chat-panel">
      {/* Header */}
      <div className="chat-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
          <h2 className="chat-panel-title">AI Assistant</h2>
          {extractedCount > 0 && (
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--warning)', background: 'var(--warning-bg)', padding: '2px 6px', borderRadius: '10px' }}>
              {extractedCount} field{extractedCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <button onClick={onClose} className="chat-panel-close" aria-label="Close AI panel">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: 'var(--space-8) 0' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" style={{ margin: '0 auto var(--space-3)', opacity: 0.4 }}>
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            </svg>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontWeight: 500 }}>
              Hi! I can help you fill in your partnership deed.
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-light)', marginTop: 'var(--space-1)' }}>
              Tell me about your business and partners, and I&apos;ll fill the form for you.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.role}`}>
            {msg.content}
          </div>
        ))}

        {sending && (
          <div className="chat-message assistant">
            <span className="spinner-small" style={{ marginRight: 'var(--space-2)' }} />
            Thinking...
          </div>
        )}

        {transcribing && (
          <div className="chat-message assistant">
            <span className="spinner-small" style={{ marginRight: 'var(--space-2)' }} />
            Transcribing...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ padding: '0 var(--space-3) var(--space-2)' }}>
          <div style={{ background: 'var(--error-bg)', border: '1px solid var(--error-border)', color: 'var(--error)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              style={{ background: 'none', border: 'none', color: 'var(--error)', fontSize: '10px', fontWeight: 600, cursor: 'pointer', marginLeft: 'var(--space-2)' }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="chat-input-area">
        <div className="chat-input-row">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              recording
                ? "Recording... click stop"
                : transcribing
                  ? "Transcribing..."
                  : "Tell me about your partnership..."
            }
            disabled={sending || recording || transcribing}
            style={{ flex: 1, padding: 'var(--space-3) var(--space-4)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-body)', color: 'var(--text-main)', background: 'var(--bg-card)', minHeight: '44px', transition: 'var(--transition)' }}
          />
          {voiceSupported && (
            <button
              onClick={recording ? handleVoiceStop : handleVoiceStart}
              disabled={sending || transcribing}
              className="chat-send-btn"
              style={{ background: recording ? 'var(--error)' : 'var(--bg-main)', color: recording ? '#fff' : 'var(--text-muted)' }}
              aria-label={recording ? "Stop recording" : "Start voice input"}
            >
              {recording ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" /></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              )}
            </button>
          )}
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || sending || recording || transcribing}
            className="chat-send-btn"
            aria-label="Send message"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22,2 15,22 11,13 2,9" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
