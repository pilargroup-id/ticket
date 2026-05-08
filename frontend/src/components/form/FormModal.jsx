import React from "react";
import {
  Modal,
  Box,
  Button,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  Drawer,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";

import SimpleInput from "./SimpleInput";
import SimpleSelect from "./SimpleSelect";
import SimpleFile from "./SimpleFile";

export default function FormModal({
  open,
  onClose,
  fields,
  form,
  setForm,
  onSubmit,
  submitting,
  title,
  errors = {},
  submitError = "",
  filePreview = {},
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleChange = (name) => (payload) => {
    let value = payload;

    if (payload && payload.target) {
      const t = payload.target;
      if (t.type === "file") value = t.files?.[0] ?? null;
      else value = t.value;
    }

    if (value && typeof value === "object" && "value" in value) {
      value = value.value;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const getFieldError = (fieldName) => {
    const e = errors?.[fieldName];
    return Array.isArray(e) ? e[0] : "";
  };

  const canClose = !submitting;

  const Header = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        pb: 1.25,
        borderBottom: "1px solid",
        borderColor: "rgba(17,24,39,0.08)",
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 950, letterSpacing: -0.3 }} noWrap>
          {title}
        </Typography>
        <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.25 }}>
          Isi data dengan benar ya.
        </Typography>
      </Box>

      <IconButton onClick={onClose} disabled={!canClose} sx={{ ml: 1 }}>
        <CloseIcon />
      </IconButton>
    </Box>
  );

  const Body = (
    <>
      {submitError ? (
        <Alert severity="error" sx={{ borderRadius: 2, mt: 1.25 }}>
          {submitError}
        </Alert>
      ) : null}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.1, mt: 1.5 }}>
        {fields.map((field) => {
          const fieldError = getFieldError(field.name);

          const errorNode = fieldError ? (
            <Typography sx={{ color: "#dc2626", fontSize: 12, fontWeight: 700, mt: 0.25 }}>
              {fieldError}
            </Typography>
          ) : null;

          if (field.type === "select") {
            return (
              <Box key={field.name}>
                <SimpleSelect
                  placeholder={field.placeholder}
                  value={form[field.name] ?? ""}
                  options={field.options}
                  onChange={handleChange(field.name)}
                  disabled={submitting}
                />
                {errorNode}
              </Box>
            );
          }

          if (field.type === "file") {
            return (
              <Box key={field.name}>
                <SimpleFile
                  value={form[field.name] ?? null}
                  onChange={handleChange(field.name)}
                  disabled={submitting}
                  label={field.placeholder || "Upload File"}
                  previewUrl={filePreview?.[field.name] ?? ""}
                />
                {errorNode}
              </Box>
            );
          }

          return (
            <Box key={field.name}>
              <SimpleInput
                placeholder={field.placeholder}
                value={form[field.name] ?? ""}
                onChange={handleChange(field.name)}
                disabled={submitting}
              />
              {errorNode}
            </Box>
          );
        })}
      </Box>

      <Button
        variant="contained"
        fullWidth
        onClick={onSubmit}
        disabled={submitting}
        sx={{
          mt: 2,
          height: 48,
          fontWeight: 950,
          borderRadius: 2.5,
          boxShadow: "none",
          textTransform: "none",
        }}
      >
        {submitting ? (
          <>
            <CircularProgress size={20} sx={{ mr: 1, color: "#fff" }} />
            Menyimpan...
          </>
        ) : (
          "Submit"
        )}
      </Button>
    </>
  );

  // ===== MOBILE: BOTTOM SHEET =====
  if (isMobile) {
    return (
      <Drawer
        anchor="bottom"
        open={open}
        onClose={() => canClose && onClose?.()}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            overflow: "hidden",
          },
        }}
        ModalProps={{
          keepMounted: true,
          BackdropProps: {
            sx: {
              backdropFilter: "blur(10px)",
              backgroundColor: "rgba(17,24,39,0.35)",
            },
          },
        }}
      >
        {/* handle bar */}
        <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
          <Box
            sx={{
              width: 44,
              height: 5,
              borderRadius: 999,
              bgcolor: "rgba(17,24,39,0.18)",
            }}
          />
        </Box>

        <Box
          sx={{
            px: 2,
            pb: `calc(16px + env(safe-area-inset-bottom))`,
            maxHeight: "82vh",
            overflowY: "auto",
          }}
        >
          {Header}
          {Body}
        </Box>
      </Drawer>
    );
  }

  // ===== DESKTOP: CENTER MODAL =====
  return (
    <Modal
      open={open}
      onClose={() => canClose && onClose?.()}
      BackdropProps={{
        sx: {
          backdropFilter: "blur(10px)",
          backgroundColor: "rgba(17,24,39,0.35)",
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(460px, 92vw)",
          bgcolor: "#fff",
          p: 3,
          borderRadius: 3,
          boxShadow: "0 24px 60px rgba(17,24,39,0.22)",
          border: "1px solid rgba(17,24,39,0.08)",
        }}
      >
        {Header}
        {Body}
      </Box>
    </Modal>
  );
}
