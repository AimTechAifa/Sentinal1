"use client";

import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { MaterioCard } from "./MaterioCard";
import type { GrowthPoint } from "@/lib/materio/chart-data";

type TotalGrowthChartProps = {
  data: GrowthPoint[];
  title?: string;
  subheader?: string;
};

export function TotalGrowthChart({
  data,
  title = "Total Growth",
  subheader = "Portfolio volume vs shipped releases",
}: TotalGrowthChartProps) {
  const theme = useTheme();
  const grid = theme.palette.mode === "dark" ? "rgba(231,227,252,0.08)" : "#eaeaf4";
  const tick = theme.palette.text.secondary;

  return (
    <MaterioCard title={title} subheader={subheader}>
      <Box sx={{ height: 280, mx: -1 }}>
        <ResponsiveContainer minWidth={0} minHeight={0} width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="growthTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity={0.35} />
                <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="growthShipped" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.palette.success.main} stopOpacity={0.35} />
                <stop offset="100%" stopColor={theme.palette.success.main} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke={grid} vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: tick }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: tick }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: `1px solid ${theme.palette.divider}`,
                background: theme.palette.background.paper,
              }}
            />
            <Area type="monotone" dataKey="total" name="Total releases" stroke={theme.palette.primary.main} fill="url(#growthTotal)" strokeWidth={2} />
            <Area type="monotone" dataKey="shipped" name="Shipped" stroke={theme.palette.success.main} fill="url(#growthShipped)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </MaterioCard>
  );
}
