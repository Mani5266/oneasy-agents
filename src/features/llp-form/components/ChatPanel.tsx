"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles, Loader2, X } from "lucide-react";
import type { LLPData } from "@/features/llp/types";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  onExtractedData: (data: Partial<LLPData>) => void;
  onClose: () => void;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  extractedData: Partial<LLPData>;
  setExtractedData: React.Dispatch<React.SetStateAction<Partial<LLPData>>>;
}

export function ChatPanel({ onExtractedData, onClose, messages, setMessages, extractedData, setExtractedData }: Props) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const extractedCount = Object.keys(extractedData).length;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setInput("");
    setError(null);

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const newMessages = [...messagesRef.current, userMsg];
    setMessages(newMessages);
    setSending(true);

    try {
      const res = await fetch("/api/llp-form/ai-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, currentExtractedData: extractedData }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || "Request failed");
      }

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);

      if (data.extractedData && typeof data.extractedData === "object") {
        setExtractedData((prev) => ({ ...prev, ...data.extractedData }));
        onExtractedData(data.extractedData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [input, sending, extractedData, onExtractedData, setMessages, setExtractedData]);

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50/80 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold-500" />
          <h2 className="text-sm font-bold text-navy-950">AI Assistant</h2>
          {extractedCount > 0 && (
            <span className="text-[10px] font-semibold text-gold-600 bg-gold-100 px-1.5 py-0.5 rounded-full">
              {extractedCount} field{extractedCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Close AI panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-navy-950 text-white rounded-br-md"
                    : "bg-slate-100 text-slate-700 rounded-bl-md"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="bg-slate-100 rounded-2xl rounded-bl-md px-3.5 py-2.5">
                <div className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                  <span className="text-xs text-slate-400 font-medium">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-3 pb-2 shrink-0">
          <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-xs flex items-center justify-between">
            <span className="line-clamp-2">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 text-[10px] font-semibold ml-2 shrink-0"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="border-t border-slate-200 px-3 py-2.5 bg-white shrink-0 pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))]">
        <div className="flex items-end gap-1.5">
          <textarea
            ref={inputRef}
            rows={1}
            inputMode="text"
            autoComplete="off"
            autoCorrect="off"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              const el = e.target;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 120) + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
                const el = e.target as HTMLTextAreaElement;
                el.style.height = "auto";
              }
            }}
            placeholder="Describe your LLP details..."
            disabled={sending}
            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-base lg:text-[13px]
              focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-500
              hover:border-slate-300 transition-all duration-150
              bg-white disabled:opacity-50 disabled:cursor-not-allowed min-w-0
              resize-none overflow-y-auto leading-snug"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="p-2 rounded-lg bg-navy-950 text-white hover:bg-navy-900
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-150 focus:outline-none shrink-0"
            aria-label="Send message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
