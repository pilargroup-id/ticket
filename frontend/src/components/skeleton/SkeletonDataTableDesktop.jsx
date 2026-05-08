// TableSkeleton.jsx
import { Box, Skeleton } from "@mui/material";

export default function TableSkeleton({ rows = 5 }) {
  return (
    <Box>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          variant="rectangular"
          height={44}
          sx={{ mb: 1, borderRadius: 1 }}
        />
      ))}
    </Box>
  );
}
