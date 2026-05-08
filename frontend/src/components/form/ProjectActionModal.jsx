// src/components/form/ProjectActionModal.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  Box,
  Typography,
  IconButton,
  Button,
  CircularProgress,
  Alert,
  TextField,
  Divider,
  Stack,
  Chip,
  Checkbox,
  InputAdornment,
  useMediaQuery,
  Drawer,
  Autocomplete,
  MenuItem,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";

// =======================
// Helpers
// =======================
const nowLocal = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
};

const toLaravelDateTime = (dtLocal) => {
  if (!dtLocal) return "";
  return new Date(dtLocal).toISOString();
};

const titleByType = (t) => {
  if (t === "create") return "Create Project";
  if (t === "start") return "Start Project";
  if (t === "progress") return "Update Progress";
  if (t === "hold") return "Put On Hold";
  if (t === "unhold") return "Continue Project";
  if (t === "void") return "Void Project";
  if (t === "resolve") return "Resolve Project";
  return "Action";
};

const chipSx = {
  borderRadius: 999,
  fontWeight: 900,
  bgcolor: "rgba(15,23,42,0.05)",
  border: "1px solid rgba(15,23,42,0.08)",
};

const statusChip = (type) => {
  const base = { ...chipSx, bgcolor: "rgba(21,82,184,0.12)", borderColor: "rgba(21,82,184,0.25)" };
  if (type === "resolve")
    return {
      label: "Target: resolved",
      sx: { ...chipSx, bgcolor: "rgba(16,185,129,0.12)", borderColor: "rgba(16,185,129,0.25)" },
    };
  if (type === "void")
    return {
      label: "Target: void",
      sx: { ...chipSx, bgcolor: "rgba(239,68,68,0.12)", borderColor: "rgba(239,68,68,0.25)" },
    };
  if (type === "hold")
    return {
      label: "Target: pending",
      sx: { ...chipSx, bgcolor: "rgba(245,158,11,0.14)", borderColor: "rgba(245,158,11,0.30)" },
    };
  if (type === "unhold") return { label: "Target: in_progress", sx: base };
  if (type === "progress") return { label: "Target: in_progress", sx: base };
  if (type === "start") return { label: "Target: in_progress", sx: base };
  return { label: `Target: ${type}`, sx: base };
};

