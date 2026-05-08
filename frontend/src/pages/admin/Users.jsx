// src/pages/master/UsersPage.jsx
import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
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
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useNavigate } from "react-router-dom";

import PageTransition from "../../components/animation/Transition";
import DataTableResponsive from "../../components/table/DatatableResponsive";
import FormModal from "../../components/form/FormModal";

import UsersService from "../../services/UsersService";
import DepartmentsService from "../../services/DepartmentsService";

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

/** =========================
 * ✅ GLOBAL CACHE
 * ========================= */
const USERS_CACHE = {
  users: null,
  departments: null,
  hydrated: false,
  lastFetchedAt: 0,
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const reqIdRef = useRef(0);

  // ✅ role string: "admin" | "user"
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    role: "user",
    department_id: "",
    phone: "",
    job_position: "",
    password: "",
  });

  const resetModalState = () => {
    setErrors({});
    setSubmitError("");
  };

  // ✅ normalize role agar apapun dari API jadi "admin" / "user"
  const normalizeRole = (row) => {
    const raw = row?.role ?? row?.role_id ?? row?.role_name ?? "";
    const v = String(raw).toLowerCase().trim();
    if (v === "admin" || v === "1") return "admin";
    if (v === "user" || v === "2" || v === "3") return "user";
    return "user";
  };

  const roleOptions = useMemo(
    () => [
      { label: "Admin", value: "admin" },
      { label: "User", value: "user" },
    ],
    [],
  );

  const departmentOptions = useMemo(() => {
    return (departments || []).map((d) => ({
      label: d.location_name ? `${d.name} — ${d.location_name}` : d.name,
      value: String(d.id),
    }));
  }, [departments]);

  const columns = useMemo(
    () => [
      { title: "ID", data: "id" },
      { title: "Name", data: "name" },
      { title: "Username", data: "username" },
      { title: "Email", data: "email" },
      { title: "Role", data: "role_label" },
      { title: "Department", data: "department_name" },
      { title: "Location", data: "location_name" },
      { title: "Status", data: "status_label" }, // ✅ status chip
      { title: "Actions", data: "actions" },
    ],
    [],
  );

  /** =========================
   * ✅ CACHE: show dulu biar instant
   * ========================= */
  const showFromCacheOnly = useCallback(() => {
    if (USERS_CACHE.hydrated) {
      setUsers(Array.isArray(USERS_CACHE.users) ? USERS_CACHE.users : []);
      setDepartments(Array.isArray(USERS_CACHE.departments) ? USERS_CACHE.departments : []);
      setLoading(false);
      return true;
    }
    return false;
  }, []);

  /** =========================
   * ✅ fetch barengan (users + departments)
   * ========================= */
  const fetchAllFromServer = useCallback(async () => {
    const reqId = ++reqIdRef.current;

    const [uRes, dRes] = await Promise.all([
      UsersService.show(),
      DepartmentsService.show().catch(() => []),
    ]);

    if (reqId !== reqIdRef.current) return null;

    const uList = extractArray(uRes);
    const dList = extractArray(dRes);

    USERS_CACHE.users = uList;
    USERS_CACHE.departments = dList;
    USERS_CACHE.hydrated = true;
    USERS_CACHE.lastFetchedAt = Date.now();

    return { uList, dList };
  }, []);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAllFromServer();
      if (!res) return;
      setUsers(res.uList);
      setDepartments(res.dList);
    } catch (e) {
      console.error("Fetch users error:", e);
      USERS_CACHE.hydrated = false;
      USERS_CACHE.users = null;
      USERS_CACHE.departments = null;
      setUsers([]);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, [fetchAllFromServer]);

  useEffect(() => {
    const hasCache = showFromCacheOnly();
    if (hasCache) return;
    handleRefresh();
  }, [showFromCacheOnly, handleRefresh]);

  /** =========================
   * ✅ optimistic helpers
   * ========================= */
  const upsertUser = useCallback((item) => {
    const current = Array.isArray(USERS_CACHE.users) ? [...USERS_CACHE.users] : [];
    const idx = current.findIndex((x) => String(x.id) === String(item?.id));
    if (idx >= 0) current[idx] = { ...current[idx], ...item };
    else current.unshift(item);

    USERS_CACHE.users = current;
    USERS_CACHE.hydrated = true;
    USERS_CACHE.lastFetchedAt = Date.now();

    setUsers(current);
  }, []);

  const removeUser = useCallback((id) => {
    const current = Array.isArray(USERS_CACHE.users) ? [...USERS_CACHE.users] : [];
    const next = current.filter((x) => String(x.id) !== String(id));

    USERS_CACHE.users = next;
    USERS_CACHE.hydrated = true;
    USERS_CACHE.lastFetchedAt = Date.now();

    setUsers(next);
  }, []);

  /** =========================
   * ✅ modal controls
   * ========================= */
  const openCreateModal = () => {
    setEditId(null);
    resetModalState();
    setForm({
      name: "",
      username: "",
      email: "",
      role: "user",
      department_id: "",
      phone: "",
      job_position: "",
      password: "",
    });
    setOpenModal(true);
  };

  const openEditModal = (row) => {
    setEditId(row?.id ?? null);
    resetModalState();
    setForm({
      name: row?.name ?? "",
      username: row?.username ?? "",
      email: row?.email ?? "",
      role: normalizeRole(row),
      department_id: row?.department_id != null ? String(row.department_id) : "",
      phone: row?.phone ?? "",
      job_position: row?.job_position ?? "",
      password: "",
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

      const res = await UsersService.save({ id: editId, form });
      const userItem = pickItem(res);

      if (userItem?.id != null) {
        upsertUser(userItem);
      } else {
        upsertUser({
          id: editId ?? `tmp-${Date.now()}`,
          name: form.name,
          username: form.username,
          email: form.email,
          role: form.role,
          department_id: form.department_id,
          phone: form.phone,
          job_position: form.job_position,
        });
      }

      setOpenModal(false);
      setEditId(null);
    } catch (error) {
      console.log("SAVE USER ERROR:", error?.response?.status, error?.response?.data);

      const status = error?.response?.status;
      const data = error?.response?.data;

      if (status === 422) {
        setErrors(data?.errors || {});
        setSubmitError(data?.message || "Validasi gagal.");
        return;
      }

      setSubmitError(data?.message || error?.message || "Terjadi kesalahan.");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  /** =========================
   * ✅ status-only approve/delete
   * ========================= */
  const canApprove = (row) => String(row?.status ?? "").toLowerCase() !== "active";

  const handleDelete = async (row) => {
    const id = row?.id;
    if (!id) return;
    if (!window.confirm(`Hapus user "${row?.name ?? ""}"?`)) return;

    try {
      await UsersService.destroy(id);
      removeUser(id);
    } catch (error) {
      alert(error?.message || "Gagal menghapus user.");
    }
  };

  const handleApprove = async (row) => {
    const id = row?.id;
    if (!id) return;
    if (!window.confirm(`Approve user "${row?.name ?? ""}"?`)) return;

    try {
      const res = await UsersService.approve(id);
      const approvedUser = pickItem(res);

      if (approvedUser?.id != null) {
        upsertUser(approvedUser);
      } else {
        // fallback optimistic
        upsertUser({ id, status: "active" });
      }
    } catch (error) {
      alert(error?.message || "Gagal approve user.");
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
    const showApprove = canApprove(row);

    if (isMobile) {
      return (
        <Stack direction="row" spacing={0.25} justifyContent="flex-end">
          {showApprove && (
            <Tooltip title="Approve" arrow>
              <IconButton
                size="small"
                disabled={submitting}
                onClick={() => handleApprove(row)}
                sx={{
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: alpha(theme.palette.success.main, 0.35),
                  bgcolor: alpha(theme.palette.success.main, 0.08),
                  color: theme.palette.success.main,
                  "&:hover": { bgcolor: alpha(theme.palette.success.main, 0.12) },
                }}
              >
                <CheckCircleOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

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
        {showApprove && (
          <Button
            size="small"
            variant="contained"
            color="success"
            startIcon={<CheckCircleOutlineIcon />}
            disabled={submitting}
            onClick={() => handleApprove(row)}
            sx={{ ...actionBtnBase, px: 1.4 }}
          >
            Approve
          </Button>
        )}

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

  const fields = useMemo(
    () => [
      { type: "input", name: "name", placeholder: "Nama" },
      { type: "input", name: "username", placeholder: "Username" },
      { type: "input", name: "email", placeholder: "Email" },
      { type: "select", name: "role", placeholder: "Role", options: roleOptions },
      { type: "select", name: "department_id", placeholder: "Department", options: departmentOptions },
      { type: "input", name: "phone", placeholder: "No. HP" },
      { type: "input", name: "job_position", placeholder: "Job Position" },
      {
        type: "input",
        name: "password",
        placeholder: editId ? "Password (isi jika ingin mengubah)" : "Password",
      },
    ],
    [roleOptions, departmentOptions, editId],
  );

  // ✅ status chip + role chip
  const tableData = useMemo(
    () =>
      (users || []).map((u) => {
        const role = normalizeRole(u);
        const st = String(u?.status ?? "").toLowerCase();
        const isActive = st === "active";

        return {
          ...u,

          role_label: (
            <Chip
              size="small"
              label={role === "admin" ? "Admin" : "User"}
              sx={{
                height: 22,
                fontWeight: 900,
                borderRadius: 999,
                bgcolor:
                  role === "admin"
                    ? alpha(theme.palette.primary.main, 0.08)
                    : "rgba(17,24,39,0.04)",
                color: role === "admin" ? theme.palette.primary.main : "rgba(17,24,39,0.75)",
                border: "1px solid",
                borderColor:
                  role === "admin"
                    ? alpha(theme.palette.primary.main, 0.25)
                    : "rgba(17,24,39,0.12)",
              }}
            />
          ),

          status_label: isActive ? (
            <Chip
              size="small"
              label="Approved"
              sx={{
                height: 22,
                fontWeight: 900,
                borderRadius: 999,
                bgcolor: alpha(theme.palette.success.main, 0.10),
                color: theme.palette.success.main,
                border: "1px solid",
                borderColor: alpha(theme.palette.success.main, 0.25),
              }}
            />
          ) : (
            <Chip
              size="small"
              label="Pending"
              sx={{
                height: 22,
                fontWeight: 900,
                borderRadius: 999,
                bgcolor: alpha(theme.palette.warning.main, 0.10),
                color: theme.palette.warning.main,
                border: "1px solid",
                borderColor: alpha(theme.palette.warning.main, 0.25),
              }}
            />
          ),
        };
      }),
    [users, theme],
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
                    label={`${users.length} users`}
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
                  User Management
                </Typography>

                <Typography variant="body2" sx={{ color: "rgba(17,24,39,0.62)" }}>
                  Kelola user, approve, edit, dan hapus data user.
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
        title={editId ? "Edit User" : "Tambah User"}
        errors={errors}
        submitError={submitError}
      />
    </PageTransition>
  );
}
