"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  onExtractedData: (data: Record<string, string>) => void;
  onClose: () => void;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  extractedData: Record<string, string>;
  setExtractedData: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export function OfferChatPanel({ onExtractedData, onClose, messages, setMessages, extractedData, setExtractedData }: Props) {
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
      const res = await fetch("/api/offer-letter/ai-intake", {
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
    <div className="ol-chat-panel">
      {/* Header */}
      <div className="ol-chat-header">
        <div className="ol-chat-header-left">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          <span className="ol-chat-title">AI Assistant</span>
          {extractedCount > 0 && (
            <span className="ol-chat-badge">{extractedCount} field{extractedCount !== 1 ? "s" : ""}</span>
          )}
        </div>
        <button onClick={onClose} className="ol-chat-close" aria-label="Close AI panel">&times;</button>
      </div>

      {/* Messages */}
      <div className="ol-chat-messages">
        {messages.length === 0 && (
          <div className="ol-chat-welcome">
            <p><strong>Tell me about the offer letter</strong> you want to create.</p>
            <p>For example: &ldquo;Create an offer for Priya as Product Manager at Acme Corp, 18 LPA, joining July 1st&rdquo;</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`ol-chat-msg ol-chat-msg--${msg.role}`}>
            <div className="ol-chat-bubble">{msg.content}</div>
          </div>
        ))}
        {sending && (
          <div className="ol-chat-msg ol-chat-msg--assistant">
            <div className="ol-chat-bubble ol-chat-thinking">
              <span className="ol-chat-dots"><span></span><span></span><span></span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="ol-chat-error">
          <span>{error}</span>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Input */}
      <div className="ol-chat-input-bar">
        <textarea
          ref={inputRef}
          rows={1}
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
              (e.target as HTMLTextAreaElement).style.height = "auto";
            }
          }}
          placeholder="Describe the offer letter details..."
          disabled={sending}
          className="ol-chat-textarea"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="ol-chat-send"
          aria-label="Send"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  );
}
