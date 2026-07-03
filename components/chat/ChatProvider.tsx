"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface ChatContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((o) => !o), []);
  return (
    <ChatContext.Provider value={{ open, setOpen, toggle }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
