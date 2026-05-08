// src/components/report/ReportFilterBar.jsx
import React, { useMemo } from "react";
import { Stack, TextField, MenuItem, Button } from "@mui/material";

export default function ReportFilterBar({
  preset,
  onPresetChange,
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  status,
  onStatusChange,
  showStatus = false,
  onApply,
  onReset,
  loading,
}) {
  const presets = useMemo(
    () => [
      { value: "today", label: "Today" },
      { value: "yesterday", label: "Yesterday" },
      { value: "this_month", label: "This Month" },
      { value: "last_month", label: "Last Month" },
      { value: "this_year", label: "This Year" },
      { value: "last_year", label: "Last Year" },
      { value: "custom", label: "Custom" },
    ],
    []
  );

  const statusOptions = useMemo(
    () => ["all", "waiting", "resolved", "void", "feedback", "in_progress"],
    []
  );

  const controlSx = {
    minWidth: { xs: "100%", sm: 170 },
    "& .MuiInputBase-root": { borderRadius: 2.25 },
  };

  const btnSx = {
    borderRadius: 2.25,
    textTransform: "none",
    fontWeight: 900,
    boxShadow: "none",
    minHeight: 40,
    "&:hover": { boxShadow: "none" },
    width: { xs: "100%", sm: "auto" },
    "&.Mui-disabled": {
      bgcolor: "rgba(148,163,184,0.35)",
      color: "rgba(15,23,42,0.55)",
      borderColor: "rgba(148,163,184,0.35)",
    },
  };

  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
      <TextField
        select
        size="small"
        label="Preset"
        value={preset}
        onChange={(e) => onPresetChange(e.target.value)}
        sx={controlSx}
      >
        {presets.map((p) => (
          <MenuItem key={p.value} value={p.value}>
            {p.label}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        size="small"
        type="date"
        label="Start"
        value={startDate}
        onChange={(e) => onStartChange(e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={controlSx}
        disabled={preset !== "custom"}
      />

      <TextField
        size="small"
        type="date"
        label="End"
        value={endDate}
        onChange={(e) => onEndChange(e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={controlSx}
        disabled={preset !== "custom"}
      />

      {showStatus ? (
        <TextField
          select
          size="small"
          label="Status"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          sx={controlSx}
        >
          {statusOptions.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </TextField>
      ) : null}

      <Button variant="outlined" onClick={onReset} sx={btnSx} disabled={loading}>
        Reset
      </Button>

      <Button variant="contained" onClick={onApply} sx={btnSx} disabled={loading}>
        Apply
      </Button>
    </Stack>
  );
}
