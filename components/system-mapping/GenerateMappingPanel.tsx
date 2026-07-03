"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { Check, RefreshCw, Sparkles, X } from "lucide-react";
import { MappingDiagramMini } from "@/components/system-mapping/MappingDiagramMini";
import { MappingEdgeTable } from "@/components/system-mapping/MappingEdgeTable";
import type { ResolvedSuggestion } from "@/lib/system-mapping-types";
import { cn } from "@/lib/utils";

type GenerateMappingPanelProps = {
  open: boolean;
  canEdit: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function GenerateMappingPanel({ open, canEdit, onClose, onSaved }: GenerateMappingPanelProps) {
  const [notes, setNotes] = useState("");
  const [refinement, setRefinement] = useState("");
  const [groupName, setGroupName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [resolved, setResolved] = useState<ResolvedSuggestion[]>([]);
  const [usedAi, setUsedAi] = useState(false);

  const resetDraft = () => {
    setNotes("");
    setRefinement("");
    setGroupName("");
    setResolved([]);
    setMessage(null);
    setUsedAi(false);
  };

  const handleClose = () => {
    resetDraft();
    onClose();
  };

  const generate = async (sourceNotes: string) => {
    setGenerating(true);
    setMessage(null);
    try {
      const res = await fetch("/api/system-mapping/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: sourceNotes }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Could not generate mapping." });
        return;
      }
      setResolved(data.resolved ?? []);
      setUsedAi(!!data.usedAi);
      setMessage({ type: "success", text: data.message ?? "Suggestions ready for review." });
    } catch {
      setMessage({ type: "error", text: "Request failed — please try again." });
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerate = () => generate(notes);

  const handleRefine = () => {
    const combined = [notes, refinement.trim()].filter(Boolean).join("\n\nRefinement:\n");
    generate(combined);
  };

  const handleReject = () => {
    setResolved([]);
    setRefinement("");
    setGroupName("");
    setMessage({ type: "success", text: "Suggestions discarded. Adjust notes and generate again." });
  };

  const handleAcceptSave = async () => {
    if (!groupName.trim()) {
      setMessage({ type: "error", text: "Enter a name for this mapping group." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/system-mapping/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: groupName.trim(),
          sourceNotes: notes.trim() || null,
          edges: resolved.map((e) => ({
            sourceAppId: e.sourceAppId,
            sourceEnvId: e.sourceEnvId,
            targetAppId: e.targetAppId,
            targetEnvId: e.targetEnvId,
            direction: e.direction,
            notes: e.notes,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Could not save mapping group." });
        return;
      }
      onSaved();
      handleClose();
    } catch {
      setMessage({ type: "error", text: "Save failed — please try again." });
    } finally {
      setSaving(false);
    }
  };

  const tableEdges = resolved.map((e, i) => ({
    id: `draft-${i}`,
    sourceAppId: e.sourceAppId,
    sourceEnvId: e.sourceEnvId,
    targetAppId: e.targetAppId,
    targetEnvId: e.targetEnvId,
    direction: e.direction,
    notes: e.notes,
    sourceApp: { name: e.sourceApp },
    sourceEnv: { name: e.sourceEnv },
    targetApp: { name: e.targetApp },
    targetEnv: { name: e.targetEnv },
  }));

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={handleClose} aria-hidden />
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-white shadow-2xl",
          "sm:w-[520px] md:w-[640px]"
        )}
      >
        <Box sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
              <Sparkles size={20} />
              Add new mapping
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Describe upstream/downstream links — Release Desk suggests a diagram you can refine before saving.
            </Typography>
          </Box>
          <IconButton onClick={handleClose} aria-label="Close">
            <X size={18} />
          </IconButton>
        </Box>

        <textarea
          className="w-full min-h-[120px] rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          placeholder="e.g. FIN UAT consumes SAP TEST; CRM DEV depends on Oracle DEV for billing reconciliation..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={!canEdit}
        />

        {canEdit && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<Sparkles size={16} />}
            onClick={handleGenerate}
            disabled={!notes.trim() || generating}
            sx={{ alignSelf: "flex-start", mb: 2 }}
          >
            {generating ? "Generating…" : "Generate diagram"}
          </Button>
        )}

        {message && (
          <Typography
            variant="body2"
            sx={{ mb: 2, color: message.type === "success" ? "success.main" : "error.main" }}
          >
            {message.text}
          </Typography>
        )}

        {resolved.length > 0 && (
          <Box sx={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Suggested mapping {usedAi ? "(AI-assisted)" : "(from notes)"}
            </Typography>
            <MappingDiagramMini edges={tableEdges} height={240} />
            <MappingEdgeTable edges={tableEdges} />

            <textarea
              className="w-full min-h-[72px] rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder="e.g. Add upstream link from CRM UAT to SAP TEST..."
              value={refinement}
              onChange={(e) => setRefinement(e.target.value)}
              disabled={!canEdit}
            />

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {canEdit && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshCw size={16} />}
                    onClick={handleRefine}
                    disabled={!refinement.trim() || generating}
                  >
                    Regenerate with changes
                  </Button>
                  <Button variant="outlined" color="inherit" startIcon={<X size={16} />} onClick={handleReject}>
                    Reject
                  </Button>
                </>
              )}
            </Box>

            {canEdit && (
              <Box sx={{ mt: 1, pt: 2, borderTop: 1, borderColor: "divider" }}>
                <input
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 mb-2"
                  placeholder="e.g. Q3 integration test path"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<Check size={16} />}
                  onClick={handleAcceptSave}
                  disabled={saving || !groupName.trim()}
                >
                  {saving ? "Saving…" : "Accept & save mapping"}
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Box>
      </aside>
    </>
  );
}
