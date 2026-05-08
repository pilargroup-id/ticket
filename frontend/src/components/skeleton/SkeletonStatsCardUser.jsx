// src/components/skeleton/StatisticCardSkeleton.jsx
import { Box, Skeleton } from "@mui/material";

export default function StatisticCardSkeleton() {
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        border: "1px solid #e5e7eb",
        bgcolor: "#fff",

        // ✅ shape mengikuti StatisticCard
        borderRadius: { xs: 999, sm: 3 },

        // ✅ chip height on mobile
        minHeight: { xs: 38, sm: "auto" },

        // ✅ padding beda
        px: { xs: 1.2, sm: 2.25 },
        py: { xs: 0.7, sm: 2.1 },
        pt: { xs: 0.7, sm: 3.2 },
      }}
    >
      {/* ✅ DESKTOP accent bar placeholder */}
      <Box
        sx={{
          display: { xs: "none", sm: "block" },
          position: "absolute",
          left: 16,
          right: 16,
          top: 10,
          height: 5,
          borderRadius: 999,
          bgcolor: "#eef2f7",
        }}
      />

      {/* ✅ MOBILE layout (chip) */}
      <Box
        sx={{
          display: { xs: "flex", sm: "none" },
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          {/* dot */}
          <Skeleton variant="circular" width={10} height={10} />
          {/* title */}
          <Skeleton variant="text" width={90} height={18} />
        </Box>

        {/* count badge */}
        <Skeleton
          variant="rounded"
          width={36}
          height={26}
          sx={{ borderRadius: 999 }}
        />
      </Box>

      {/* ✅ DESKTOP layout (card) */}
      <Box sx={{ display: { xs: "none", sm: "block" } }}>
        <Skeleton variant="text" width="55%" height={20} />
        <Skeleton variant="text" width="40%" height={16} sx={{ mt: 0.2 }} />
        <Skeleton variant="text" width="35%" height={44} sx={{ mt: 1.1 }} />
      </Box>
    </Box>
  );
}
