"use client";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";

function Block({ height = 120 }: { height?: number }) {
  return (
    <Skeleton
      variant="rounded"
      height={height}
      sx={{ borderRadius: 2, bgcolor: "action.hover" }}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <Box className="materio-dashboard-grid" aria-label="Loading dashboard">
      <Box>
        <Skeleton variant="text" width={180} height={40} sx={{ bgcolor: "action.hover" }} />
        <Skeleton variant="text" width={260} height={22} sx={{ bgcolor: "action.hover" }} />
      </Box>

      <Block height={140} />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Block height={280} />
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Block height={280} />
        </Grid>
      </Grid>

      <Block height={100} />

      <Grid container spacing={2.5} columns={{ xs: 12, sm: 12, md: 12, lg: 10 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
            <Block height={108} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Block height={320} />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Block height={320} />
        </Grid>
      </Grid>

      <Block height={360} />
    </Box>
  );
}
