"use client";

import { ProgressLink } from "@/components/layout/NavigationProgress";
import { MaterioCard } from "@/components/materio/crm/MaterioCard";
import { StatusBadge } from "@/components/badges/StatusBadge";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import type { UnifiedRelease } from "@/lib/unified-releases";
import { formatDate } from "@/lib/utils";
import { Package } from "lucide-react";

export function FilteredReleasesTable({ releases }: { releases: UnifiedRelease[] }) {
  return (
    <MaterioCard
      title="Filtered releases"
      subheader="Releases matching your current filter and period selection"
      noPadding
    >
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Release ID</TableCell>
              <TableCell>Release Name</TableCell>
              <TableCell>Program / Project</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Release date</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Impact</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Application/s</TableCell>
              <TableCell>Dependent on release</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {releases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11}>
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    No releases match the selected filters for this period.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              releases.map((r) => (
                <TableRow key={`${r.source}-${r.id}`} hover>
                  <TableCell>
                    <ProgressLink href={r.href} className="font-mono text-xs text-brand-600 hover:underline">
                      {r.code}
                    </ProgressLink>
                  </TableCell>
                  <TableCell>
                    <ProgressLink href={r.href} className="hover:text-brand-600 font-medium">
                      {r.name}
                    </ProgressLink>
                  </TableCell>
                  <TableCell>{r.programProject ?? "N/A"}</TableCell>
                  <TableCell>{r.owner}</TableCell>
                  <TableCell>
                    <StatusBadge status={r.status as "Ready"} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(r.date)}
                    </Typography>
                  </TableCell>
                  <TableCell>{r.priority ?? "—"}</TableCell>
                  <TableCell>{r.impact ?? "—"}</TableCell>
                  <TableCell>{r.departmentName ?? r.group ?? "—"}</TableCell>
                  <TableCell>{r.applicationName ?? "—"}</TableCell>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                    {r.dependsOnLabel ?? "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {releases.length > 0 && (
        <div className="flex items-center gap-2 px-6 py-3 border-t border-gray-100 text-xs text-gray-500">
          <Package className="h-3.5 w-3.5" />
          Showing {releases.length} release{releases.length === 1 ? "" : "s"}
        </div>
      )}
    </MaterioCard>
  );
}
