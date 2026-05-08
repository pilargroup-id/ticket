import React, { useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Stack,
  Typography,
  CircularProgress,
  Box,
} from "@mui/material";

import Gantt from "frappe-gantt";
import "../../styles/frappe-gantt.css";

export default function GanttDetailModal({ open, onClose, detailData, loading }) {
  const detailWrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    if (!detailWrapRef.current) return;

    detailWrapRef.current.innerHTML = "";

    const detailTasks = detailData?.tasks || [];
    if (!detailTasks.length) return;

    const wrapperRef = detailWrapRef.current;

    new Gantt(
      wrapperRef,
      detailTasks
        .filter((t) => t?.start && t?.end)
        .map((t) => ({
          id: String(t.id),
          name: t.name,
          start: t.start,
          end: t.end,
          progress: Number(t.progress ?? 0),
          custom_class: `type-${t.type || "task"}`,
        })),
      {
        view_mode: "Day",
        date_format: "YYYY-MM-DD",
      },
    );

    return () => {
      if (wrapperRef) wrapperRef.innerHTML = "";
    };
  }, [open, detailData]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ fontWeight: 900 }}>
        Project Gantt Detail
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
            <CircularProgress />
            <Typography sx={{ mt: 1, opacity: 0.7 }}>
              Loading detail...
            </Typography>
          </Stack>
        ) : detailData ? (
          <>
            <Typography fontWeight={900}>
              {detailData.project?.name}{" "}
              <span style={{ opacity: 0.7, fontWeight: 700 }}>
                [{detailData.project?.status_label} - {detailData.project?.progress}%]
              </span>
            </Typography>
            <Typography sx={{ opacity: 0.7, mb: 2 }}>
              {detailData.project?.start} → {detailData.project?.end}
            </Typography>

            <Box ref={detailWrapRef} />
          </>
        ) : (
          <Typography sx={{ opacity: 0.7 }}>Tidak ada data detail.</Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}
