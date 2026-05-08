import React, { useMemo } from "react";
import {
  Modal,
  Drawer,
  Box,
  Typography,
  Divider,
  IconButton,
  CircularProgress,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  useMediaQuery,
  Paper,
  Stack,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";

const chipSx = { borderRadius: 999, fontWeight: 900 };

const fmt = (d) => {
  if (!d) return "-";
  const s = String(d).replace("T", " ").replace(".000Z", "");
  return s.length > 16 ? s.slice(0, 16) : s;
};

const typeLabel = (t) => {
  const k = String(t || "").toLowerCase();
  if (k.includes("progress")) return "Progress";
  if (k.includes("pending_start")) return "Pending Start";
  if (k.includes("pending_end")) return "Pending End";
  if (k.includes("hold")) return "Pending Start";
  if (k.includes("unhold")) return "Pending End";
  if (k.includes("resolve")) return "Resolved";
  if (k.includes("void")) return "Void";
  if (k.includes("start")) return "Start";
  return t || "-";
};

const typeChip = (t) => {
  const k = String(t || "").toLowerCase();
  if (k.includes("pending") || k.includes("hold"))
    return <Chip size="small" label="PENDING" sx={{ ...chipSx, bgcolor: "rgba(245,158,11,0.14)" }} />;
  if (k.includes("resolve"))
    return <Chip size="small" label="RESOLVED" sx={{ ...chipSx, bgcolor: "rgba(16,185,129,0.12)" }} />;
  if (k.includes("void"))
    return <Chip size="small" label="VOID" sx={{ ...chipSx, bgcolor: "rgba(239,68,68,0.12)" }} />;
  if (k.includes("progress"))
    return <Chip size="small" label="PROGRESS" sx={{ ...chipSx, bgcolor: "rgba(21,82,184,0.12)" }} />;
  return <Chip size="small" label="UPDATE" sx={{ ...chipSx, bgcolor: "rgba(15,23,42,0.06)" }} />;
};

const RowField = ({ label, value }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
    <Typography sx={{ fontSize: 12, fontWeight: 800, color: "text.secondary" }}>{label}</Typography>
    <Typography sx={{ fontSize: 12.5, fontWeight: 800, textAlign: "right" }}>{value}</Typography>
  </Box>
);

export default function ProjectDetailModal({ open, onClose, project, loading, error, data }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const rows = useMemo(() => {
    const list = Array.isArray(data) ? data : data?.history ?? data?.logs ?? data?.updates ?? data?.data ?? [];
    if (!Array.isArray(list)) return [];

    return list.map((x, i) => ({
      id: x?.id ?? i,
      type: x?.type ?? x?.action ?? x?.event ?? x?.status ?? "-",
      at: x?.progress_date ?? x?.created_at ?? x?.date ?? x?.at ?? x?.updated_at ?? "-",
      by: x?.by_name ?? x?.user_name ?? x?.actor_name ?? x?.created_by_name ?? "-",
      progress: x?.progress_percent ?? x?.progress ?? x?.percent ?? "",
      desc: x?.description ?? x?.detail ?? x?.reason ?? x?.notes ?? x?.message ?? "-",
      pending_minutes: x?.pending_minutes ?? x?.pending_minute ?? x?.minutes ?? "",
    }));
  }, [data]);

  const Header = (
    <Box
      sx={{
        px: isMobile ? 2 : 2.5,
        py: isMobile ? 1.5 : 2,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 2,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 950, letterSpacing: -0.3 }} noWrap>
          Detail Project
        </Typography>
        <Typography sx={{ mt: 0.25, fontSize: 13, fontWeight: 650, color: "text.secondary" }} noWrap>
          {project?.project_code || "-"} — {project?.project_name || "-"}
        </Typography>
      </Box>

      <IconButton onClick={onClose} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
        <CloseIcon />
      </IconButton>
    </Box>
  );

  const LoadingView = (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, py: 2 }}>
      <CircularProgress size={18} />
      <Typography sx={{ fontWeight: 750, fontSize: 13 }}>Loading detail...</Typography>
    </Box>
  );

  const EmptyView = (
    <Box sx={{ py: 3, textAlign: "center", color: "text.secondary", fontWeight: 750, fontSize: 13 }}>
      Belum ada riwayat update.
    </Box>
  );

  // ✅ MOBILE: list/cards (bukan table)
  const MobileList = (
    <Box sx={{ px: 2, pb: 2 }}>
      {error ? (
        <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        LoadingView
      ) : rows.length === 0 ? (
        EmptyView
      ) : (
        <Stack spacing={1.25}>
          {rows.map((r) => (
            <Paper
              key={r.id}
              variant="outlined"
              sx={{
                borderRadius: 2.5,
                p: 1.5,
                overflow: "hidden",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                {typeChip(r.type)}
                <Typography sx={{ fontWeight: 950, fontSize: 13, flex: 1, minWidth: 0 }} noWrap>
                  {typeLabel(r.type)}
                </Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 850, color: "text.secondary" }} noWrap>
                  {fmt(r.at)}
                </Typography>
              </Box>

              <Stack spacing={0.75}>
                <RowField label="Oleh" value={r.by || "-"} />
                <RowField label="Progress" value={r.progress !== "" ? `${r.progress}%` : "-"} />
                <RowField label="Pending (min)" value={r.pending_minutes !== "" ? r.pending_minutes : "-"} />
              </Stack>

              <Divider sx={{ my: 1.25 }} />

              <Typography sx={{ fontSize: 12, fontWeight: 800, color: "text.secondary", mb: 0.25 }}>
                Keterangan
              </Typography>
              <Typography sx={{ fontSize: 12.5, fontWeight: 800, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {r.desc || "-"}
              </Typography>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );

  // ✅ DESKTOP: table
  const DesktopTable = (
    <Box sx={{ px: 2.5, pb: 2.5 }}>
      {error ? (
        <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        LoadingView
      ) : (
        <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2.5, overflow: "hidden" }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "rgba(15,23,42,0.03)" }}>
                <TableCell sx={{ fontWeight: 950 }}>Jenis</TableCell>
                <TableCell sx={{ fontWeight: 950 }}>Waktu</TableCell>
                <TableCell sx={{ fontWeight: 950 }}>Oleh</TableCell>
                <TableCell sx={{ fontWeight: 950 }}>Progress</TableCell>
                <TableCell sx={{ fontWeight: 950 }}>Keterangan</TableCell>
                <TableCell sx={{ fontWeight: 950 }}>Pending (min)</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 3, textAlign: "center", color: "text.secondary" }}>
                    Belum ada riwayat update.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {typeChip(r.type)}
                        <Typography sx={{ fontWeight: 850, fontSize: 13 }}>{typeLabel(r.type)}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{fmt(r.at)}</TableCell>
                    <TableCell>{r.by}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{r.progress !== "" ? `${r.progress}%` : "-"}</TableCell>
                    <TableCell sx={{ maxWidth: 460, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {r.desc}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{r.pending_minutes !== "" ? r.pending_minutes : "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            overflow: "hidden",
          },
        }}
      >
        {Header}
        <Divider />
        <Box sx={{ maxHeight: "80vh", overflow: "auto" }}>{MobileList}</Box>
      </Drawer>
    );
  }

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", p: 2.5 }}>
        <Box
          sx={{
            width: "min(1050px, 96vw)",
            maxHeight: "84vh",
            bgcolor: "background.paper",
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
          }}
        >
          {Header}
          <Divider />
          <Box sx={{ maxHeight: "76vh", overflow: "auto" }}>{DesktopTable}</Box>
        </Box>
      </Box>
    </Modal>
  );
}
