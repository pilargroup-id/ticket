// MobileCardSkeleton.jsx
import { Box, Skeleton } from "@mui/material";

export default function MobileCardSkeleton() {
  return (
    <Box
      sx={{
        mb: 2,
        p: 2,
        borderRadius: 2,
        border: "1px solid #e5e7eb",
      }}
    >
      <Skeleton width="40%" />
      <Skeleton width="70%" />
      <Skeleton width="50%" />
    </Box>
  );
}
