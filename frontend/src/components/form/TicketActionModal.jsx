// src/components/form/TicketActionModal.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Box,
  Typography,
  IconButton,
  Button,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Autocomplete,
  Divider,
  Stack,
  Chip,
  InputAdornment,
  Checkbox,
  useMediaQuery,
  Drawer,
  createFilterOptions,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";

// =======================
// Helpers
// =======================
const nowLocal = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
};

const parseDbToLocal = (db) => {
  if (!db) return "";
  const s = String(db);
  return s.slice(0, 16).replace(" ", "T");
};

// NOTE: tetap ISO UTC (biar gak banyak ubah). Kalau backend expect local, ganti ya.
const toLaravelDateTime = (dtLocal) => {
  if (!dtLocal) return "";
  return new Date(dtLocal).toISOString();
};

const diffMinutes = (startLocal, endLocal) => {
  if (!startLocal || !endLocal) return 0;
  const s = new Date(startLocal);
  const e = new Date(endLocal);
  const ms = e.getTime() - s.getTime();
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.max(1, Math.round(ms / 60000));
};

const titleByType = (t) => {
  if (t === "create") return "Create Ticket";
  if (t === "execution") return "Execution";
  if (t === "resolved") return "Resolved";
  if (t === "void") return "Void";
  return "Action";
};

const chipSx = {
  borderRadius: 999,
  fontWeight: 900,
  bgcolor: "rgba(15,23,42,0.05)",
  border: "1px solid rgba(15,23,42,0.08)",
};

const constChip = (labelType, bg, border) => ({
  label: `Target: ${labelType}`,
  sx: { ...chipSx, bgcolor: bg, borderColor: border },
});

const statusChip = (type) => {
  if (type === "resolved")
    return constChip("resolved", "rgba(16,185,129,0.12)", "rgba(16,185,129,0.25)");
  if (type === "void")
    return constChip("void", "rgba(239,68,68,0.12)", "rgba(239,68,68,0.25)");
  return constChip(type, "rgba(21,82,184,0.12)", "rgba(21,82,184,0.25)");
};

// ✅ Filter MUI (local only, no fetch)
const assetFilter = createFilterOptions({
  ignoreAccents: true,
  ignoreCase: true,
  trim: true,
});

