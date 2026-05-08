// src/pages/master/AssetsPage.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  Container,
  Paper,
  Divider,
  Chip,
  useMediaQuery,
  Tooltip,
  IconButton,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useNavigate } from "react-router-dom";

import AssetsService, { pickItem } from "../../services/AssetsService";
import PageTransition from "../../components/animation/Transition";
import DataTableResponsive from "../../components/table/DatatableResponsive";
import FormModal from "../../components/form/FormModal";

/** =========================
 * ✅ helpers
 * ========================= */
const extractArray = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
};

const normalizeText = (v) => String(v ?? "").trim().replace(/\s+/g, " ");
const normalizeEnum = (v) => String(v ?? "").trim().toLowerCase().replace(/\s+/g, "_");

/** =========================
 * ✅ GLOBAL CACHE
 * ========================= */
const ASSETS_CACHE = {
  list: null,
  hydrated: false,
  lastFetchedAt: 0,
};

export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  const [form, setForm] = useState({
    assets_code: "",
    assets_name: "",
    category: "",
    model: "",
    status: "available",
    check_out_to: "",
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const reqIdRef = useRef(0);

  const resetModalState = () => {
    setErrors({});
    setSubmitError("");
  };

  const statusOptions = useMemo(
    () => [
      { label: "Available", value: "available" },
      { label: "Checked Out", value: "checked_out" },
      { label: "Under Maintenance", value: "under_maintenance" },
      { label: "Retired", value: "retired" },
    ],
    [],
  );

  const columns = useMemo(
    () => [
      { title: "ID", data: "id" },
      { title: "Asset Code", data: "assets_code" },
      { title: "Asset Name", data: "assets_name" },
      { title: "Category", data: "category" },
      { title: "Model", data: "model" },
      { title: "Status", data: "status_label" }, // ✅ pake label
      { title: "Check Out To", data: "check_out_to" },
      { title: "Actions", data: "actions" },
    ],
    [],
  );

  /** =========================
   * ✅ CACHE
   * ========================= */
  const showFromCacheOnly = useCallback(() => {
    if (ASSETS_CACHE.hydrated && Array.isArray(ASSETS_CACHE.list)) {
      setAssets(ASSETS_CACHE.list);
      setLoading(false);
      return true;
    }
    return false;
  }, []);

  const fetchFromServer = useCallback(async () => {
    const reqId = ++reqIdRef.current;

    const res = await AssetsService.show();
    if (reqId !== reqIdRef.current) return null;

    const list = extractArray(res);

    ASSETS_CACHE.list = list;
    ASSETS_CACHE.hydrated = true;
    ASSETS_CACHE.lastFetchedAt = Date.now();

    return list;
  }, []);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchFromServer();
      if (!list) return;
      setAssets(list);
    } catch (e) {
      console.error("Fetch assets error:", e);
      ASSETS_CACHE.hydrated = false;
      ASSETS_CACHE.list = null;
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, [fetchFromServer]);

  useEffect(() => {
    const hasCache = showFromCacheOnly();
    if (hasCache) return;
    handleRefresh();
  }, [showFromCacheOnly, handleRefresh]);

  /** =========================
   * ✅ optimistic helpers
   * ========================= */
  const upsertAsset = useCallback((item) => {
    const current = Array.isArray(ASSETS_CACHE.list) ? [...ASSETS_CACHE.list] : [];
    const idx = current.findIndex((x) => String(x?.id) === String(item?.id));
    if (idx >= 0) current[idx] = { ...current[idx], ...item };
    else current.unshift(item);

    ASSETS_CACHE.list = current;
    ASSETS_CACHE.hydrated = true;
    ASSETS_CACHE.lastFetchedAt = Date.now();

    setAssets(current);
  }, []);

  const removeAsset = useCallback((id) => {
    const current = Array.isArray(ASSETS_CACHE.list) ? [...ASSETS_CACHE.list] : [];
    const next = current.filter((x) => String(x?.id) !== String(id));

    ASSETS_CACHE.list = next;
    ASSETS_CACHE.hydrated = true;
    ASSETS_CACHE.lastFetchedAt = Date.now();

    setAssets(next);
  }, []);

  /** =========================
   * ✅ modal controls
   * ========================= */
  const openCreateModal = () => {
    setEditId(null);
    resetModalState();
    setForm({
      assets_code: "",
      assets_name: "",
      category: "",
      model: "",
      status: "available",
      check_out_to: "",
    });
    setOpenModal(true);
  };

  const openEditModal = (row) => {
    setEditId(row?.id ?? null);
    resetModalState();
    setForm({
      assets_code: row?.assets_code ?? "",
      assets_name: row?.assets_name ?? "",
      category: row?.category ?? "",
      model: row?.model ?? "",
      status: normalizeEnum(row?.status ?? "available"),
      check_out_to: row?.check_out_to ?? "",
    });
    setOpenModal(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setOpenModal(false);
  };

  /** =========================
   * ✅ submit create/edit
   * ========================= */
  const handleSubmit = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      resetModalState();

      const payload = {
        assets_code: normalizeText(form.assets_code),
        assets_name: normalizeText(form.assets_name),
        category: normalizeText(form.category),
        model: normalizeText(form.model),
        status: normalizeEnum(form.status), // ✅ enum
        check_out_to: normalizeText(form.check_out_to),
      };

      const newErrors = {};
      if (!payload.assets_code) newErrors.assets_code = ["Asset Code wajib diisi."];
      if (!payload.assets_name) newErrors.assets_name = ["Asset Name wajib diisi."];
      if (!payload.category) newErrors.category = ["Category wajib diisi."];
      if (!payload.status) newErrors.status = ["Status wajib diisi."];

      if (Object.keys(newErrors).length) {
        setErrors(newErrors);
        return;
      }

      let res;
      if (editId) res = await AssetsService.update(editId, payload);
      else res = await AssetsService.store(payload);

      const item = pickItem(res);

      if (item?.id != null) {
        upsertAsset(item);
      } else {
        upsertAsset({ id: editId ?? `tmp-${Date.now()}`, ...payload });
      }

      setOpenModal(false);
      setEditId(null);
    } catch (error) {
      console.log("ASSET SUBMIT ERROR:", error?.response?.status, error?.response?.data);

      const status = error?.response?.status;
      const data = error?.response?.data;

      if (status === 422) {
        setErrors(data?.errors || {});
        setSubmitError(data?.message || "Validasi gagal.");
        return;
      }

      setSubmitError(data?.message || error?.message || "Terjadi kesalahan.");
      console.error("Submit error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  /** =========================
   * ✅ delete
   * ========================= */
  const handleDelete = async (row) => {
    const id = row?.id;
    if (!id) return;

    const ok = window.confirm(`Hapus asset "${row?.assets_name ?? ""}" (${row?.assets_code ?? "-"}) ?`);
    if (!ok) return;

    try {
      await AssetsService.destroy(id);
      removeAsset(id);
    } catch (error) {
      console.error("Delete error:", error);
      alert(error?.response?.data?.message || "Gagal menghapus asset.");
    }
  };

  /** =========================
   * ✅ ACTION BUTTONS
   * ========================= */
  const actionBtnBase = useMemo(
    () => ({
      textTransform: "none",
      fontWeight: 900,
      borderRadius: 2,
      boxShadow: "none",
      minHeight: 34,
      lineHeight: 1.1,
      "&:hover": { boxShadow: "none" },
    }),
    [],
  );

  const renderActions = (row) => {
    if (isMobile) {
      return (
        <Stack direction="row" spacing={0.25} justifyContent="flex-end">
          <Tooltip title="Edit" arrow>
            <IconButton
              size="small"
              disabled={submitting}
              onClick={() => openEditModal(row)}
              sx={{
                borderRadius: 2,
                border: "1px solid",
                borderColor: alpha(theme.palette.primary.main, 0.25),
                bgcolor: alpha(theme.palette.primary.main, 0.06),
                color: theme.palette.primary.main,
                "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.1) },
              }}
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete" arrow>
            <IconButton
              size="small"
              disabled={submitting}
              onClick={() => handleDelete(row)}
              sx={{
                borderRadius: 2,
                border: "1px solid",
                borderColor: alpha(theme.palette.error.main, 0.3),
                bgcolor: alpha(theme.palette.error.main, 0.06),
                color: theme.palette.error.main,
                "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.1) },
              }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      );
    }

    return (
      <Stack direction="row" spacing={0.75} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
        <Button
          size="small"
          variant="outlined"
          startIcon={<EditOutlinedIcon />}
          disabled={submitting}
          onClick={() => openEditModal(row)}
          sx={{
            ...actionBtnBase,
            borderColor: alpha(theme.palette.primary.main, 0.25),
            bgcolor: alpha(theme.palette.primary.main, 0.03),
            "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.06) },
          }}
        >
          Edit
        </Button>

        <Button
          size="small"
          variant="outlined"
          color="error"
          startIcon={<DeleteOutlineIcon />}
          disabled={submitting}
          onClick={() => handleDelete(row)}
          sx={{
            ...actionBtnBase,
            borderColor: alpha(theme.palette.error.main, 0.3),
            bgcolor: alpha(theme.palette.error.main, 0.03),
            "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.06) },
          }}
        >
          Delete
        </Button>
      </Stack>
    );
  };

  /** =========================
   * ✅ status chip sesuai enum backend
   * ========================= */
  const statusChip = useCallback(
    (value) => {
      const v = normalizeEnum(value);

      const map = {
        available: {
          label: "Available",
          color: theme.palette.success.main,
          bg: alpha(theme.palette.success.main, 0.1),
          border: alpha(theme.palette.success.main, 0.25),
        },
        checked_out: {
          label: "Checked Out",
          color: theme.palette.warning.main,
          bg: alpha(theme.palette.warning.main, 0.1),
          border: alpha(theme.palette.warning.main, 0.25),
        },
        under_maintenance: {
          label: "Under Maintenance",
          color: theme.palette.info.main,
          bg: alpha(theme.palette.info.main, 0.1),
          border: alpha(theme.palette.info.main, 0.25),
        },
        retired: {
          label: "Retired",
          color: theme.palette.error.main,
          bg: alpha(theme.palette.error.main, 0.1),
          border: alpha(theme.palette.error.main, 0.25),
        },
      };

      const cfg = map[v] || {
        label: String(value ?? "-"),
        color: theme.palette.grey[700],
        bg: alpha(theme.palette.grey[600], 0.1),
        border: alpha(theme.palette.grey[600], 0.25),
      };

      return (
        <Chip
          size="small"
          label={cfg.label}
          sx={{
            height: 22,
            fontWeight: 900,
            borderRadius: 999,
            bgcolor: cfg.bg,
            color: cfg.color,
            border: "1px solid",
            borderColor: cfg.border,
          }}
        />
      );
    },
    [theme],
  );

  const tableData = useMemo(
    () =>
      (assets || []).map((a) => ({
        ...a,
        status_label: statusChip(a?.status),
      })),
    [assets, statusChip],
  );

  const fields = useMemo(
    () => [
      { type: "input", name: "assets_code", placeholder: "Asset Code" },
      { type: "input", name: "assets_name", placeholder: "Asset Name" },
      { type: "input", name: "category", placeholder: "Category" },
      { type: "input", name: "model", placeholder: "Model (optional)" },
      { type: "select", name: "status", placeholder: "Status", options: statusOptions }, // ✅ select
      { type: "input", name: "check_out_to", placeholder: "Check Out To (optional)" },
    ],
    [statusOptions],
  );

  return (
    <PageTransition>
      <Container maxWidth={false} disableGutters sx={{ px: isMobile ? 1.5 : 3, py: 2.5 }}>
        <Paper
          elevation={0}
          sx={{
            bgcolor: "#fff",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            overflow: "hidden",
            boxShadow: "0 10px 28px rgba(17, 24, 39, 0.06)",
            width: "100%",
          }}
        >
          <Box sx={{ px: isMobile ? 2 : 3, py: isMobile ? 2 : 2.5 }}>
            <Stack spacing={1.5}>
              <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Button
                    variant="text"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(-1)}
                    sx={{ textTransform: "none", fontWeight: 900, px: 0.75, borderRadius: 2, minWidth: 0 }}
                  >
                    Back
                  </Button>

                  <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />

                  <Chip
                    size="small"
                    label={`${assets.length} assets`}
                    sx={{ borderRadius: 1.5, fontWeight: 900, bgcolor: "rgba(17,24,39,0.04)" }}
                  />
                </Stack>
              </Stack>

              <Stack spacing={0.25}>
                <Typography
                  variant={isMobile ? "h6" : "h2"}
                  sx={{ fontWeight: 950, letterSpacing: -0.4, lineHeight: 1.1, color: "rgba(17,24,39,0.92)" }}
                >
                  Asset Management
                </Typography>

                <Typography variant="body2" sx={{ color: "rgba(17,24,39,0.62)" }}>
                  Kelola asset: kode, nama, kategori, status, dan peminjam.
                </Typography>
              </Stack>
            </Stack>
          </Box>

          <Divider />

          <Box sx={{ p: isMobile ? 1.25 : 2 }}>
            <DataTableResponsive
              columns={columns}
              data={tableData}
              onRefresh={handleRefresh}
              add={openCreateModal}
              loading={loading}
              renderActions={renderActions}
              renderActionsMobile={renderActions}
            />
          </Box>
        </Paper>
      </Container>

      <FormModal
        open={openModal}
        onClose={closeModal}
        fields={fields}
        form={form}
        setForm={setForm}
        onSubmit={handleSubmit}
        submitting={submitting}
        title={editId ? "Edit Asset" : "Tambah Asset"}
        errors={errors}
        submitError={submitError}
      />
    </PageTransition>
  );
}
