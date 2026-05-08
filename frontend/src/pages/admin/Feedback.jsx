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
  Rating,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";

import FeedbacksService from "../../services/FeedbacksService";
import PageTransition from "../../components/animation/Transition";
import DataTableResponsive from "../../components/table/DatatableResponsive";

const safeNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

/** =========================
 * ✅ GLOBAL CACHE (biar balik page gak fetch ulang)
 * ========================= */
const FEEDBACK_CACHE = {
  list: null,        // array feedback
  avg: null,         // number
  hydrated: false,   // udah pernah fetch minimal 1x
  lastFetchedAt: 0,  // optional kalau mau TTL
};

export default function FeedbackPage() {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState([]);
  const [avgRating, setAvgRating] = useState(0);

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // anti race
  const reqIdRef = useRef(0);

  const columns = useMemo(
    () => [
      { title: "Ticket Code", data: "ticket_code" },
      { title: "Nama Pembuat", data: "nama_pembuat" },
      { title: "Description", data: "description" },
    ],
    []
  );

  /** =========================
   * ✅ fetch dari server (dipake saat cache kosong / refresh manual)
   * ========================= */
  const fetchFeedbacksFromServer = useCallback(async () => {
    const reqId = ++reqIdRef.current;

    const res = await FeedbacksService.show();

    // interceptor bisa return response.data, jadi:
    // A) { message, data: { rating, list } }
    // B) { rating, list }
    const payload = res?.data ?? res ?? {};
    const ratingFromApi = payload?.rating ?? 0;
    const listFromApi = payload?.list ?? [];

    if (reqId !== reqIdRef.current) return null;

    const avg = safeNumber(ratingFromApi, 0);
    const list = Array.isArray(listFromApi) ? listFromApi : [];

    // ✅ simpan global cache
    FEEDBACK_CACHE.avg = avg;
    FEEDBACK_CACHE.list = list;
    FEEDBACK_CACHE.hydrated = true;
    FEEDBACK_CACHE.lastFetchedAt = Date.now();

    return { avg, list };
  }, []);

  /** =========================
   * ✅ tampilkan cache dulu (instant)
   * return true kalau cache ada
   * ========================= */
  const showFromCacheOnly = useCallback(() => {
    if (FEEDBACK_CACHE.hydrated && Array.isArray(FEEDBACK_CACHE.list)) {
      setAvgRating(safeNumber(FEEDBACK_CACHE.avg, 0));
      setFeedback(FEEDBACK_CACHE.list);
      return true;
    }
    return false;
  }, []);

  /** =========================
   * ✅ refresh tombol (paksa fetch)
   * ========================= */
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFeedbacksFromServer();
      if (!data) return;
      setAvgRating(data.avg);
      setFeedback(data.list);
    } catch (e) {
      console.error("Fetch feedback error:", e);
      setAvgRating(0);
      setFeedback([]);
    } finally {
      setLoading(false);
    }
  }, [fetchFeedbacksFromServer]);

  /** =========================
   * ✅ ON MOUNT:
   * 1) show cache dulu
   * 2) kalau kosong baru fetch
   * ========================= */
  useEffect(() => {
    const hasCache = showFromCacheOnly();
    if (hasCache) return;

    // kalau belum ada cache sama sekali, baru fetch sekali
    handleRefresh();
  }, [showFromCacheOnly, handleRefresh]);

  const ratingShown = useMemo(() => clamp(avgRating, 0, 5), [avgRating]);
  const ratingLabel = useMemo(
    () => (safeNumber(avgRating, 0) ? avgRating.toFixed(1) : "0.0"),
    [avgRating]
  );

  return (
    <PageTransition>
      <Container
        maxWidth={false}
        disableGutters
        sx={{ px: isMobile ? 1.5 : 3, py: 2.5 }}
      >
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
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                gap={1.5}
                flexWrap="wrap"
              >
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
                    label={`${feedback.length} feedback`}
                    sx={{
                      borderRadius: 1.5,
                      fontWeight: 900,
                      bgcolor: "rgba(17,24,39,0.04)",
                    }}
                  />
                </Stack>

                <Stack
                  direction="row"
                  alignItems="center"
                  gap={1}
                  sx={{
                    ml: "auto",
                    flexWrap: "wrap",
                    justifyContent: { xs: "flex-start", sm: "flex-end" },
                  }}
                >
                  <Chip
                    size="small"
                    label={`Avg ${ratingLabel}`}
                    sx={{
                      borderRadius: 1.5,
                      fontWeight: 900,
                      bgcolor: "rgba(99,102,241,0.10)",
                    }}
                  />

                  <Tooltip title="Average rating">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      <Rating
                        value={ratingShown}
                        precision={0.5}
                        readOnly
                        size={isMobile ? "small" : "medium"}
                      />
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 900, color: "rgba(17,24,39,0.62)" }}
                      >
                        {ratingLabel}
                      </Typography>
                    </Box>
                  </Tooltip>
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
                  Kelola Feedback
                </Typography>

                <Typography variant="body2" sx={{ color: "rgba(17,24,39,0.62)" }}>
                  Manajemen data feedback dari user terkait ticket yang dibuat.
                </Typography>
              </Stack>
            </Stack>
          </Box>

          <Divider />

          <Box sx={{ p: isMobile ? 1.25 : 2 }}>
            <DataTableResponsive
              columns={columns}
              data={feedback}
              onRefresh={handleRefresh}  // ✅ refresh baru fetch
              loading={loading}
            />
          </Box>
        </Paper>
      </Container>
    </PageTransition>
  );
}
