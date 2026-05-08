import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import DataTableDesktop from "./DataTableDesktop";
import DataCardMobile from "./DataCardMobile";
import MobileCardSkeleton from "../skeleton/SkeletonDataCardMobile";
import TableSkeleton from "../skeleton/SkeletonDataTableDesktop";

export default function DataTableResponsive({
  columns,
  data,
  renderActions,
  renderActionsMobile,
  onRefresh,
  add,
  addLabel = "Add",
  loading = false,
}) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Box sx={{ width: "100%" }}>
      {/* ===== MOBILE ===== */}
      {isMobile ? (
        loading ? (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <MobileCardSkeleton key={i} />
            ))}
          </>
        ) : (
          <DataCardMobile
            columns={columns}
            data={data}
            renderActionsMobile={renderActionsMobile}
            onRefresh={onRefresh}
            add={add}
          />
        )
      ) : (
        /* ===== DESKTOP ===== */
        loading ? (
          <TableSkeleton rows={6} />
        ) : (
          <DataTableDesktop
            columns={columns}
            data={data}
            renderActions={renderActions}
            onRefresh={onRefresh}
            add={add}
            addLabel={addLabel}
          />
        )
      )}
    </Box>
  );
}
