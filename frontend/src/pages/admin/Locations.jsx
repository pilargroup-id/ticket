// src/pages/master/LocationsPage.jsx
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

import LocationsService from "../../services/LocationsService";
import PageTransition from "../../components/animation/Transition";
import DataTableResponsive from "../../components/table/DatatableResponsive";
import FormModal from "../../components/form/FormModal";

/** =========================
 * ✅ GLOBAL CACHE
 * ========================= */
const LOCATIONS_CACHE = {
  locations: null,
  hydrated: false,
  lastFetchedAt: 0,
};

const normalizeName = (v) => String(v ?? "").trim().replace(/\s+/g, " ");

const pickItem = (res) => res?.data?.data ?? res?.data ?? res ?? null;

export default function LocationsPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({ name: "" });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // anti-race
  const reqIdRef = useRef(0);

  const columns = useMemo(
    () => [
      { title: "Location ID", data: "id" },
      { title: "Location Name", data: "name" },
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
    if (LOCATIONS_CACHE.hydrated) {
      setLocations(Array.isArray(LOCATIONS_CACHE.locations) ? LOCATIONS_CACHE.locations : []);
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

    const res = await LocationsService.show(); // idealnya array / {data:[...]} tergantung service
    if (reqId !== reqIdRef.current) return null;

    const list = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
          ? res.data.data
          : [];

    LOCATIONS_CACHE.locations = list;
    LOCATIONS_CACHE.hydrated = true;
    LOCATIONS_CACHE.lastFetchedAt = Date.now();

    return list;
  }, []);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchFromServer();
      if (!list) return;
      setLocations(list);
    } catch (e) {
      console.error("Fetch locations error:", e);
      LOCATIONS_CACHE.hydrated = false;
      LOCATIONS_CACHE.locations = null;
      setLocations([]);
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
  const upsertLocation = useCallback((item) => {
    const current = Array.isArray(LOCATIONS_CACHE.locations) ? [...LOCATIONS_CACHE.locations] : [];
    const idx = current.findIndex((x) => String(x?.id) === String(item?.id));
    if (idx >= 0) current[idx] = { ...current[idx], ...item };
    else current.unshift(item);

    LOCATIONS_CACHE.locations = current;
    LOCATIONS_CACHE.hydrated = true;
    LOCATIONS_CACHE.lastFetchedAt = Date.now();

    setLocations(current);
  }, []);

  const removeLocation = useCallback((id) => {
    const current = Array.isArray(LOCATIONS_CACHE.locations) ? [...LOCATIONS_CACHE.locations] : [];
    const next = current.filter((x) => String(x?.id) !== String(id));

    LOCATIONS_CACHE.locations = next;
    LOCATIONS_CACHE.hydrated = true;
    LOCATIONS_CACHE.lastFetchedAt = Date.now();

    setLocations(next);
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
        setErrors({ name: ["Nama location wajib diisi."] });
        return;
      }

      let res;
      if (editId) res = await LocationsService.update(editId, name);
      else res = await LocationsService.store(name);

      const item = pickItem(res);

      upsertLocation({
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

    const ok = window.confirm(`Hapus location "${row?.name ?? ""}"?`);
    if (!ok) return;

    try {
      await LocationsService.destroy(id);
      removeLocation(id);
    } catch (error) {
      console.error("Delete error:", error);
      alert(error?.response?.data?.message || "Gagal menghapus location.");
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
                "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.10) },
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
                borderColor: alpha(theme.palette.error.main, 0.30),
                bgcolor: alpha(theme.palette.error.main, 0.06),
                color: theme.palette.error.main,
                "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.10) },
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
            borderColor: alpha(theme.palette.error.main, 0.30),
            bgcolor: alpha(theme.palette.error.main, 0.03),
            "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.06) },
          }}
        >
          Delete
        </Button>
      </Stack>
    );
  };

  const fields = useMemo(() => [{ type: "input", name: "name", placeholder: "Nama Location" }], []);

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
                <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
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
                    label={`${locations.length} lokasi`}
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
                  Kelola Location
                </Typography>

                <Typography variant="body2" sx={{ color: "rgba(17,24,39,0.62)" }}>
                  Manajemen data lokasi (kantor/site/area) untuk department, user, dan asset.
                </Typography>
              </Stack>
            </Stack>
          </Box>

          <Divider />

          <Box sx={{ p: isMobile ? 1.25 : 2 }}>
            <DataTableResponsive
              columns={columns}
              data={locations}
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
        title={editId ? "Edit Location" : "Tambah Location"}
        errors={errors}
        submitError={submitError}
      />
    </PageTransition>
  );
}
