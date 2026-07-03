"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { LayoutGrid, List, Plus, Trash2 } from "lucide-react";
import { AdvancedCard } from "@/components/ui/advanced-card";
import { MappingDiagramMini } from "@/components/system-mapping/MappingDiagramMini";
import { MappingEdgeTable } from "@/components/system-mapping/MappingEdgeTable";
import type { MappingGroupRow } from "@/lib/system-mapping-types";
import { formatDate } from "@/lib/utils";

type CurrentMappingSectionProps = {
  groups: MappingGroupRow[];
  canEdit: boolean;
  onAddNew: () => void;
  onDeleteGroup: (id: string) => void;
  highlightEdgeId?: string | null;
};

export function CurrentMappingSection({
  groups,
  canEdit,
  onAddNew,
  onDeleteGroup,
  highlightEdgeId,
}: CurrentMappingSectionProps) {
  const [viewMode, setViewMode] = useState<"diagram" | "table">("diagram");

  return (
    <AdvancedCard
      title="Current system mapping"
      subtitle="Trusted source — which environment of each application maps to upstream/downstream applications"
      icon={LayoutGrid}
      variant="glass"
      action={
        canEdit ? (
          <Button variant="contained" color="primary" size="small" startIcon={<Plus size={16} />} onClick={onAddNew}>
            Add new mapping
          </Button>
        ) : undefined
      }
    >
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <Button
          size="small"
          variant={viewMode === "diagram" ? "contained" : "outlined"}
          startIcon={<LayoutGrid size={14} />}
          onClick={() => setViewMode("diagram")}
        >
          Diagrams
        </Button>
        <Button
          size="small"
          variant={viewMode === "table" ? "contained" : "outlined"}
          startIcon={<List size={14} />}
          onClick={() => setViewMode("table")}
        >
          Table
        </Button>
      </Box>

      {groups.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No saved mapping groups yet. Click &quot;Add new mapping&quot; to generate one from notes.
        </Typography>
      )}

      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.id} className="rounded-2xl border border-gray-100 bg-white/80 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {group.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {group.edges.length} edge{group.edges.length === 1 ? "" : "s"} · Updated {formatDate(group.updatedAt)}
                </Typography>
                {group.sourceNotes && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontStyle: "italic" }}>
                    {group.sourceNotes}
                  </Typography>
                )}
              </div>
              {canEdit && group.id !== "legacy-default" && (
                <IconButton size="small" color="error" onClick={() => onDeleteGroup(group.id)} aria-label="Delete group">
                  <Trash2 size={16} />
                </IconButton>
              )}
            </div>

            {viewMode === "diagram" ? (
              <MappingDiagramMini edges={group.edges} highlightEdgeId={highlightEdgeId} />
            ) : (
              <MappingEdgeTable edges={group.edges} />
            )}
          </div>
        ))}
      </div>
    </AdvancedCard>
  );
}
