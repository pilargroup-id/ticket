// src/pages/master/DepartmentsPage.jsx
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

import PageTransition from "../../components/animation/Transition";
import DataTableResponsive from "../../components/table/DatatableResponsive";
import FormModal from "../../components/form/FormModal";

import DepartmentsService from "../../services/DepartmentsService";
import LocationsService from "../../services/LocationsService";

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
const DEPT_CACHE = {
  departments: null,
  locations: null,
  hydrated: false,
  lastFetchedAt: 0,
};

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  const [form, setForm] = useState({ name: "", location_id: "" });

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const reqIdRef = useRef(0);

  const columns = useMemo(
    () => [
      { title: "Department ID", data: "id" },
      { title: "Department Name", data: "name" },
      { title: "Location", data: "location_name" },
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
    if (DEPT_CACHE.hydrated) {
      setDepartments(Array.isArray(DEPT_CACHE.departments) ? DEPT_CACHE.departments : []);
      setLocations(Array.isArray(DEPT_CACHE.locations) ? DEPT_CACHE.locations : []);
      setLoading(false);
      return true;
    }
    return false;
  }, []);

  /** =========================
   * ✅ fetch barengan (departments + locations)
   * ========================= */
  const fetchAllFromServer = useCallback(async () => {
    const reqId = ++reqIdRef.current;

    const [dRes, lRes] = await Promise.all([
      DepartmentsService.show(),
      LocationsService.show().catch(() => []),
    ]);

    if (reqId !== reqIdRef.current) return null;

    const dList = extractArray(dRes);
    const lList = extractArray(lRes);

    DEPT_CACHE.departments = dList;
    DEPT_CACHE.locations = lList;
    DEPT_CACHE.hydrated = true;
    DEPT_CACHE.lastFetchedAt = Date.now();

    return { dList, lList };
  }, []);

  /** =========================
   * ✅ refresh tombol/table: paksa fetch
   * ========================= */
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAllFromServer();
      if (!res) return;
      setDepartments(res.dList);
      setLocations(res.lList);
    } catch (e) {
      console.error("Fetch departments/locations error:", e);
      DEPT_CACHE.hydrated = false;
      DEPT_CACHE.departments = null;
      DEPT_CACHE.locations = null;
      setDepartments([]);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }, [fetchAllFromServer]);

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
  const upsertDepartment = useCallback((item) => {
    const current = Array.isArray(DEPT_CACHE.departments) ? [...DEPT_CACHE.departments] : [];
    const idx = current.findIndex((x) => String(x?.id) === String(item?.id));
    if (idx >= 0) current[idx] = { ...current[idx], ...item };
    else current.unshift(item);

    DEPT_CACHE.departments = current;
    DEPT_CACHE.hydrated = true;
    DEPT_CACHE.lastFetchedAt = Date.now();

    setDepartments(current);
  }, []);

  const removeDepartment = useCallback((id) => {
    const current = Array.isArray(DEPT_CACHE.departments) ? [...DEPT_CACHE.departments] : [];
    const next = current.filter((x) => String(x?.id) !== String(id));

    DEPT_CACHE.departments = next;
    DEPT_CACHE.hydrated = true;
    DEPT_CACHE.lastFetchedAt = Date.now();

    setDepartments(next);
  }, []);

  const findLocationName = useCallback(
    (locationId) => {
      const id = String(locationId ?? "");
      const loc = (DEPT_CACHE.locations || locations || []).find((x) => String(x?.id) === id);
      return loc?.name ?? "";
    },
    [locations],
  );

  /** =========================
   * ✅ modal controls
   * ========================= */
  const openCreateModal = () => {
    setEditId(null);
    resetModalState();
    setForm({ name: "", location_id: "" });
    setOpenModal(true);

    // kalau locations belum ada (jarang), paksa refresh sekali
    if (!Array.isArray(DEPT_CACHE.locations)) handleRefresh();
  };

  const openEditModal = (row) => {
    setEditId(row?.id ?? null);
    resetModalState();
    setForm({
      name: row?.name ?? "",
      location_id: row?.location_id != null ? String(row.location_id) : "",
    });
    setOpenModal(true);

    if (!Array.isArray(DEPT_CACHE.locations)) handleRefresh();
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
      const location_id = String(form?.location_id ?? "").trim();

      const newErrors = {};
      if (!name) newErrors.name = ["Nama department wajib diisi."];
      if (!location_id) newErrors.location_id = ["Location wajib dipilih."];

      if (Object.keys(newErrors).length) {
        setErrors(newErrors);
        return;
      }

      let res;
      if (editId) res = await DepartmentsService.update(editId, { name, location_id });
      else res = await DepartmentsService.store({ name, location_id });

      const item = pickItem(res);

      // patch biar tabel langsung rapi meskipun API ga balikin location_name
      const patch = {
        id: item?.id ?? editId ?? `tmp-${Date.now()}`,
        name: item?.name ?? name,
        location_id: item?.location_id ?? location_id,
        location_name: item?.location_name ?? findLocationName(location_id) ?? "",
      };

      upsertDepartment(patch);

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

    const ok = window.confirm(`Hapus department "${row?.name ?? ""}"?`);
    if (!ok) return;

    try {
      await DepartmentsService.destroy(id);
      removeDepartment(id);
    } catch (error) {
      console.error("Delete error:", error);
      alert(error?.response?.data?.message || "Gagal menghapus department.");
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

  /** =========================
   * ✅ Field options
   * ========================= */
  const locationOptions = useMemo(
    () =>
      (locations || []).map((l) => ({
        label: l.name,
        value: String(l.id),
      })),
    [locations],
  );

  const fields = useMemo(
    () => [
      { type: "input", name: "name", placeholder: "Nama Department" },
      {
        type: "select",
        name: "location_id",
        placeholder: "Pilih Location",
        options: locationOptions,
      },
    ],
    [locationOptions],
  );

  /** =========================
   * ✅ location chip biar elegan
   * ========================= */
  const locationChip = useCallback(
    (name) => (
      <Chip
        size="small"
        label={name || "-"}
        sx={{
          height: 22,
          fontWeight: 900,
          borderRadius: 999,
          bgcolor: "rgba(17,24,39,0.04)",
          color: "rgba(17,24,39,0.82)",
          border: "1px solid",
          borderColor: "rgba(17,24,39,0.10)",
        }}
      />
    ),
    [],
  );

  const tableData = useMemo(
    () =>
      (departments || []).map((d) => ({
        ...d,
        location_name: locationChip(d?.location_name),
      })),
    [departments, locationChip],
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
                    label={`${departments.length} department`}
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
                  Kelola Department
                </Typography>

                <Typography variant="body2" sx={{ color: "rgba(17,24,39,0.62)" }}>
                  Manajemen department, terhubung dengan lokasi.
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
        title={editId ? "Edit Department" : "Tambah Department"}
        errors={errors}
        submitError={submitError}
      />
    </PageTransition>
  );
}
