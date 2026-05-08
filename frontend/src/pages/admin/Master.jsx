// DashboardCards.jsx
import * as React from "react";
import {Link as RouterLink} from "react-router-dom";
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
  Button,
} from "@mui/material";

import WorkspacesIcon from "@mui/icons-material/Workspaces";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import ApartmentIcon from "@mui/icons-material/Apartment";
import PlaceIcon from "@mui/icons-material/Place";
import CategoryIcon from "@mui/icons-material/Category";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { Feedback, ArrowBackRounded } from "@mui/icons-material";

const cards = [
  {
    title: "Asset",
    desc: "Kelola data asset, status, dan detail aset.",
    to: "/assets",
    icon: <WorkspacesIcon fontSize="small" />,
    color: "primary",
    tag: "Management",
  },
  {
    title: "Users",
    desc: "Kelola user, role, approve, dan akses.",
    to: "/users",
    icon: <PeopleAltIcon fontSize="small" />,
    color: "warning",
    tag: "Access",
  },
  {
    title: "Department",
    desc: "Kelola department dan relasi lokasi.",
    to: "/departments",
    icon: <ApartmentIcon fontSize="small" />,
    color: "success",
    tag: "Org",
  },
  {
    title: "Location",
    desc: "Kelola lokasi dan informasi unit kerja.",
    to: "/locations",
    icon: <PlaceIcon fontSize="small" />,
    color: "secondary",
    tag: "Org",
  },
  {
    title: "Category",
    desc: "Kelola kategori untuk pengelompokan data.",
    to: "/categories",
    icon: <CategoryIcon fontSize="small" />,
    color: "info",
    tag: "Master",
  },
  {
    title: "Feedback",
    desc: "Kelola Feedback untuk pengelompokan data.",
    to: "/feedbacks",
    icon: <Feedback fontSize="small" />,
    color: "info",
    tag: "Support",
  },
];

export default function DashboardCards() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 } }}>
      {/* ===== SIMPLE HEADER (NO SEARCH) ===== */}
      <Stack spacing={1.2} sx={{ mb: 2.25 }}>
        <Stack direction="row" alignItems="center" spacing={1.25}>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h2"
              sx={{ fontWeight: 950, letterSpacing: -0.4, lineHeight: 1.1 }}
              noWrap
            >
              Data Master
            </Typography>
          </Box>

          <Box sx={{ flex: 1 }} />
        </Stack>
      </Stack>

      {/* ===== GRID ===== */}
      <Box
        sx={{
          display: "grid",
          gap: 2,
          width: "100%",
          gridTemplateColumns: {
            xs: "repeat(1, minmax(0, 1fr))",
            sm: "repeat(2, minmax(0, 1fr))",
            md: "repeat(3, minmax(0, 1fr))",
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
              transition: "transform .15s ease, border-color .15s ease",
              "&:hover": {
                borderColor: "rgba(99,102,241,0.35)",
                transform: { xs: "none", sm: "translateY(-2px)" },
              },
            }}
          >
            <CardActionArea component={RouterLink} to={c.to} sx={{ height: "100%" }}>
              <CardContent sx={{ p: 2.25 }}>
                <Stack direction="row" spacing={1.25} alignItems="flex-start">
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

                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      gap={1}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 950, letterSpacing: -0.2, lineHeight: 1.1 }}
                        noWrap
                      >
                        {c.title}
                      </Typography>

                      <Chip
                        label="Open"
                        size="small"
                        variant="outlined"
                        sx={{
                          height: 22,
                          borderRadius: 999,
                          fontWeight: 900,
                          borderColor: isDark
                            ? "rgba(255,255,255,0.18)"
                            : "rgba(17,24,39,0.14)",
                        }}
                      />
                    </Stack>

                    <Chip
                      label={c.tag ?? "Management"}
                      size="small"
                      sx={{
                        mt: 0.7,
                        height: 22,
                        borderRadius: 999,
                        fontWeight: 900,
                        bgcolor: isDark
                          ? "rgba(255,255,255,0.07)"
                          : "rgba(17,24,39,0.06)",
                        color: isDark
                          ? "rgba(255,255,255,0.72)"
                          : "rgba(17,24,39,0.72)",
                        "& .MuiChip-label": { px: 1 },
                      }}
                    />

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

                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mt: 1.75 }}
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
                          bgcolor: "rgba(99,102,241,0.10)",
                          color: "rgba(99,102,241,0.95)",
                        }}
                      >
                        <ArrowForwardRoundedIcon fontSize="small" />
                      </Avatar>
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
