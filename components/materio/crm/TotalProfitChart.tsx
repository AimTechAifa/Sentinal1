"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DollarSign, MoreVertical, PieChart, Wallet } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MaterioCard } from "./MaterioCard";
import type { PortfolioSummary, StackPoint } from "@/lib/materio/chart-data";

type StatRow = {
  icon: typeof PieChart;
  color: "success" | "primary" | "secondary";
  value: string;
  label: string;
};

type TotalProfitChartProps = {
  data: StackPoint[];
  summary: PortfolioSummary;
  title?: string;
  reportHref?: string;
  reportLabel?: string;
};

export function TotalProfitChart({
  data,
  summary,
  title = "Portfolio mix",
  reportHref = "/releases",
  reportLabel = "View report",
}: TotalProfitChartProps) {
  const theme = useTheme();
  const grid = theme.palette.mode === "dark" ? "rgba(231,227,252,0.08)" : "#eaeaf4";
  const tick = theme.palette.text.secondary;

  const statRows: StatRow[] = [
    { icon: PieChart, color: "success", value: String(summary.shipped), label: "Shipped" },
    { icon: DollarSign, color: "primary", value: String(summary.inProgress), label: "In progress" },
    { icon: Wallet, color: "secondary", value: String(summary.planned), label: "Planned" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      <MaterioCard noPadding sx={{ overflow: "hidden" }}>
        <Grid container>
          <Grid size={{ xs: 12, md: 8 }} sx={{ p: 3, borderRight: { md: 1 }, borderColor: { md: "divider" } }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }} color="text.primary">
              {title}
            </Typography>
            <Box sx={{ height: 300, mx: -1 }}>
              <ResponsiveContainer minWidth={0} minHeight={0} width="100%" height="100%">
              <BarChart data={data} barCategoryGap="18%">
                <defs>
                  <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={theme.palette.primary.light} stopOpacity={1} />
                    <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="colorInProgress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={theme.palette.success.light} stopOpacity={1} />
                    <stop offset="100%" stopColor={theme.palette.success.main} stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="colorShipped" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={theme.palette.secondary.light} stopOpacity={1} />
                    <stop offset="100%" stopColor={theme.palette.secondary.main} stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke={grid} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: tick }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: tick }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: theme.palette.action.hover }}
                  contentStyle={{
                    borderRadius: 12,
                    border: `1px solid ${theme.palette.divider}`,
                    background: theme.palette.background.paper,
                    boxShadow: theme.shadows[6],
                    fontWeight: 500,
                  }}
                />
                <Bar dataKey="planned" name="Planned" stackId="a" fill="url(#colorPlanned)" radius={[0, 0, 4, 4]} maxBarSize={36} isAnimationActive={true} animationDuration={1200} />
                <Bar dataKey="inProgress" name="In progress" stackId="a" fill="url(#colorInProgress)" maxBarSize={36} isAnimationActive={true} animationDuration={1200} />
                <Bar dataKey="shipped" name="Shipped" stackId="a" fill="url(#colorShipped)" radius={[8, 8, 0, 0]} maxBarSize={36} isAnimationActive={true} animationDuration={1200} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }} sx={{ p: 3, display: "flex", flexDirection: "column" }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.2 }} color="text.primary">
                {summary.total}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Releases this month · prior {summary.previousTotal}
              </Typography>
            </Box>
            <IconButton size="small" aria-label="More options" sx={{ color: "text.secondary" }}>
              <MoreVertical size={18} />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
            {statRows.map(({ icon: Icon, color, value, label }) => {
              const main = theme.palette[color].main;
              return (
                <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 1.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: alpha(main, 0.12),
                      color: main,
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={20} />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }} color="text.primary">
                      {value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {label}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>

          <Button
            component={Link}
            href={reportHref}
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 3, textTransform: "none", fontWeight: 600, py: 1.25, borderRadius: 2 }}
          >
            {reportLabel}
          </Button>
        </Grid>
      </Grid>
    </MaterioCard>
    </motion.div>
  );
}
