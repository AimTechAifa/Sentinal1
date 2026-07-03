"use client";

import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { motion } from "framer-motion";
import { MaterioCard } from "./MaterioCard";
import type { WeeklyPoint } from "@/lib/materio/chart-data";

type WeeklyOverviewChartProps = {
  data: WeeklyPoint[];
  title?: string;
  subheader?: string;
};

export function WeeklyOverviewChart({
  data,
  title = "Weekly Overview",
  subheader = "Releases scheduled per week",
}: WeeklyOverviewChartProps) {
  const theme = useTheme();
  const grid = theme.palette.mode === "dark" ? "rgba(231,227,252,0.08)" : "#eaeaf4";
  const tick = theme.palette.text.secondary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
    >
      <MaterioCard title={title} subheader={subheader}>
        <Box sx={{ height: 280, mx: -1 }}>
        <ResponsiveContainer minWidth={0} minHeight={0} width="100%" height="100%">
          <BarChart data={data} barGap={6} barCategoryGap="25%">
            <defs>
              <linearGradient id="colorReleases" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.palette.primary.light} stopOpacity={1} />
                <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity={1} />
              </linearGradient>
              <linearGradient id="colorAtRisk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.palette.warning.light} stopOpacity={1} />
                <stop offset="100%" stopColor={theme.palette.warning.main} stopOpacity={1} />
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
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
            <Bar dataKey="releases" name="Releases" fill="url(#colorReleases)" radius={[6, 6, 0, 0]} maxBarSize={28} isAnimationActive={true} animationDuration={1200} />
            <Bar dataKey="atRisk" name="At risk / blocked" fill="url(#colorAtRisk)" radius={[6, 6, 0, 0]} maxBarSize={28} isAnimationActive={true} animationDuration={1200} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
      </MaterioCard>
    </motion.div>
  );
}
