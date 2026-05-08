// Report.jsx (atau DashboardCards.jsx sesuai nama file lu)
import * as React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Typography,
  Avatar,
  Chip,
  useTheme,
} from "@mui/material";

import WorkspacesIcon from "@mui/icons-material/Workspaces";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import ApartmentIcon from "@mui/icons-material/Apartment";
import PlaceIcon from "@mui/icons-material/Place";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

const cards = [
  {
    title: "Ticket Team Performance Tracking",
    desc: "Ringkasan performa tim dan progres kerja.",
    to: "/reports/team-performance",
    icon: <ApartmentIcon fontSize="small" />,
    color: "success",
    tag: "Team",
  },
  {
    title: "Executive Ticket Insight",
    desc: "Insight cepat untuk kebutuhan eksekutif.",
    to: "/excecutive-tickets-insight",
    icon: <PlaceIcon fontSize="small" />,
    color: "secondary",
    tag: "Insight",
  },
  {
    title: "Project Performance Tracking",
    desc: "Report Tracker Performance",
    to: "/reports/project-performance",
    icon: <WorkspacesIcon fontSize="small" />,
    color: "primary",
    tag: "Report",
  },
  {
    title: "Project Monitoring Queue",
    desc: "Report Project Monitoring Queue",
    to: "/reports/project-monitoring",
    icon: <PeopleAltIcon fontSize="small" />,
    color: "warning",
    tag: "Queue",
  },
];

export default function Report() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box sx={{ px: { xs: 2, sm: 4 }, py: { xs: 2, sm: 4 } }}>
      {/* HEADER (simple) */}
      <Stack spacing={0.4} sx={{ mb: 2.25 }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 950, letterSpacing: -0.4, lineHeight: 1.1 }}
        >
          Report
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Klik card untuk navigasi ke halaman report.
        </Typography>
      </Stack>

      {/* GRID */}
      <Box
        sx={{
          display: "grid",
          gap: 2,
          width: "100%",
          gridTemplateColumns: {
            xs: "repeat(1, minmax(0, 1fr))",
            lg: "repeat(2, minmax(0, 1fr))",
          },
        }}
      >
        {cards.map((c) => (
          <Card
            key={c.to}
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              overflow: "hidden",
              transition: "transform .15s ease, border-color .15s ease, box-shadow .15s ease",
              "&:hover": {
                borderColor: "rgba(99,102,241,0.35)",
                transform: { xs: "none", sm: "translateY(-2px)" },
                boxShadow: isDark
                  ? "0 14px 28px rgba(0,0,0,0.22)"
                  : "0 14px 28px rgba(17,24,39,0.08)",
              },
            }}
          >
            <CardActionArea
              component={RouterLink}
              to={c.to}
              sx={{
                height: "100%",
                "&:focus-visible": {
                  outline: "3px solid rgba(99,102,241,0.25)",
                  outlineOffset: "-2px",
                },
              }}
            >
              <CardContent sx={{ p: 2.25 }}>
                {/* TOP */}
                <Stack
                  direction="row"
                  alignItems="flex-start"
                  justifyContent="space-between"
                  gap={1.25}
                  sx={{ flexWrap: "wrap" }}
                >
                  <Stack direction="row" alignItems="center" gap={1.2} sx={{ minWidth: 0 }}>
                    <Avatar
                      variant="rounded"
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2.2,
                        bgcolor: `${c.color}.main`,
                        color: `${c.color}.contrastText`,
                        flexShrink: 0,
                      }}
                    >
                      {c.icon}
                    </Avatar>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 950,
                          letterSpacing: -0.2,
                          lineHeight: 1.15,
                        }}
                        noWrap
                      >
                        {c.title}
                      </Typography>

                      <Chip
                        label={c.tag ?? "Report"}
                        size="small"
                        sx={{
                          mt: 0.6,
                          height: 22,
                          fontWeight: 900,
                          borderRadius: 999,
                          bgcolor: isDark
                            ? "rgba(255,255,255,0.07)"
                            : "rgba(17,24,39,0.05)",
                          color: isDark
                            ? "rgba(255,255,255,0.72)"
                            : "rgba(17,24,39,0.70)",
                          "& .MuiChip-label": { px: 1 },
                        }}
                      />
                    </Box>
                  </Stack>

                  <Chip
                    label="Open"
                    size="small"
                    variant="outlined"
                    sx={{
                      height: 22,
                      borderRadius: 999,
                      fontWeight: 900,
                      borderColor: isDark
                        ? "rgba(255,255,255,0.16)"
                        : "rgba(17,24,39,0.14)",
                      color: isDark
                        ? "rgba(255,255,255,0.70)"
                        : "rgba(17,24,39,0.70)",
                      "& .MuiChip-label": { px: 1.1 },
                    }}
                  />
                </Stack>

                {/* DESC */}
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 1.25,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    lineHeight: 1.45,
                  }}
                >
                  {c.desc}
                </Typography>

                {/* FOOTER */}
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mt: 2 }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 900,
                      color: isDark
                        ? "rgba(255,255,255,0.60)"
                        : "rgba(17,24,39,0.60)",
                    }}
                  >
                    View details
                  </Typography>

                  <Avatar
                    variant="rounded"
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: 2,
                      bgcolor: isDark ? "rgba(99,102,241,0.16)" : "rgba(99,102,241,0.10)",
                      color: "rgba(99,102,241,0.95)",
                      flexShrink: 0,
                    }}
                  >
                    <ArrowForwardRoundedIcon fontSize="small" />
                  </Avatar>
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