export default function TicketActionModal({
  open,
  onClose,
  actionType,
  ticket,

  supports = [],
  users = [],
  categories = [],

  assets = [],
  assetsLoading = false,

  onSubmit,
  submitting = false,
  submitError = "",

  masterLoading = false,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const isCreate = actionType === "create";
  const isExecution = actionType === "execution";
  const isResolved = actionType === "resolved";
  const isVoid = actionType === "void";

  // ✅ start dari DB (1 sumber kebenaran)
  const startFromDbLocal = useMemo(() => parseDbToLocal(ticket?.start_date), [ticket?.start_date]);

  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    user_id: "",
    category_id: "",
    nama_pembuat: "",
    problem: "",
    image: null,

    support_id: "",
    priority: "", // ✅ default kosong
    assets_id: null,
    status: "waiting",

    start_date_local: "",
    end_date_local: "",
    manual_time: false,
    time_spent: "",
    solution: "",
    notes: "",
  });

  // =======================
  // ✅ cegah re-init form saat parent rerender
  // =======================
  const initKey = `${actionType}:${ticket?.id ?? "new"}`;
  const lastInitKeyRef = useRef(null);

  // =======================
  // ✅ OPTIONS
  // =======================
  const supportsOptions = useMemo(
    () =>
      (supports || []).map((u) => ({
        label: u?.name ?? `User #${u?.id}`,
        value: String(u?.id ?? ""),
      })),
    [supports],
  );

  const usersOptions = useMemo(
    () =>
      (users || []).map((u) => {
        const label = [u?.name, u?.email, u?.username].filter(Boolean).join(" • ");
        return { label: label || `User #${u?.id}`, value: String(u?.id ?? "") };
      }),
    [users],
  );

  const categoriesOptions = useMemo(
    () =>
      (categories || []).map((c) => ({
        label: c?.name ?? `Category #${c?.id}`,
        value: String(c?.id ?? ""),
      })),
    [categories],
  );

  const assetsOptions = useMemo(
    () =>
      (assets || []).map((a) => ({
        label: a?.assets_name ?? a?.asset_name ?? a?.name ?? a?.code ?? `Asset #${a?.id}`,
        value: a?.id,
        raw: a,
      })),
    [assets],
  );

  // ✅ effective status (actionType override)
  const effectiveStatus = isResolved ? "resolved" : isVoid ? "void" : form.status;

  // ✅ SHOW START DATE:
  const showStartDate =
    (isCreate && effectiveStatus === "in_progress") ||
    (isExecution && effectiveStatus === "in_progress");

  const showResolvedSection =
    isResolved ||
    (isExecution && effectiveStatus === "resolved") ||
    (isCreate && effectiveStatus === "resolved");

  const showVoidSection = isVoid || (isCreate && effectiveStatus === "void");

  const listboxProps = useMemo(() => ({ style: { maxHeight: 280, overflow: "auto" } }), []);

  // =======================
  // ✅ INIT FORM (sekali per open+key)
  // =======================
  useEffect(() => {
    if (!open) {
      lastInitKeyRef.current = null;
      return;
    }

    if (lastInitKeyRef.current === initKey) return;
    lastInitKeyRef.current = initKey;

    setErrors({});

    if (isCreate) {
      setForm({
        user_id: "",
        category_id: "",
        nama_pembuat: "",
        problem: "",
        image: null,

        support_id: "",
        priority: "", // ✅ default kosong (bukan medium)
        assets_id: null,
        status: "waiting",

        start_date_local: nowLocal(),
        end_date_local: nowLocal(),
        manual_time: false,
        time_spent: "",
        solution: "",
        notes: "",
      });

      return;
    }

    setForm({
      user_id: "",
      category_id: "",
      nama_pembuat: "",
      problem: "",
      image: null,

      support_id: ticket?.support_id ? String(ticket.support_id) : "",
      priority: ticket?.priority ?? "", // ✅ default kosong kalau DB kosong
      assets_id: ticket?.assets_id ?? null,
      status: isExecution
        ? "in_progress"
        : isResolved
          ? "resolved"
          : isVoid
            ? "void"
            : ticket?.status ?? "in_progress",

      start_date_local: startFromDbLocal || "",
      end_date_local: nowLocal(),
      manual_time: false,
      time_spent: "",
      solution: "",
      notes: "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initKey]);

  // =======================
  // ✅ AUTO TIME SPENT (guard)
  // =======================
  useEffect(() => {
    if (!open) return;
    if (!showResolvedSection) return;
    if (form.manual_time) return;

    const startLocal = isCreate ? form.start_date_local : startFromDbLocal || form.start_date_local || "";
    const endLocal = form.end_date_local;
    if (!startLocal || !endLocal) return;

    const mins = diffMinutes(startLocal, endLocal);
    const next = mins ? String(mins) : "";

    setForm((p) => (p.time_spent === next ? p : { ...p, time_spent: next }));
  }, [
    open,
    showResolvedSection,
    form.manual_time,
    form.start_date_local,
    form.end_date_local,
    startFromDbLocal,
    isCreate,
  ]);

  const helper = useCallback((m) => m || " ", []);

  const handleClose = useCallback(() => {
    if (!submitting) onClose?.();
  }, [onClose, submitting]);

  // =======================
  // ✅ VALIDATE
  // =======================
  const validate = useCallback(() => {
    const e = {};

    if (isCreate) {
      if (!form.user_id) e.user_id = "Requestor wajib dipilih";
      if (!form.category_id) e.category_id = "Category wajib dipilih";
      if (!form.nama_pembuat) e.nama_pembuat = "Nama pembuat wajib diisi";
      if (!form.problem) e.problem = "Problem wajib diisi";

      if (!form.support_id) e.support_id = "Support wajib dipilih";
      if (!form.priority) e.priority = "Priority wajib dipilih"; // ✅ tetap wajib (tapi default kosong)
      if (!form.status) e.status = "Status wajib dipilih";

      if (effectiveStatus === "in_progress") {
        if (!form.start_date_local) e.start_date_local = "Start date wajib diisi";
      }

      if (effectiveStatus === "resolved") {
        if (!form.start_date_local) e.start_date_local = "Start date wajib diisi";
        if (!form.end_date_local) e.end_date_local = "End date wajib diisi";
        if (!form.solution) e.solution = "Solution wajib diisi";
        if (!form.notes) e.notes = "Notes wajib untuk resolved";
        const ts = Number(form.time_spent);
        if (!ts || ts < 1) e.time_spent = "Time spent minimal 1 menit";
      }

      if (effectiveStatus === "void") {
        if (!form.notes) e.notes = "Notes wajib untuk void";
      }
    }

    if (!isCreate && isVoid) {
      if (!form.notes) e.notes = "Notes wajib diisi";
    }

    if (!isCreate && isExecution) {
      if (!form.support_id) e.support_id = "Support wajib dipilih";
      if (!form.priority) e.priority = "Priority wajib dipilih"; // ✅ tetap wajib
      if (!form.status) e.status = "Status wajib dipilih";

      if (effectiveStatus === "in_progress") {
        if (!form.start_date_local && !startFromDbLocal) e.start_date_local = "Start date wajib diisi";
      }

      if (effectiveStatus === "resolved") {
        if (!startFromDbLocal && !form.start_date_local) e.start_date_local = "Start date wajib diisi";
        if (!form.end_date_local) e.end_date_local = "End date wajib diisi";
        if (!form.solution) e.solution = "Solution wajib diisi";

        const ts = Number(form.time_spent);
        if (!ts || ts < 1) e.time_spent = "Time spent minimal 1 menit";
        if (form.manual_time && !form.notes) e.notes = "Notes wajib jika manual";
      }
    }

    if (!isCreate && isResolved) {
      if (!form.support_id && !ticket?.support_id) e.support_id = "Support wajib dipilih";
      if (!form.priority && !ticket?.priority) e.priority = "Priority wajib dipilih"; // ✅ resolved action juga wajib
      if (!startFromDbLocal && !form.start_date_local) e.start_date_local = "Start date wajib diisi";
      if (!form.end_date_local) e.end_date_local = "End date wajib diisi";
      if (!form.solution) e.solution = "Solution wajib diisi";

      const ts = Number(form.time_spent);
      if (!ts || ts < 1) e.time_spent = "Time spent minimal 1 menit";
      if (form.manual_time && !form.notes) e.notes = "Notes wajib jika manual";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }, [effectiveStatus, form, isCreate, isExecution, isResolved, isVoid, startFromDbLocal, ticket]);

  // =======================
  // ✅ BUILD PAYLOAD
  // =======================
  const buildPayload = useCallback(() => {
    if (isCreate) {
      const base = {
        user_id: Number(form.user_id),
        support_id: Number(form.support_id),
        category_id: Number(form.category_id),
        assets_id: form.assets_id ? Number(form.assets_id) : null,
        nama_pembuat: form.nama_pembuat,
        problem: form.problem,
        status: effectiveStatus,
        priority: form.priority, // ✅ no default
        image: form.image ?? null,
      };

      if (effectiveStatus === "in_progress") {
        base.start_date = toLaravelDateTime(form.start_date_local);
      }

      if (effectiveStatus === "resolved") {
        base.start_date = toLaravelDateTime(form.start_date_local);
        base.end_date = toLaravelDateTime(form.end_date_local);
        base.solution = form.solution;
        base.time_spent = Number(form.time_spent);
        base.notes = form.notes;
      }

      if (effectiveStatus === "void") {
        base.notes = form.notes;
      }

      return base;
    }

    if (isVoid) return { status: "void", notes: form.notes };

    if (isResolved) {
      const startLocal = startFromDbLocal || form.start_date_local;
      const autoMins = diffMinutes(startLocal, form.end_date_local);

      return {
        status: "resolved",
        support_id: Number(form.support_id || ticket?.support_id),
        priority: String(form.priority || ticket?.priority || ""), // ✅ no "medium"
        assets_id: form.assets_id
          ? Number(form.assets_id)
          : ticket?.assets_id
            ? Number(ticket.assets_id)
            : null,

        start_date: toLaravelDateTime(startLocal),
        end_date: toLaravelDateTime(form.end_date_local),
        solution: form.solution,
        time_spent: form.manual_time ? Number(form.time_spent) : autoMins,
        ...(form.manual_time ? { notes: form.notes } : {}),
      };
    }

    // execution update
    const payload = {
      status: effectiveStatus,
      support_id: Number(form.support_id),
      priority: String(form.priority || ""), // ✅ no default
      assets_id: form.assets_id ? Number(form.assets_id) : null,
    };

    if (effectiveStatus === "in_progress") {
      const startLocal = form.start_date_local || startFromDbLocal;
      payload.start_date = toLaravelDateTime(startLocal);
    }

    if (effectiveStatus === "resolved") {
      const startLocal = startFromDbLocal || form.start_date_local;
      const autoMins = diffMinutes(startLocal, form.end_date_local);

      payload.start_date = toLaravelDateTime(startLocal);
      payload.end_date = toLaravelDateTime(form.end_date_local);
      payload.solution = form.solution;
      payload.time_spent = form.manual_time ? Number(form.time_spent) : autoMins;
      if (form.manual_time) payload.notes = form.notes;
    }

    return payload;
  }, [effectiveStatus, form, isCreate, isResolved, isVoid, startFromDbLocal, ticket]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    await onSubmit?.(buildPayload(), { actionType });
  }, [actionType, buildPayload, onSubmit, validate]);

  const Header = useMemo(() => {
    const sc = statusChip(effectiveStatus);
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
  }, [actionType, effectiveStatus, handleClose, isCreate, isMobile, submitting]);

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
          disabled={submitting}
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
  }, [handleClose, handleSubmit, isMobile, submitting]);

  // =======================
  // ✅ RESOLVED FIELDS
  // =======================
  const renderResolvedFields = () => {
    const startReadonly = !isCreate && !!startFromDbLocal;
    const startValue = startFromDbLocal || form.start_date_local || "";
    const showNotesAlways = isCreate;

    return (
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
        <TextField
          label="Start Date"
          type="datetime-local"
          value={startValue}
          onChange={(e) => {
            if (startReadonly) return;
            setForm((p) => ({ ...p, start_date_local: e.target.value }));
          }}
          disabled={submitting || startReadonly}
          error={!!errors.start_date_local}
          helperText={startReadonly ? "Auto dari ticket (tidak bisa diubah)" : helper(errors.start_date_local)}
          fullWidth
          size="small"
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          label="End Date"
          type="datetime-local"
          value={form.end_date_local}
          onChange={(e) => setForm((p) => ({ ...p, end_date_local: e.target.value }))}
          disabled={submitting}
          error={!!errors.end_date_local}
          helperText={helper(errors.end_date_local)}
          fullWidth
          size="small"
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          label="Time Spent (minutes)"
          value={form.time_spent}
          onChange={(e) => setForm((p) => ({ ...p, time_spent: e.target.value }))}
          disabled={submitting ? true : !form.manual_time}
          error={!!errors.time_spent}
          helperText={errors.time_spent || (!form.manual_time ? "Auto calculated" : " ")}
          fullWidth
          size="small"
          inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>Manual</Typography>
                  <Checkbox
                    size="small"
                    checked={!!form.manual_time}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        manual_time: e.target.checked,
                        notes: e.target.checked ? p.notes : isCreate ? p.notes : "",
                      }))
                    }
                    disabled={submitting}
                  />
                </Stack>
              </InputAdornment>
            ),
          }}
        />

        {(showNotesAlways || form.manual_time) ? (
          <Box sx={{ gridColumn: "1 / -1" }}>
            <TextField
              label={showNotesAlways ? "Notes (required)" : "Notes (required if manual)"}
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              disabled={submitting}
              error={!!errors.notes}
              helperText={helper(errors.notes)}
              fullWidth
              size="small"
              multiline
              minRows={3}
            />
          </Box>
        ) : null}

        <Box sx={{ gridColumn: "1 / -1" }}>
          <TextField
            label="Solution"
            value={form.solution}
            onChange={(e) => setForm((p) => ({ ...p, solution: e.target.value }))}
            disabled={submitting}
            error={!!errors.solution}
            helperText={helper(errors.solution)}
            fullWidth
            size="small"
            multiline
            minRows={4}
          />
        </Box>
      </Box>
    );
  };

  // =======================
  // ✅ ASSET AUTOCOMPLETE
  // =======================
  const AssetAutocomplete = () => {
    const assetValue = assetsOptions.find((x) => Number(x.value) === Number(form.assets_id)) ?? null;

    return (
      <Autocomplete
        disablePortal
        options={assetsOptions}
        loading={assetsLoading}
        ListboxProps={listboxProps}
        value={assetValue}
        onChange={(_e, v) => setForm((p) => ({ ...p, assets_id: v?.value ?? null }))}
        isOptionEqualToValue={(a, b) => Number(a?.value) === Number(b?.value)}
        filterOptions={(options, state) => assetFilter(options, state).slice(0, 80)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Assets (optional)"
            placeholder="Ketik untuk cari asset..."
            size="small"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {assetsLoading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        noOptionsText={assetsLoading ? "Loading assets..." : "Tidak ada asset yang cocok"}
      />
    );
  };

  // =======================
  // CREATE FIELDS
  // =======================
  const renderCreateFields = () => (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
      <Autocomplete
        disablePortal
        options={usersOptions}
        ListboxProps={listboxProps}
        value={usersOptions.find((x) => String(x.value) === String(form.user_id)) ?? null}
        onChange={(_, v) => setForm((p) => ({ ...p, user_id: v?.value ? String(v.value) : "" }))}
        disabled={submitting || masterLoading}
        isOptionEqualToValue={(a, b) => String(a.value) === String(b.value)}
        renderInput={(params) => (
          <TextField {...params} label="Requestor" placeholder="Ketik untuk cari..." size="small" error={!!errors.user_id} helperText={helper(errors.user_id)} />
        )}
      />

      <Autocomplete
        disablePortal
        options={categoriesOptions}
        ListboxProps={listboxProps}
        value={categoriesOptions.find((x) => String(x.value) === String(form.category_id)) ?? null}
        onChange={(_, v) => setForm((p) => ({ ...p, category_id: v?.value ? String(v.value) : "" }))}
        disabled={submitting || masterLoading}
        isOptionEqualToValue={(a, b) => String(a.value) === String(b.value)}
        renderInput={(params) => (
          <TextField {...params} label="Category" placeholder="Ketik untuk cari..." size="small" error={!!errors.category_id} helperText={helper(errors.category_id)} />
        )}
      />

      <TextField
        select
        label="Support"
        value={String(form.support_id ?? "")}
        onChange={(e) => setForm((p) => ({ ...p, support_id: e.target.value }))}
        disabled={submitting || masterLoading}
        error={!!errors.support_id}
        helperText={helper(errors.support_id)}
        fullWidth
        size="small"
      >
        <MenuItem value="">Pilih support</MenuItem>
        {supportsOptions.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label="Priority"
        value={String(form.priority ?? "")}
        onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
        disabled={submitting}
        error={!!errors.priority}
        helperText={helper(errors.priority)}
        fullWidth
        size="small"
      >
        <MenuItem value="">Pilih priority</MenuItem>
        <MenuItem value="low">Low</MenuItem>
        <MenuItem value="medium">Medium</MenuItem>
        <MenuItem value="high">High</MenuItem>
      </TextField>

      <Box sx={{ gridColumn: "1 / -1" }}>
        <AssetAutocomplete />
      </Box>

      <Box sx={{ gridColumn: "1 / -1" }}>
        <TextField
          select
          label="Status"
          value={form.status}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              status: e.target.value,
              start_date_local: p.start_date_local || nowLocal(),
              end_date_local: nowLocal(),
              manual_time: false,
              time_spent: "",
              solution: "",
              notes: "",
            }))
          }
          disabled={submitting}
          error={!!errors.status}
          helperText={helper(errors.status)}
          fullWidth
          size="small"
        >
          <MenuItem value="waiting">Waiting</MenuItem>
          <MenuItem value="in_progress">In Progress</MenuItem>
          <MenuItem value="resolved">Resolved</MenuItem>
        </TextField>
      </Box>

      <Box sx={{ gridColumn: "1 / -1" }}>
        <TextField
          label="Nama Pembuat"
          value={form.nama_pembuat}
          onChange={(e) => setForm((p) => ({ ...p, nama_pembuat: e.target.value }))}
          disabled={submitting}
          error={!!errors.nama_pembuat}
          helperText={helper(errors.nama_pembuat)}
          fullWidth
          size="small"
        />
      </Box>

      <Box sx={{ gridColumn: "1 / -1" }}>
        <TextField
          label="Problem"
          value={form.problem}
          onChange={(e) => setForm((p) => ({ ...p, problem: e.target.value }))}
          disabled={submitting}
          error={!!errors.problem}
          helperText={helper(errors.problem)}
          fullWidth
          size="small"
          multiline
          minRows={4}
        />
      </Box>

      <Box sx={{ gridColumn: "1 / -1" }}>
        <Button component="label" variant="outlined" disabled={submitting} sx={{ borderRadius: 2, fontWeight: 900, textTransform: "none" }}>
          Upload Image (optional)
          <input hidden type="file" accept="image/*" onChange={(e) => setForm((p) => ({ ...p, image: e.target.files?.[0] ?? null }))} />
        </Button>

        <Typography sx={{ mt: 0.75, fontSize: 12, color: "text.secondary" }}>
          {form.image ? `Selected: ${form.image.name}` : "No file selected"}
        </Typography>
      </Box>

      {showStartDate ? (
        <Box sx={{ gridColumn: "1 / -1" }}>
          <TextField
            label="Start Date"
            type="datetime-local"
            value={form.start_date_local}
            onChange={(e) => setForm((p) => ({ ...p, start_date_local: e.target.value }))}
            disabled={submitting}
            error={!!errors.start_date_local}
            helperText={helper(errors.start_date_local)}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      ) : null}

      {showResolvedSection ? <Box sx={{ gridColumn: "1 / -1" }}>{renderResolvedFields()}</Box> : null}

      {showVoidSection ? (
        <Box sx={{ gridColumn: "1 / -1" }}>
          <TextField
            label="Notes (required for void)"
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
        </Box>
      ) : null}
    </Box>
  );

  const renderExecutionFields = () => (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
      <TextField
        select
        label="Support"
        value={String(form.support_id ?? "")}
        onChange={(e) => setForm((p) => ({ ...p, support_id: e.target.value }))}
        disabled={submitting || masterLoading}
        error={!!errors.support_id}
        helperText={helper(errors.support_id)}
        fullWidth
        size="small"
      >
        <MenuItem value="">Pilih support</MenuItem>
        {supportsOptions.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label="Priority"
        value={String(form.priority ?? "")}
        onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
        disabled={submitting}
        error={!!errors.priority}
        helperText={helper(errors.priority)}
        fullWidth
        size="small"
      >
        <MenuItem value="">Pilih priority</MenuItem>
        <MenuItem value="low">Low</MenuItem>
        <MenuItem value="medium">Medium</MenuItem>
        <MenuItem value="high">High</MenuItem>
      </TextField>

      <Box sx={{ gridColumn: "1 / -1" }}>
        <AssetAutocomplete />
      </Box>

      <Box sx={{ gridColumn: "1 / -1" }}>
        <TextField
          select
          label="Status"
          value={form.status}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              status: e.target.value,
              start_date_local: startFromDbLocal || p.start_date_local || "",
              end_date_local: nowLocal(),
              manual_time: false,
              time_spent: "",
              solution: "",
              notes: "",
            }))
          }
          disabled={submitting}
          error={!!errors.status}
          helperText={helper(errors.status)}
          fullWidth
          size="small"
        >
          <MenuItem value="in_progress">In Progress</MenuItem>
          <MenuItem value="resolved">Resolved</MenuItem>
        </TextField>
      </Box>

      {showStartDate ? (
        <Box sx={{ gridColumn: "1 / -1" }}>
          <TextField
            label="Start Date"
            type="datetime-local"
            value={form.start_date_local || startFromDbLocal || ""}
            onChange={(e) => setForm((p) => ({ ...p, start_date_local: e.target.value }))}
            disabled={submitting}
            error={!!errors.start_date_local}
            helperText={helper(errors.start_date_local)}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      ) : null}

      {effectiveStatus === "resolved" ? <Box sx={{ gridColumn: "1 / -1" }}>{renderResolvedFields()}</Box> : null}
    </Box>
  );

  const renderActionFields = () => {
    if (isResolved) return renderResolvedFields();

    if (isVoid) {
      return (
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
          minRows={5}
        />
      );
    }

    if (isExecution) return renderExecutionFields();
    return null;
  };

  // =======================
  // ✅ DETAIL TICKET
  // =======================
  const TicketSummary = useMemo(() => {
    if (isCreate) return null;

    const rows = [
      ["Ticket", ticket?.ticket_code || `#${ticket?.id || "-"}`],
      ["Requestor", ticket?.user_name || ticket?.user?.name || "-"],
      ["Nama Pembuat", ticket?.nama_pembuat || "-"],
      ["Category", ticket?.category_name || ticket?.category?.name || "-"],
      ["Problem", ticket?.problem || "-"],
      ["Status (DB)", ticket?.status || "-"],
      ["Priority", ticket?.priority || "-"],
      ["Support", ticket?.support_name || ticket?.support?.name || "-"],
      ["Asset", ticket?.assets_name || ticket?.asset?.assets_name || ticket?.asset_name || "-"],
      ["Start (DB)", startFromDbLocal || "-"],
      ["End (DB)", parseDbToLocal(ticket?.end_date) || "-"],
    ];

    return (
      <Box
        sx={{
          mb: 2,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          p: { xs: 2, sm: 2.25 },
        }}
      >
        <Typography sx={{ fontSize: 13, fontWeight: 950, mb: 1.5 }}>Ticket Detail</Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "170px 1fr" },
            rowGap: 1,
            columnGap: 2,
          }}
        >
          {rows.map(([k, v]) => (
            <React.Fragment key={k}>
              <Typography sx={{ fontSize: 12, fontWeight: 900, color: "text.secondary" }}>{k}</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 750, whiteSpace: "pre-wrap" }}>
                {String(v)}
              </Typography>
            </React.Fragment>
          ))}
        </Box>
      </Box>
    );
  }, [isCreate, ticket, startFromDbLocal]);

  const Body = (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2.5 }, bgcolor: "rgba(15,23,42,0.02)", overflow: "auto" }}>
      {submitError ? (
        <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
          {submitError}
        </Alert>
      ) : null}

      {TicketSummary}

      <Box
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          p: { xs: 2, sm: 2.25 },
        }}
      >
        <Typography sx={{ fontSize: 13, fontWeight: 950, mb: 1.5 }}>Form</Typography>
        {isCreate ? renderCreateFields() : renderActionFields()}
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
