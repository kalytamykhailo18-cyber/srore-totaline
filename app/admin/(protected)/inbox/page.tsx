"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { HiPaperAirplane, HiPaperClip, HiArrowLeft, HiLightningBolt } from "react-icons/hi";

interface Chat {
  chatId: string;
  contactName: string;
  contactPhone: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
  aiPaused: boolean;
}

interface Message {
  id: number;
  chatId: string;
  direction: string;
  body: string;
  sender: string;
  mediaType: string | null;
  mediaUrl: string | null;
  timestamp: string;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}

export default function InboxPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [quickReplies, setQuickReplies] = useState<Array<{ shortcut: string; body: string }>>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(false);

  const loadChats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/inbox");
      const d = await res.json();
      setChats(d.chats || []);
    } catch {}
  }, []);

  const loadMessages = useCallback(async (chatId: string) => {
    try {
      const res = await fetch(`/api/admin/inbox?chatId=${chatId}`);
      const d = await res.json();
      setMessages(d.messages || []);
    } catch {}
  }, []);

  useEffect(() => { loadChats(); }, [loadChats]);

  // Poll for new messages
  useEffect(() => {
    const interval = setInterval(() => {
      loadChats();
      if (selectedChat) loadMessages(selectedChat);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedChat, loadChats, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function selectChat(chatId: string) {
    setSelectedChat(chatId);
    loadMessages(chatId);
  }

  async function sendMessage() {
    if (!input.trim() || !selectedChat || sending) return;
    setSending(true);
    try {
      await fetch("/api/admin/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: selectedChat, message: input }),
      });
      setInput("");
      loadMessages(selectedChat);
      loadChats();
    } catch {}
    setSending(false);
  }

  async function uploadFile(file: File) {
    if (!selectedChat) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/admin/inbox/upload", { method: "POST", body: formData });
      const data = await uploadRes.json();
      if (!data.ok) { alert(data.error); setUploading(false); return; }

      // Send via WhatsApp with media
      await fetch("/api/admin/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: selectedChat, message: "", mediaUrl: data.url, mediaType: data.mediaType }),
      });
      loadMessages(selectedChat);
    } catch {}
    setUploading(false);
  }

  async function toggleAI() {
    if (!selectedChat) return;
    const chat = chats.find((c) => c.chatId === selectedChat);
    await fetch("/api/admin/inbox", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId: selectedChat, aiPaused: !chat?.aiPaused }),
    });
    loadChats();
  }

  function handleInputChange(val: string) {
    setInput(val);
    setShowQuickReplies(val.startsWith("/") && val.length > 0);
  }

  function applyQuickReply(body: string) {
    setInput(body);
    setShowQuickReplies(false);
  }

  const selectedChatData = chats.find((c) => c.chatId === selectedChat);
  const filteredChats = chats.filter((c) =>
    !search || c.contactName.toLowerCase().includes(search.toLowerCase()) || c.contactPhone.includes(search)
  );

  return (
    <div className="flex h-[calc(100vh-56px)] bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Chat list */}
      <div className={`${selectedChat ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 border-r`}>
        <div className="p-3 border-b">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conversacion..."
            className="w-full px-3 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-400" />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredChats.map((chat) => (
            <button key={chat.chatId} onClick={() => selectChat(chat.chatId)}
              className={`w-full text-left px-4 py-3 border-b flex items-center gap-3 hover:bg-gray-50 transition-colors ${selectedChat === chat.chatId ? "bg-blue-50" : ""}`}>
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-sm shrink-0">
                {chat.contactName?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-900 truncate">{chat.contactName || chat.contactPhone || chat.chatId}</span>
                  <span className="text-xs text-gray-400">{timeAgo(chat.lastMessageAt)}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
              </div>
              {chat.unread > 0 && (
                <span className="bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shrink-0">{chat.unread}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Messages area */}
      <div className={`${selectedChat ? "flex" : "hidden md:flex"} flex-col flex-1`}>
        {selectedChat ? (
          <>
            {/* Chat header */}
            <div className="px-4 py-3 border-b flex items-center gap-3 bg-white">
              <button onClick={() => setSelectedChat(null)} className="md:hidden text-gray-500">
                <HiArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{selectedChatData?.contactName || selectedChatData?.chatId}</p>
                <p className="text-xs text-gray-400">{selectedChatData?.contactPhone}</p>
              </div>
              <button onClick={toggleAI}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg ${selectedChatData?.aiPaused ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                {selectedChatData?.aiPaused ? "IA Pausada" : "IA Activa"}
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 bg-gray-50 space-y-2">
              {messages.map((msg) => {
                const isOut = msg.direction === "out";
                const bgColor = isOut ? (msg.sender === "bot" ? "bg-blue-100" : "bg-green-100") : "bg-white";
                return (
                  <div key={msg.id} className={`flex ${isOut ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] ${bgColor} rounded-lg px-3 py-2 shadow-sm`}>
                      {msg.mediaUrl && msg.mediaType === "image" && (
                        <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer">
                          <img src={msg.mediaUrl} alt="" className="max-h-48 rounded mb-1" />
                        </a>
                      )}
                      {msg.mediaUrl && msg.mediaType === "video" && (
                        <video src={msg.mediaUrl} controls className="max-h-48 rounded mb-1" />
                      )}
                      {msg.mediaUrl && msg.mediaType === "audio" && (
                        <audio src={msg.mediaUrl} controls className="mb-1" />
                      )}
                      {msg.mediaUrl && msg.mediaType === "document" && (
                        <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs underline block mb-1">
                          Descargar documento
                        </a>
                      )}
                      {msg.body && <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.body}</p>}
                      <p className="text-[10px] text-gray-400 mt-0.5 text-right">
                        {msg.sender === "bot" ? "Bot" : msg.sender === "human" ? "" : ""}
                        {" "}{new Date(msg.timestamp).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick replies dropdown */}
            {showQuickReplies && quickReplies.length > 0 && (
              <div className="border-t bg-white max-h-40 overflow-y-auto">
                {quickReplies.filter((q) => q.shortcut.includes(input.slice(1))).map((q) => (
                  <button key={q.shortcut} onClick={() => applyQuickReply(q.body)}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 border-b">
                    <span className="text-blue-600 font-medium">/{q.shortcut}</span>
                    <span className="text-gray-500 ml-2 truncate">{q.body.substring(0, 60)}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Composer */}
            <div className="px-3 py-2 border-t bg-white flex items-center gap-2">
              <input type="file" ref={fileRef} className="hidden" accept="image/*,video/*,audio/*,.pdf"
                onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])} />
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50">
                <HiPaperClip className="w-5 h-5" />
              </button>
              <input type="text" value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder={uploading ? "Subiendo..." : "Escribir mensaje..."}
                disabled={sending || uploading}
                className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-400 disabled:opacity-50" />
              <button onClick={sendMessage} disabled={!input.trim() || sending}
                className="p-2 text-blue-500 hover:text-blue-600 disabled:opacity-30">
                <HiPaperAirplane className="w-5 h-5 rotate-90" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p>Selecciona una conversacion</p>
          </div>
        )}
      </div>
    </div>
  );
}
