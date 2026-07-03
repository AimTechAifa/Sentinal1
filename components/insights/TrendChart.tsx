"use client";

import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from "recharts";
import { MaterioCard } from "@/components/materio/crm/MaterioCard";
import type { HistoricalTrendPoint } from "@/lib/types";

export function TrendChart({ data }: { data: HistoricalTrendPoint[] }) {
  const theme = useTheme();
  const chartData = data.map((d) => ({
    week: d.week.slice(5),
    readiness: Math.round(d.avgReadiness),
    rollbacks: d.rollbackCount,
  }));

  const grid = theme.palette.mode === "dark" ? "rgba(231,227,252,0.08)" : "#eaeaf4";
  const tick = theme.palette.text.secondary;

  return (
    <MaterioCard
      title="Readiness & Rollback Trends"
      subheader="26-week org-wide trend (demo data)"
    >
      <Box sx={{ height: 280, mx: -1 }}>
        <ResponsiveContainer minWidth={0} minHeight={0} width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="4 4" stroke={grid} vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: tick }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: tick }} axisLine={false} tickLine={false} domain={[50, 100]} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: tick }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: `1px solid ${theme.palette.divider}`,
                background: theme.palette.background.paper,
              }}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="readiness"
              fill={`${theme.palette.primary.main}33`}
              stroke={theme.palette.primary.main}
              name="Avg Readiness %"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="rollbacks"
              stroke={theme.palette.error.main}
              name="Rollbacks"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </MaterioCard>
  );
}
