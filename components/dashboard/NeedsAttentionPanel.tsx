"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { MaterioCard } from "@/components/materio/crm/MaterioCard";
import { SourceBadgeInline } from "@/components/dashboard/UnifiedPortfolioPanel";
import { formatDate } from "@/lib/utils";
import type { NeedsAttentionItem } from "@/lib/needs-attention";

function statusChipColor(status: string): "success" | "warning" | "error" | "default" {
  const s = status.toLowerCase();
  if (s.includes("block")) return "error";
  if (s.includes("risk")) return "warning";
  return "default";
}

export function NeedsAttentionPanel({
  items,
  viewAllHref = "/releases?attention=1",
  showViewAll = true,
}: {
  items: NeedsAttentionItem[];
  viewAllHref?: string;
  showViewAll?: boolean;
}) {
  return (
    <MaterioCard
      title="Needs attention"
      subheader={
        items.length
          ? "Blocked and at-risk releases — owner, stage, and who should act next"
          : "No blocked or at-risk releases in this period and filter scope"
      }
      action={
        showViewAll && items.length > 0 ? (
          <Button component={Link} href={viewAllHref} size="small" sx={{ textTransform: "none" }}>
            View all →
          </Button>
        ) : undefined
      }
      noPadding
    >
      {items.length === 0 ? (
        <Box sx={{ px: 3, py: 2 }}>
          <Typography variant="body2" color="text.secondary">
            All clear for the selected period. Check{" "}
            <Link href="/releases" style={{ color: "inherit", fontWeight: 600 }}>
              Releases
            </Link>{" "}
            for the full portfolio.
          </Typography>
        </Box>
      ) : (
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Release</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Stage</TableCell>
                <TableCell>Why stuck</TableCell>
                <TableCell>Responsible</TableCell>
                <TableCell>Last activity</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={`${item.source}-${item.id}`} hover sx={{ "&:last-child td": { border: 0 } }}>
                  <TableCell sx={{ minWidth: 180 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.5 }}>
                      <SourceBadgeInline source={item.source} />
                      <Link href={item.href} style={{ fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 600 }}>
                        {item.code}
                      </Link>
                    </Box>
                    <Link href={item.href} style={{ textDecoration: "none", color: "inherit", fontWeight: 500 }}>
                      {item.name}
                    </Link>
                    <Typography variant="caption" color="text.disabled" sx={{ display: "block" }}>
                      {item.group} · {formatDate(item.date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={item.status} size="small" color={statusChipColor(item.status)} variant="outlined" />
                  </TableCell>
                  <TableCell>{item.owner}</TableCell>
                  <TableCell sx={{ maxWidth: 140 }}>
                    <Typography variant="body2" color="text.secondary">{item.stage}</Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 180 }}>
                    <Typography variant="body2" color="text.secondary">{item.reason}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{item.responsible}</TableCell>
                  <TableCell sx={{ maxWidth: 160 }}>
                    {item.lastActor ? (
                      <>
                        <Typography variant="body2">{item.lastActor}</Typography>
                        {item.lastActivity && (
                          <Typography variant="caption" color="text.disabled">{item.lastActivity}</Typography>
                        )}
                      </>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </MaterioCard>
  );
}
