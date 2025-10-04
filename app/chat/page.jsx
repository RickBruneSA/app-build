"use client";
import { useState } from "react";

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { role: "system", content: "You are a helpful assistant." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  async function send() {
    if (!input.trim()) return;
    setError("");
    const next = [...messages, { role: "user", content: input.trim() }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");

      setMessages([...next, { role: "assistant", content: data.content ?? "" }]);
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function onKey(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") send();
  }

  return (
    <main style={{ maxWidth: 760, margin: "40px auto", padding: 24, fontFamily: "system-ui", lineHeight: 1.5 }}>
      <h1>Chat</h1>

      <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, marginBottom: 16, background: "#fafafa" }}>
        {messages.filter(m => m.role !== "system").map((m, i) => (
          <div key={i} style={{ margin: "8px 0" }}>
            <strong>{m.role === "user" ? "You" : "Assistant"}:</strong>{" "}
            <span>{m.content}</span>
          </div>
        ))}
        {loading && <div style={{ opacity: 0.7 }}>…thinking</div>}
        {error && <div style={{ color: "crimson" }}>Error: {error}</div>}
      </div>

      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={onKey}
        rows={3}
        placeholder="Type a message… (Ctrl/Cmd+Enter to send)"
        style={{ width: "100%", padding: 12, borderRadius: 6, border: "1px solid #ddd" }}
      />
      <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
        <button onClick={send} disabled={loading || !input.trim()} style={{ padding: "8px 12px" }}>
          Send
        </button>
        <button onClick={() => setMessages(messages.slice(0, 1))} disabled={loading} style={{ padding: "8px 12px" }}>
          Clear
        </button>
      </div>
    </main>
  );
}
