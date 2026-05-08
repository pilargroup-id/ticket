import React, { useCallback, useMemo, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Paper,
  Button,
  Divider,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import ReportService from "../../services/ReportService";

const humanMinutes = (minutes) => {
  const m = Math.max(0, Number(minutes || 0));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h > 0 && mm > 0) return `${h} jam ${mm} menit`;
  if (h > 0) return `${h} jam`;
  return `${mm} menit`;
};

const getErrMsg = (e, fallback) =>
  e?.response?.data?.message || e?.response?.message || e?.message || fallback;

// =======================
// MiniTable (improved)
// =======================
const MiniTable = ({ rows = [] }) => (
  <Box
    sx={{
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 2.5,
      overflow: "hidden",
      bgcolor: "background.paper",
    }}
  >
    <Box
      sx={{
        overflow: "auto",
        maxHeight: 360,
      }}
    >
      <Box
        component="table"
        sx={{
          width: "100%",
          tableLayout: "fixed",
          borderCollapse: "separate",
          borderSpacing: 0,

          // cell base
          "& th, & td": {
            borderBottom: "1px solid",
            borderColor: "divider",
            px: 1.25,
            py: 1,
            fontSize: 12,
            verticalAlign: "top",
            textAlign: "left", // ✅ bikin konsisten
          },

          // header
          "& thead th": {
            position: "sticky",
            top: 0,
            zIndex: 2,
            bgcolor: "background.paper",
            fontWeight: 950,
            fontSize: 12,
            letterSpacing: 0.2,
            borderBottom: "1px solid",
            borderColor: "divider",
            whiteSpace: "nowrap",
          },

          // body rows: zebra + hover
          "& tbody tr:nth-of-type(odd)": {
            bgcolor: "action.hover",
          },
          "& tbody tr:hover": {
            bgcolor: "action.selected",
          },

          // last row no extra border feel
          "& tbody tr:last-of-type td": {
            borderBottom: "none",
          },
        }}
      >
        <thead>
          <tr>
            <th style={{ width: 120 }}>Code</th>
            <th style={{ width: 170 }}>User</th>
            <th style={{ width: 170 }}>Category</th>
            <th style={{ width: 120 }}>Status</th>
            <th style={{ width: 95, textAlign: "center" }}>Time</th>
            <th style={{ width: 320 }}>Problem</th>
            <th style={{ width: 320 }}>Solution</th>
            <th style={{ width: 70, textAlign: "center" }}>Late</th>
            <th style={{ width: 170, textAlign: "center" }}>Created</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((t) => (
            <tr key={t.id}>
              <td
                style={{
                  fontWeight: 900,
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  whiteSpace: "nowrap",
                }}
              >
                {t.ticket_code}
              </td>

              <td style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {t.user_name || "-"}
              </td>

              <td style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {t.category_name || "-"}
              </td>

              <td style={{ whiteSpace: "nowrap" }}>{t.status}</td>

              <td
                style={{
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  fontWeight: 850,
                }}
              >
                {humanMinutes(t.time_spent)}
              </td>

              {/* Problem: wrap + clamp biar rapih */}
              <td
                style={{
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                }}
              >
                <Box
                  sx={{
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    lineHeight: 1.4,
                  }}
                  title={t.problem || ""}
                >
                  {t.problem || "-"}
                </Box>
              </td>

              {/* Solution: wrap + clamp biar rapih */}
              <td
                style={{
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                }}
              >
                <Box
                  sx={{
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    lineHeight: 1.4,
                  }}
                  title={t.solution || ""}
                >
                  {t.solution || "-"}
                </Box>
              </td>

              <td
                style={{
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  fontWeight: 950,
                }}
              >
                {t.is_late ? "Yes" : "No"}
              </td>

              <td
                style={{
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  fontSize: 11,
                  color: "rgba(0,0,0,0.65)",
                }}
              >
                {t.created_at || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </Box>
    </Box>
  </Box>
);

export default function SupportPerformanceCards({ data = [], startDate, endDate, status }) {
  const [openId, setOpenId] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [detailRows, setDetailRows] = useState([]);

  const sorted = useMemo(() => {
    const arr = Array.isArray(data) ? data : [];
    return [...arr].sort((a, b) => Number(b.total_tickets || 0) - Number(a.total_tickets || 0));
  }, [data]);

  const fetchDetail = useCallback(
    async (supportId) => {
      setDetailError(null);
      setDetailLoading(true);
      try {
        const rows = await ReportService.ticketsDetailBySupport(supportId, {
          start_date: startDate,
          end_date: endDate,
          status,
          per_page: 5000,
        });
        setDetailRows(rows);
      } catch (e) {
        setDetailError(getErrMsg(e, "Failed to fetch ticket detail"));
        setDetailRows([]);
      } finally {
        setDetailLoading(false);
      }
    },
    [startDate, endDate, status]
  );

  const toggleOpen = useCallback(
    async (supportId) => {
      if (openId === supportId) {
        setOpenId(null);
        return;
      }
      setOpenId(supportId);
      await fetchDetail(supportId);
    },
    [openId, fetchDetail]
  );

  if (!sorted.length) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
        <Typography sx={{ color: "text.secondary", fontWeight: 800, fontSize: 13 }}>
          No data
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1.5}>
      {sorted.map((s) => {
        const isOpen = openId === s.support_id;
        return (
          <Paper
            key={s.support_id}
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
              overflow: "hidden",
              bgcolor: "background.paper",
            }}
          >
            <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.25}
                alignItems={{ xs: "flex-start", md: "center" }}
                justifyContent="space-between"
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 950, letterSpacing: -0.25 }} noWrap>
                    {s.support_name || `Support ${s.support_id}`}
                  </Typography>

                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 0.75 }}>
                    <Chip size="small" label={`Total: ${s.total_tickets ?? 0}`} />
                    <Chip size="small" label={`Resolved: ${s.resolved_tickets ?? 0}`} />
                    <Chip size="small" label={`Open: ${s.open_tickets ?? 0}`} />
                    <Chip size="small" label={`Late: ${s.late_tickets ?? 0}`} />
                    <Chip size="small" label={`Total Time: ${s.total_time_human || humanMinutes(s.total_minutes)}`} />
                    <Chip size="small" label={`Avg: ${s.avg_time_human || humanMinutes(s.avg_minutes)}`} />
                  </Stack>
                </Box>

                <Button
                  variant={isOpen ? "outlined" : "contained"}
                  onClick={() => toggleOpen(s.support_id)}
                  sx={{ borderRadius: 2.25, textTransform: "none", fontWeight: 900, minHeight: 40 }}
                >
                  {isOpen ? "Hide Detail" : "View Detail"}
                </Button>
              </Stack>
            </Box>

            {isOpen ? (
              <>
                <Divider />
                <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
                  {detailError ? (
                    <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
                      {detailError}
                    </Alert>
                  ) : null}

                  {detailLoading ? (
                    <Box sx={{ display: "grid", placeItems: "center", py: 4 }}>
                      <Stack alignItems="center" spacing={1}>
                        <CircularProgress size={22} />
                        <Typography sx={{ fontSize: 12, fontWeight: 800, color: "text.secondary" }}>
                          Loading detail...
                        </Typography>
                      </Stack>
                    </Box>
                  ) : (
                    <MiniTable rows={detailRows} />
                  )}

                  {!detailRows?.length && !detailLoading ? (
                    <Typography sx={{ mt: 1.25, color: "text.secondary", fontWeight: 900, fontSize: 13 }}>
                      No data
                    </Typography>
                  ) : null}
                </Box>
              </>
            ) : null}
          </Paper>
        );
      })}
    </Stack>
  );
}
