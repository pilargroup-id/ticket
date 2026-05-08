import React, { useMemo } from "react";
import { Card, CardActionArea, CardContent, Typography, Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

const STATUS_TONE = {
  resolved: "success",
  waiting: "warning",
  in_progress: "info",
  pending: "warning",      // ✅ buat Project Monitoring
  feedback: "secondary",
  void: "error",
};

const normalizeStatus = (s) => String(s ?? "").toLowerCase().trim();

const StatisticCard = ({
  title,
  value,
  onClick,
  active = false,
  subtitle = null,
  status = "resolved",
}) => {
  const theme = useTheme();
  const clickable = typeof onClick === "function";

  const tone = STATUS_TONE[normalizeStatus(status)] || "primary";
  const pal = theme.palette?.[tone] || theme.palette.primary;

  const c = useMemo(() => {
    const main = pal.main;
    const dark = pal.dark || pal.main;
    return {
      main,
      dark,

      borderIdle: alpha(main, 0.22),
      borderActive: alpha(main, 0.65),

      glow: `0 14px 34px ${alpha(main, 0.14)}`,
      hoverGlow: `0 14px 34px ${alpha(main, 0.18)}`,

      chipBgIdle: alpha(main, 0.06),
      chipBgActive: alpha(main, 0.12),

      badgeBgIdle: alpha(main, 0.12),
      badgeBgActive: alpha(main, 0.18),
      badgeText: dark,
    };
  }, [pal]);

  return (
    <Card
      elevation={0}
      sx={{
        position: "relative",
        overflow: "hidden",
        border: "1px solid",
        borderColor: active ? c.borderActive : c.borderIdle,
        bgcolor: { xs: active ? c.chipBgActive : c.chipBgIdle, sm: "background.paper" },

        // ✅ SHAPE: mobile pill, desktop card
        borderRadius: { xs: 999, sm: 3 },

        // ✅ SIZE: chip height
        minHeight: { xs: 38, sm: "auto" },

        // ✅ SHADOW: halus
        boxShadow: {
          xs: "none",
          sm: active ? c.glow : "none",
        },

        transition:
          "border-color .18s ease, box-shadow .18s ease, transform .18s ease, background .18s ease",

        ...(clickable && {
          cursor: "pointer",
          "&:hover": {
            transform: { xs: "none", sm: "translateY(-2px)" },
            boxShadow: { xs: "none", sm: c.hoverGlow },
            borderColor: alpha(c.main, 0.55),
          },
        }),
      }}
    >
      {/* ✅ DESKTOP ACCENT BAR (tetap) */}
      <Box
        sx={{
          display: { xs: "none", sm: "block" },
          position: "absolute",
          left: 16,
          right: 16,
          top: 10,
          height: 5,
          borderRadius: 999,
          bgcolor: c.main,
          opacity: 0.95,
        }}
      />

      <CardActionArea
        onClick={onClick}
        disabled={!clickable}
        sx={{ height: "100%", borderRadius: "inherit" }}
      >
        <CardContent
          sx={{
            // ✅ padding chip vs desktop
            px: { xs: 1.2, sm: 2.25 },
            py: { xs: 0.7, sm: 2.1 },
            pt: { xs: 0.7, sm: 3.2 },

            display: "flex",
            flexDirection: { xs: "row", sm: "column" },
            alignItems: { xs: "center", sm: "flex-start" },
            justifyContent: { xs: "space-between", sm: "center" },
            gap: { xs: 1, sm: 0.4 },

            textAlign: { xs: "left", sm: "left" },
          }}
        >
          {/* ✅ MOBILE: dot + title */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.9, minWidth: 0 }}>
            {/* dot status */}
            <Box
              sx={{
                width: 9,
                height: 9,
                borderRadius: 999,
                bgcolor: c.main,
                boxShadow: `0 0 0 3px ${alpha(c.main, active ? 0.20 : 0.14)}`,
                flex: "0 0 auto",
              }}
            />

            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: { xs: 12, sm: 14 },
                  fontWeight: 900,
                  color: "text.primary",
                  lineHeight: 1.1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: { xs: 120, sm: "100%" },
                }}
              >
                {title}
              </Typography>

              {/* helper desktop only */}
              <Typography
                sx={{
                  display: { xs: "none", sm: "block" },
                  fontSize: 12,
                  fontWeight: 700,
                  color: "text.secondary",
                  opacity: 0.8,
                  lineHeight: 1.1,
                }}
              >
                {active ? "Active filter" : clickable ? "Click to filter" : " "}
              </Typography>
            </Box>
          </Box>

          {/* ✅ MOBILE: badge count (elegan), DESKTOP: angka besar */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              flex: "0 0 auto",
            }}
          >
            {/* mobile badge */}
            <Box
              sx={{
                display: { xs: "inline-flex", sm: "none" },
                alignItems: "center",
                justifyContent: "center",
                px: 1.05,
                height: 26,
                borderRadius: 999,
                bgcolor: active ? c.badgeBgActive : c.badgeBgIdle,
                border: `1px solid ${alpha(c.main, active ? 0.28 : 0.20)}`,
                color: c.badgeText,
                fontWeight: 950,
                fontSize: 12.5,
                minWidth: 34,
              }}
            >
              {value}
            </Box>

            {/* desktop big number */}
            <Box sx={{ display: { xs: "none", sm: "block" }, mt: 1 }}>
              <Typography
                sx={{
                  fontWeight: 950,
                  letterSpacing: -0.6,
                  fontSize: 34,
                  lineHeight: 1,
                  color: "text.primary",
                }}
              >
                {value}
              </Typography>

              {subtitle && (
                <Typography
                  sx={{
                    mt: 0.2,
                    fontSize: 14,
                    fontWeight: 800,
                    color: "text.secondary",
                  }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default StatisticCard;