export default function ProjectActionModal({
  open,
  onClose,
  actionType,
  project,

  // ✅ FIX: split masters
  developers = [],
  requestors = [],
  masterLoading = false,

  onSubmit,
  submitting = false,
  submitError = "",
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const isCreate = actionType === "create";
  const isStart = actionType === "start";
  const isProgress = actionType === "progress";
  const isHold = actionType === "hold";
  const isUnhold = actionType === "unhold";
  const isVoid = actionType === "void";
  const isResolve = actionType === "resolve";

  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    // create header
    project_name: "",
    request_date_local: nowLocal(),
    requestor_id: "",
    priority: "",
    description: "",
    start_date_local: "",
    end_date_local: "",

    // actions
    developer_id: "",
    progress_percent: "",
    progress_date_local: nowLocal(),
    detail_description: "",

    // hold/unhold
    reason: "",
    include_pending_minutes: false,

    // void
    notes: "",

    // resolve
    actual_end_date_local: nowLocal(),
    resolve_description: "",
  });

  const listboxProps = useMemo(() => ({ style: { maxHeight: 280, overflow: "auto" } }), []);

  // ✅ FIX: options split
  const developerOptions = useMemo(
    () =>
      (developers || []).map((u) => ({
        label: u?.name ?? `User #${u?.id}`,
        value: String(u?.id ?? ""),
        raw: u,
      })),
    [developers]
  );

  const requestorOptions = useMemo(
    () =>
      (requestors || []).map((u) => ({
        label: u?.name ?? `User #${u?.id}`,
        value: String(u?.id ?? ""),
        raw: u,
      })),
    [requestors]
  );

  // init form every open
  useEffect(() => {
    if (!open) return;
    setErrors({});

    if (isCreate) {
      setForm({
        project_name: "",
        request_date_local: nowLocal(),
        requestor_id: "",
        priority: "",
        description: "",
        start_date_local: "",
        end_date_local: "",

        developer_id: "",
        progress_percent: "",
        progress_date_local: nowLocal(),
        detail_description: "",

        reason: "",
        include_pending_minutes: false,

        notes: "",

        actual_end_date_local: nowLocal(),
        resolve_description: "",
      });
      return;
    }

    setForm((p) => ({
      ...p,
      developer_id: project?.dev_id ? String(project.dev_id) : "",
      progress_percent: project?.progress_percent != null ? String(project.progress_percent) : "",
      progress_date_local: nowLocal(),
      detail_description: "",
      reason: "",
      include_pending_minutes: false,
      notes: "",
      actual_end_date_local: nowLocal(),
      resolve_description: "",
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, actionType, project?.id]);

  const helper = useCallback((m) => m || " ", []);

  const validate = useCallback(() => {
    const e = {};

    if (isCreate) {
      if (!form.project_name) e.project_name = "Project name wajib";
      if (!form.requestor_id) e.requestor_id = "Requestor wajib";
      if (!form.request_date_local) e.request_date_local = "Request date wajib";
      if (!form.priority) e.priority = "Priority wajib";
    }

    if (isStart || isProgress) {
      if (!form.developer_id) e.developer_id = "Developer wajib";
      if (isProgress && (form.progress_percent === "" || form.progress_percent == null))
        e.progress_percent = "Progress percent wajib";
      if (
        form.progress_percent !== "" &&
        (Number(form.progress_percent) < 0 || Number(form.progress_percent) > 100)
      )
        e.progress_percent = "0 - 100";
    }

    if (isHold) {
      if (!form.reason) e.reason = "Reason wajib";
    }

    if (isVoid) {
      if (!form.notes) e.notes = "Notes wajib";
    }

    if (isResolve) {
      // optional
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form, isCreate, isHold, isProgress, isResolve, isStart, isVoid]);

  const buildPayload = useCallback(() => {
    if (isCreate) {
      return {
        project_name: form.project_name,
        request_date: toLaravelDateTime(form.request_date_local),
        requestor_id: Number(form.requestor_id),
        priority: form.priority,
        description: form.description || null,
        start_date: form.start_date_local ? toLaravelDateTime(form.start_date_local) : null,
        end_date: form.end_date_local ? toLaravelDateTime(form.end_date_local) : null,
        status: "waiting",
        progress_percent: 0,
      };
    }

    if (isStart) {
      return {
        developer_id: Number(form.developer_id),
        progress_date: toLaravelDateTime(form.progress_date_local),
        progress_percent: form.progress_percent === "" ? 0 : Number(form.progress_percent),
        description: form.detail_description || null,
      };
    }

    if (isProgress) {
      return {
        developer_id: Number(form.developer_id),
        progress_date: toLaravelDateTime(form.progress_date_local),
        progress_percent: Number(form.progress_percent),
        description: form.detail_description || null,
      };
    }

    if (isHold) {
      return {
        reason: form.reason,
        description: form.detail_description || null,
      };
    }

    if (isUnhold) {
      return {
        include_pending_minutes: !!form.include_pending_minutes,
        developer_id: form.developer_id ? Number(form.developer_id) : undefined,
        description: form.detail_description || null,
      };
    }

    if (isVoid) {
      return {
        notes: form.notes,
        description: form.detail_description || null,
      };
    }

    if (isResolve) {
      return {
        actual_end_date: form.actual_end_date_local ? toLaravelDateTime(form.actual_end_date_local) : undefined,
        include_pending_minutes: !!form.include_pending_minutes,
        description: form.resolve_description || null,
      };
    }

    return {};
  }, [form, isCreate, isHold, isProgress, isResolve, isStart, isUnhold, isVoid]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    await onSubmit?.(buildPayload(), { actionType });
  }, [actionType, buildPayload, onSubmit, validate]);

  const handleClose = useCallback(() => {
    if (!submitting) onClose?.();
  }, [onClose, submitting]);

  const Header = useMemo(() => {
    const sc = statusChip(actionType);
    return (
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          py: { xs: 1.6, sm: 2 },
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 2,
          bgcolor: "background.paper",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant={isMobile ? "subtitle1" : "h6"}
            sx={{ fontWeight: 950, letterSpacing: -0.4, lineHeight: 1.1 }}
            noWrap
          >
            {titleByType(actionType)}
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1, flexWrap: "wrap" }}>
            <Chip size="small" label={`Mode: ${isCreate ? "NEW" : "ACTION"}`} sx={chipSx} />
            <Chip size="small" label={sc.label} sx={sc.sx} />
            {project?.project_code ? <Chip size="small" label={project.project_code} sx={chipSx} /> : null}
          </Stack>
        </Box>

        <IconButton
          onClick={handleClose}
          disabled={submitting}
          sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider" }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
    );
  }, [actionType, handleClose, isCreate, isMobile, project?.project_code, submitting]);

  const Footer = useMemo(() => {
    return (
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          py: { xs: 1.4, sm: 1.75 },
          display: "flex",
          gap: 1,
          justifyContent: "flex-end",
          bgcolor: "background.paper",
          pb: `calc(14px + env(safe-area-inset-bottom))`,
        }}
      >
        <Button
          variant="outlined"
          onClick={handleClose}
          disabled={submitting}
          sx={{ borderRadius: 2, fontWeight: 900, textTransform: "none" }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || masterLoading}
          sx={{
            borderRadius: 2,
            fontWeight: 950,
            textTransform: "none",
            minWidth: isMobile ? 140 : 160,
            boxShadow: "none",
            height: 46,
          }}
        >
          {submitting ? (
            <>
              <CircularProgress size={18} sx={{ mr: 1, color: "#fff" }} />
              Menyimpan...
            </>
          ) : (
            "Submit"
          )}
        </Button>
      </Box>
    );
  }, [handleClose, handleSubmit, isMobile, masterLoading, submitting]);

  // ✅ FIX: dev picker uses developerOptions
  const DevPicker = () => (
    <Autocomplete
      disablePortal
      options={developerOptions}
      ListboxProps={listboxProps}
      value={developerOptions.find((x) => String(x.value) === String(form.developer_id)) ?? null}
      onChange={(_, v) => setForm((p) => ({ ...p, developer_id: v?.value ? String(v.value) : "" }))}
      disabled={submitting}
      isOptionEqualToValue={(a, b) => String(a.value) === String(b.value)}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Developer"
          placeholder="Cari developer..."
          size="small"
          error={!!errors.developer_id}
          helperText={helper(errors.developer_id)}
        />
      )}
    />
  );

  // ✅ FIX: requestor picker uses requestorOptions
  const RequestorPicker = () => (
    <Autocomplete
      disablePortal
      options={requestorOptions}
      ListboxProps={listboxProps}
      value={requestorOptions.find((x) => String(x.value) === String(form.requestor_id)) ?? null}
      onChange={(_, v) => setForm((p) => ({ ...p, requestor_id: v?.value ? String(v.value) : "" }))}
      disabled={submitting}
      isOptionEqualToValue={(a, b) => String(a.value) === String(b.value)}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Requestor"
          placeholder="Cari requestor..."
          size="small"
          error={!!errors.requestor_id}
          helperText={helper(errors.requestor_id)}
        />
      )}
    />
  );

  const BodyForm = () => {
    if (isCreate) {
      return (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
          <TextField
            label="Project Name"
            value={form.project_name}
            onChange={(e) => setForm((p) => ({ ...p, project_name: e.target.value }))}
            disabled={submitting}
            error={!!errors.project_name}
            helperText={helper(errors.project_name)}
            fullWidth
            size="small"
            sx={{ gridColumn: "1 / -1" }}
          />

          <TextField
            label="Request Date"
            type="datetime-local"
            value={form.request_date_local}
            onChange={(e) => setForm((p) => ({ ...p, request_date_local: e.target.value }))}
            disabled={submitting}
            error={!!errors.request_date_local}
            helperText={helper(errors.request_date_local)}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
          />

          <RequestorPicker />

          <TextField
            select
            label="Priority"
            value={form.priority}
            onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
            disabled={submitting}
            error={!!errors.priority}
            helperText={helper(errors.priority)}
            fullWidth
            size="small"
          >
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </TextField>

          <TextField
            label="Planned Start (optional)"
            type="datetime-local"
            value={form.start_date_local}
            onChange={(e) => setForm((p) => ({ ...p, start_date_local: e.target.value }))}
            disabled={submitting}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Planned End (optional)"
            type="datetime-local"
            value={form.end_date_local}
            onChange={(e) => setForm((p) => ({ ...p, end_date_local: e.target.value }))}
            disabled={submitting}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            disabled={submitting}
            fullWidth
            size="small"
            multiline
            minRows={4}
            sx={{ gridColumn: "1 / -1" }}
          />
        </Box>
      );
    }

    if (isStart || isProgress) {
      return (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
          <DevPicker />

          <TextField
            label="Progress Percent"
            value={form.progress_percent}
            onChange={(e) => setForm((p) => ({ ...p, progress_percent: e.target.value }))}
            disabled={submitting}
            error={!!errors.progress_percent}
            helperText={helper(errors.progress_percent)}
            fullWidth
            size="small"
            inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
          />

          <TextField
            label="Progress Date"
            type="datetime-local"
            value={form.progress_date_local}
            onChange={(e) => setForm((p) => ({ ...p, progress_date_local: e.target.value }))}
            disabled={submitting}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Detail Description (optional)"
            value={form.detail_description}
            onChange={(e) => setForm((p) => ({ ...p, detail_description: e.target.value }))}
            disabled={submitting}
            fullWidth
            size="small"
            multiline
            minRows={4}
            sx={{ gridColumn: "1 / -1" }}
          />
        </Box>
      );
    }

    if (isHold) {
      return (
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 2 }}>
          <TextField
            label="Reason"
            value={form.reason}
            onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
            disabled={submitting}
            error={!!errors.reason}
            helperText={helper(errors.reason)}
            fullWidth
            size="small"
            multiline
            minRows={3}
          />

          <TextField
            label="Description (optional)"
            value={form.detail_description}
            onChange={(e) => setForm((p) => ({ ...p, detail_description: e.target.value }))}
            disabled={submitting}
            fullWidth
            size="small"
            multiline
            minRows={3}
          />
        </Box>
      );
    }

    if (isUnhold) {
      return (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
          <DevPicker />

          <TextField
            label="Include pending minutes?"
            value={form.include_pending_minutes ? "yes" : "no"}
            select
            onChange={(e) => setForm((p) => ({ ...p, include_pending_minutes: e.target.value === "yes" }))}
            disabled={submitting}
            fullWidth
            size="small"
          >
            <MenuItem value="no">No (tidak nambah effective end)</MenuItem>
            <MenuItem value="yes">Yes (nambah total pending & effective end)</MenuItem>
          </TextField>

          <TextField
            label="Description (optional)"
            value={form.detail_description}
            onChange={(e) => setForm((p) => ({ ...p, detail_description: e.target.value }))}
            disabled={submitting}
            fullWidth
            size="small"
            multiline
            minRows={4}
            sx={{ gridColumn: "1 / -1" }}
          />
        </Box>
      );
    }

    if (isVoid) {
      return (
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 2 }}>
          <TextField
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            disabled={submitting}
            error={!!errors.notes}
            helperText={helper(errors.notes)}
            fullWidth
            size="small"
            multiline
            minRows={4}
          />
          <TextField
            label="Description (optional)"
            value={form.detail_description}
            onChange={(e) => setForm((p) => ({ ...p, detail_description: e.target.value }))}
            disabled={submitting}
            fullWidth
            size="small"
            multiline
            minRows={3}
          />
        </Box>
      );
    }

    if (isResolve) {
      return (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
          <TextField
            label="Actual End Date (optional)"
            type="datetime-local"
            value={form.actual_end_date_local}
            onChange={(e) => setForm((p) => ({ ...p, actual_end_date_local: e.target.value }))}
            disabled={submitting}
            error={!!errors.actual_end_date_local}
            helperText={helper(errors.actual_end_date_local)}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Include pending minutes?"
            value={form.include_pending_minutes ? "yes" : "no"}
            select
            onChange={(e) => setForm((p) => ({ ...p, include_pending_minutes: e.target.value === "yes" }))}
            disabled={submitting}
            fullWidth
            size="small"
          >
            <MenuItem value="no">No (pending tidak nambah effective end)</MenuItem>
            <MenuItem value="yes">Yes (pending nambah effective end)</MenuItem>
          </TextField>

          <TextField
            label="Description (optional)"
            value={form.resolve_description}
            onChange={(e) => setForm((p) => ({ ...p, resolve_description: e.target.value }))}
            disabled={submitting}
            fullWidth
            size="small"
            multiline
            minRows={4}
            sx={{ gridColumn: "1 / -1" }}
          />
        </Box>
      );
    }

    return null;
  };

  const Body = (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2.5 }, bgcolor: "rgba(15,23,42,0.02)", overflow: "auto" }}>
      {submitError ? (
        <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
          {submitError}
        </Alert>
      ) : null}

      <Box sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", bgcolor: "background.paper", p: { xs: 2, sm: 2.25 } }}>
        <Typography sx={{ fontSize: 13, fontWeight: 950, mb: 1.5 }}>Form</Typography>
        {BodyForm()}
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        anchor="bottom"
        open={open}
        onClose={handleClose}
        PaperProps={{ sx: { borderTopLeftRadius: 18, borderTopRightRadius: 18, overflow: "hidden" } }}
        ModalProps={{
          keepMounted: true,
          BackdropProps: { sx: { backdropFilter: "blur(10px)", backgroundColor: "rgba(15,23,42,0.35)" } },
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
          <Box sx={{ width: 44, height: 5, borderRadius: 999, bgcolor: "rgba(15,23,42,0.18)" }} />
        </Box>

        <Box sx={{ maxHeight: "86vh", display: "flex", flexDirection: "column" }}>
          {Header}
          <Divider />
          <Box sx={{ flex: 1, overflow: "auto" }}>{Body}</Box>
          <Divider />
          {Footer}
        </Box>
      </Drawer>
    );
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      sx={{ "& .MuiBackdrop-root": { backgroundColor: "rgba(15,23,42,0.35)", backdropFilter: "blur(10px)" } }}
    >
      <Box sx={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", p: 2.5 }}>
        <Box
          sx={{
            width: "min(900px, 96vw)",
            maxHeight: "84vh",
            bgcolor: "background.paper",
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 28px 90px rgba(0,0,0,0.20)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {Header}
          <Divider />
          <Box sx={{ flex: 1, overflow: "auto" }}>{Body}</Box>
          <Divider />
          {Footer}
        </Box>
      </Box>
    </Modal>
  );
}
