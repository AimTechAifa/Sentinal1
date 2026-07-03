"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import Link from "next/link";
import { AlertTriangle, GitBranch, Layers, Server } from "lucide-react";
import { MaterioCard } from "@/components/materio/crm/MaterioCard";
import { buildEnvironmentDesk } from "@/lib/enterprise-env-data";
import { releases, services } from "@/lib/dummy-data";

const desk = buildEnvironmentDesk(releases, services);

function EnvStat({
  label,
  value,
  icon: Icon,
  warn,
}: {
  label: string;
  value: number;
  icon: typeof Server;
  warn?: boolean;
}) {
  const theme = useTheme();
  const color = warn ? theme.palette.warning.main : theme.palette.primary.main;

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: 1,
        borderColor: warn ? alpha(theme.palette.warning.main, 0.35) : "divider",
        bgcolor: warn ? alpha(theme.palette.warning.main, 0.06) : alpha(theme.palette.primary.main, 0.04),
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
        <Icon size={14} color={color} />
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.4 }}>
          {label}
        </Typography>
      </Box>
      <Typography variant="h5" sx={{ fontWeight: 700 }} color="text.primary">
        {value}
      </Typography>
    </Box>
  );
}

export function EnvironmentDeskDashboardCard() {
  const { stats, alerts } = desk;
  const topAlert = alerts[0];

  return (
    <MaterioCard
      title="Environment Desk"
      subheader="Timeline · booking · versions · topology"
      action={
        <Button component={Link} href="/environments" size="small" sx={{ textTransform: "none" }}>
          Open desk →
        </Button>
      }
    >
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={6}>
          <EnvStat label="Booked" value={stats.bookedEnvs} icon={Server} />
        </Grid>
        <Grid size={6}>
          <EnvStat label="Drift" value={stats.versionDrift} icon={Layers} warn={stats.versionDrift > 0} />
        </Grid>
        <Grid size={6}>
          <EnvStat label="Conflicts" value={stats.bookingConflicts} icon={GitBranch} warn={stats.bookingConflicts > 0} />
        </Grid>
        <Grid size={6}>
          <EnvStat label="Alerts" value={alerts.length} icon={AlertTriangle} warn={alerts.length > 0} />
        </Grid>
      </Grid>

      {topAlert ? (
        <Box sx={{ pt: 2, borderTop: 1, borderColor: "divider" }}>
          <Chip label="Top priority" size="small" color="warning" sx={{ mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {topAlert.title} — {topAlert.detail}
          </Typography>
        </Box>
      ) : (
        <Typography variant="body2" sx={{ pt: 2, borderTop: 1, borderColor: "divider", color: "success.main" }}>
          Environment drift remediated — all tiers aligned to production baselines. No booking conflicts detected.
        </Typography>
      )}
    </MaterioCard>
  );
}
