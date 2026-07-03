"use client";

import { useEffect, useState } from "react";
import { Check, Mail, MessageSquare, X } from "lucide-react";

interface CommsModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  defaultMessage: string;
  releaseVersion: string;
  onSend: (channel: "Slack" | "Email") => void;
}

export function CommsModal({
  open,
  onClose,
  title,
  defaultMessage,
  releaseVersion,
  onSend,
}: CommsModalProps) {
  const [message, setMessage] = useState(defaultMessage);
  const [sent, setSent] = useState(false);
  const [channel, setChannel] = useState<"Slack" | "Email">("Slack");

  useEffect(() => {
    if (open) {
      setMessage(defaultMessage);
      setSent(false);
    }
  }, [open, defaultMessage]);

  if (!open) return null;

  const handleSend = () => {
    onSend(channel);
    setSent(true);
    setTimeout(() => {
      setSent(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {sent ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-success-50 flex items-center justify-center mb-3">
                <Check className="w-6 h-6 text-success-600" />
              </div>
              <p className="font-medium text-slate-900">Reminder queued</p>
              <p className="text-sm text-slate-500 mt-1">
                Sent to {channel === "Slack" ? "#release-ops" : "approvers"} for {releaseVersion}
              </p>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setChannel("Slack")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${
                    channel === "Slack"
                      ? "border-brand-500 bg-brand-50 text-brand-600"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  <MessageSquare className="w-4 h-4" /> Slack
                </button>
                <button
                  type="button"
                  onClick={() => setChannel("Email")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${
                    channel === "Email"
                      ? "border-brand-500 bg-brand-50 text-brand-600"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  <Mail className="w-4 h-4" /> Email
                </button>
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-3 text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />

              <p className="text-xs text-slate-400">
                Simulated send — message logged to release history and activity feed.
              </p>
            </>
          )}
        </div>

        {!sent && (
          <div className="flex justify-end gap-3 border-t border-slate-100 px-5 py-4">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50"
            >
              Send reminder
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
