// src/pages/master/CategoriesPage.jsx
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

import CategoriesService from "../../services/CategoriesService";
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

const pickItem = (res) => res?.data?.data ?? res?.data ?? res ?? null;

const normalizeName = (v) => String(v ?? "").trim().replace(/\s+/g, " ");

/** =========================
 * ✅ GLOBAL CACHE (biar balik page gak fetch ulang)
 * ========================= */
const CATEGORIES_CACHE = {
  categories: null,
  hydrated: false,
  lastFetchedAt: 0,
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  const [form, setForm] = useState({ name: "" });

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const reqIdRef = useRef(0);

  const columns = useMemo(
    () => [
      { title: "Category ID", data: "id" },
      { title: "Category Name", data: "name" },
      { title: "Actions", data: "actions" },
    ],
    [],
  );

  const resetModalState = () => {
    setErrors({});
    setSubmitError("");
  };

  /** =========================
   * ✅ CACHE: show dulu biar instant
   * ========================= */
  const showFromCacheOnly = useCallback(() => {
    if (CATEGORIES_CACHE.hydrated) {
      setCategories(Array.isArray(CATEGORIES_CACHE.categories) ? CATEGORIES_CACHE.categories : []);
      setLoading(false);
      return true;
    }
    return false;
  }, []);

  /** =========================
   * ✅ fetch
   * ========================= */
  const fetchFromServer = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    const res = await CategoriesService.show();
    if (reqId !== reqIdRef.current) return null;

    const list = extractArray(res);

    CATEGORIES_CACHE.categories = list;
    CATEGORIES_CACHE.hydrated = true;
    CATEGORIES_CACHE.lastFetchedAt = Date.now();

    return list;
  }, []);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchFromServer();
      if (!list) return;
      setCategories(list);
    } catch (e) {
      console.error("Fetch categories error:", e);
      CATEGORIES_CACHE.hydrated = false;
      CATEGORIES_CACHE.categories = null;
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [fetchFromServer]);

  /** =========================
   * ✅ ON MOUNT
   * ========================= */
  useEffect(() => {
    const hasCache = showFromCacheOnly();
    if (hasCache) return;
    handleRefresh();
  }, [showFromCacheOnly, handleRefresh]);

  /** =========================
   * ✅ optimistic helpers
   * ========================= */
  const upsertCategory = useCallback((item) => {
    const current = Array.isArray(CATEGORIES_CACHE.categories) ? [...CATEGORIES_CACHE.categories] : [];
    const idx = current.findIndex((x) => String(x?.id) === String(item?.id));
    if (idx >= 0) current[idx] = { ...current[idx], ...item };
    else current.unshift(item);

    CATEGORIES_CACHE.categories = current;
    CATEGORIES_CACHE.hydrated = true;
    CATEGORIES_CACHE.lastFetchedAt = Date.now();

    setCategories(current);
  }, []);

  const removeCategory = useCallback((id) => {
    const current = Array.isArray(CATEGORIES_CACHE.categories) ? [...CATEGORIES_CACHE.categories] : [];
    const next = current.filter((x) => String(x?.id) !== String(id));

    CATEGORIES_CACHE.categories = next;
    CATEGORIES_CACHE.hydrated = true;
    CATEGORIES_CACHE.lastFetchedAt = Date.now();

    setCategories(next);
  }, []);

  /** =========================
   * ✅ modal controls
   * ========================= */
  const openCreateModal = () => {
    setEditId(null);
    resetModalState();
    setForm({ name: "" });
    setOpenModal(true);
  };

  const openEditModal = (row) => {
    setEditId(row?.id ?? null);
    resetModalState();
    setForm({ name: row?.name ?? "" });
    setOpenModal(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setOpenModal(false);
  };

  /** =========================
   * ✅ submit create/edit (optimistic)
   * ========================= */
  const handleSubmit = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      resetModalState();

      const name = normalizeName(form?.name);

      if (!name) {
        setErrors({ name: ["Nama category wajib diisi."] });
        return;
      }

      let res;
      if (editId) res = await CategoriesService.update(editId, name);
      else res = await CategoriesService.store(name);

      const item = pickItem(res);

      upsertCategory({
        id: item?.id ?? editId ?? `tmp-${Date.now()}`,
        name: item?.name ?? name,
      });

      setOpenModal(false);
      setEditId(null);
    } catch (error) {
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
   * ✅ delete (optimistic)
   * ========================= */
  const handleDelete = async (row) => {
    const id = row?.id;
    if (!id) return;

    const ok = window.confirm(`Hapus category "${row?.name ?? ""}"?`);
    if (!ok) return;

    try {
      await CategoriesService.destroy(id);
      removeCategory(id);
    } catch (error) {
      console.error("Delete error:", error);
      alert(error?.response?.data?.message || "Gagal menghapus category.");
    }
  };

  /** =========================
   * ✅ ACTION BUTTONS (modern + mobile compact)
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

  const fields = useMemo(() => [{ type: "input", name: "name", placeholder: "Nama Category" }], []);

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
                    sx={{
                      textTransform: "none",
                      fontWeight: 900,
                      px: 0.75,
                      borderRadius: 2,
                      minWidth: 0,
                    }}
                  >
                    Back
                  </Button>

                  <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />

                  <Chip
                    size="small"
                    label={`${categories.length} kategori`}
                    sx={{
                      borderRadius: 1.5,
                      fontWeight: 900,
                      bgcolor: "rgba(17,24,39,0.04)",
                    }}
                  />
                </Stack>
              </Stack>

              <Stack spacing={0.25}>
                <Typography
                  variant={isMobile ? "h6" : "h2"}
                  sx={{
                    fontWeight: 950,
                    letterSpacing: -0.4,
                    lineHeight: 1.1,
                    color: "rgba(17,24,39,0.92)",
                  }}
                >
                  Kelola Category
                </Typography>

                <Typography variant="body2" sx={{ color: "rgba(17,24,39,0.62)" }}>
                  Manajemen data category yang digunakan pada sistem
                </Typography>
              </Stack>
            </Stack>
          </Box>

          <Divider />

          <Box sx={{ p: isMobile ? 1.25 : 2 }}>
            <DataTableResponsive
              columns={columns}
              data={categories}
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
        title={editId ? "Edit Category" : "Tambah Category"}
        errors={errors}
        submitError={submitError}
      />
    </PageTransition>
  );
}
