"use client";

import Card, { type CardProps } from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Box from "@mui/material/Box";
import type { ReactNode } from "react";

type MaterioCardProps = CardProps & {
  title?: string;
  subheader?: string;
  action?: ReactNode;
  children: ReactNode;
  noPadding?: boolean;
  headerExtra?: ReactNode;
};

export function MaterioCard({
  title,
  subheader,
  action,
  children,
  noPadding,
  headerExtra,
  sx,
  ...rest
}: MaterioCardProps) {
  const hasHeader = title || subheader || action || headerExtra;

  return (
    <Card 
      className="glass-panel hover:-translate-y-1 hover:shadow-md transition-all duration-300"
      sx={{ 
        height: "100%", 
        boxShadow: "none",
        ...sx 
      }} 
      {...rest}
    >
      {hasHeader && (
        <CardHeader
          title={title}
          subheader={subheader}
          action={action}
          sx={{ pb: headerExtra ? 0 : undefined }}
        />
      )}
      {headerExtra && <Box sx={{ px: 3, pb: 1 }}>{headerExtra}</Box>}
      {noPadding ? children : <CardContent>{children}</CardContent>}
    </Card>
  );
}
