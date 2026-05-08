import React, { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler, Legend);

const monthLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const monthLabel = (m) => monthLabels[(Number(m) || 0) - 1] ?? String(m);

function NoData({ height = 360 }) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        height,
        display: "grid",
        placeItems: "center",
        borderRadius: 3,
        border: "1px dashed",
        borderColor: alpha(theme.palette.text.primary, theme.palette.mode === "dark" ? 0.22 : 0.14),
        bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === "dark" ? 0.06 : 0.03),
      }}
    >
      <Box sx={{ textAlign: "center" }}>
        <Typography sx={{ fontWeight: 950, fontSize: 14, color: "text.primary" }}>
          No Data
        </Typography>
      </Box>
    </Box>
  );
}

export default function TicketsPerMonthLineChart({ data = [], loading = false }) {
  const theme = useTheme();

  const normalized = useMemo(() => {
    const arr = Array.isArray(data) ? data : [];
    // ensure 12 bulan selalu ada (biar stabil)
    const map = new Map(arr.map((r) => [Number(r?.month || 0), Number(r?.count || 0)]));
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      return { month, count: Number(map.get(month) ?? 0) };
    });
  }, [data]);

  // ✅ RULE KAMU:
  // No Data hanya kalau SEMUA bulan = 0 (atau data kosong)
  const hasAnyData = useMemo(() => {
    return normalized.some((r) => Number(r.count) > 0);
  }, [normalized]);

  const labels = useMemo(() => normalized.map((r) => monthLabel(r.month)), [normalized]);

  const chartData = useMemo(() => {
    const isDark = theme.palette.mode === "dark";
    const borderColor = theme.palette.primary.main;

    return {
      labels,
      datasets: [
        {
          label: "Tickets",
          data: normalized.map((r) => Number(r.count || 0)),
          tension: 0.42,
          cubicInterpolationMode: "monotone",
          borderWidth: 2.6,
          borderColor,
          fill: true,
          backgroundColor: (ctx) => {
            const chartIns = ctx.chart;
            const { ctx: c, chartArea } = chartIns;
            if (!chartArea) return alpha(borderColor, 0.12);

            const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            g.addColorStop(0, alpha(borderColor, isDark ? 0.22 : 0.16));
            g.addColorStop(0.55, alpha(borderColor, isDark ? 0.10 : 0.06));
            g.addColorStop(1, "rgba(0,0,0,0)");
            return g;
          },
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHitRadius: 14,
          pointBorderWidth: 2,
          pointBackgroundColor: theme.palette.background.paper,
          pointBorderColor: borderColor,
        },
      ],
    };
  }, [labels, normalized, theme]);

  const options = useMemo(() => {
    const isDark = theme.palette.mode === "dark";
    return {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 6, left: 6, right: 10, bottom: 0 } },
      animation: { duration: 650, easing: "easeOutQuart" },
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          position: "top",
          labels: {
            usePointStyle: true,
            pointStyle: "rectRounded",
            boxWidth: 10,
            color: theme.palette.text.secondary,
            font: { family: theme.typography.fontFamily, weight: "700" },
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
          padding: 12,
          backgroundColor: isDark ? "rgba(17,24,39,0.92)" : "rgba(255,255,255,0.96)",
          borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
          borderWidth: 1,
          titleColor: isDark ? "rgba(255,255,255,0.92)" : "rgba(17,24,39,0.92)",
          bodyColor: isDark ? "rgba(255,255,255,0.86)" : "rgba(17,24,39,0.86)",
          titleFont: { family: theme.typography.fontFamily, weight: "800" },
          bodyFont: { family: theme.typography.fontFamily, weight: "700" },
          callbacks: {
            title: (items) => items?.[0]?.label ?? "",
            label: (ctx) => `Tickets: ${Number(ctx.parsed?.y ?? 0)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: theme.palette.text.secondary,
            font: { family: theme.typography.fontFamily, weight: "700" },
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
            drawBorder: false,
          },
          border: { display: false },
          ticks: {
            color: theme.palette.text.secondary,
            font: { family: theme.typography.fontFamily, weight: "700" },
            precision: 0,
          },
        },
      },
    };
  }, [theme]);

  if (loading) return <Box sx={{ height: { xs: 260, sm: 360 } }} />;

  // ✅ rule final
  if (!hasAnyData) return <NoData height={360} />;

  return (
    <Box sx={{ width: "100%", height: { xs: 260, sm: 360 } }}>
      <Line data={chartData} options={options} />
    </Box>
  );
}
