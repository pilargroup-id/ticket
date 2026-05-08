import React, { useMemo, useEffect } from "react";
import { Button, Box, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function SimpleFile({
  value,
  onChange,
  disabled = false,
  label = "Lampiran (opsional)",
  previewUrl = "", // ✅ URL image lama dari server
}) {
  const localPreview = useMemo(() => {
    if (value instanceof File && value.type.startsWith("image/")) {
      return URL.createObjectURL(value);
    }
    return "";
  }, [value]);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  // ✅ kalau ada file baru, pakai preview file baru, kalau tidak pakai url lama
  const shownPreview = localPreview || previewUrl;

  const handleCancel = () => {
    // reset ke null
    onChange({ target: { type: "file", files: [] } });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {/* ✅ penamaan */}
      <Typography sx={{ fontSize: 13, fontWeight: 900, opacity: 0.85 }}>
        {label}
      </Typography>

      {/* ✅ Preview */}
      {shownPreview ? (
        <Box
          sx={{
            width: "100%",
            height: 150,
            border: "1px solid #e0e0e0",
            borderRadius: 2,
            overflow: "hidden",
            position: "relative",
            bgcolor: "#fafafa",
          }}
        >
          <img
            src={shownPreview}
            alt="Preview"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />

          {/* Cancel */}
          <IconButton
            size="small"
            onClick={handleCancel}
            disabled={disabled}
            sx={{
              position: "absolute",
              top: 4,
              right: 4,
              bgcolor: "rgba(255,255,255,0.7)",
              "&:hover": { bgcolor: "rgba(255,255,255,1)" },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : (
        <Typography sx={{ fontSize: 12, opacity: 0.6 }}>
          Tidak ada file.
        </Typography>
      )}

      {/* ✅ tombol upload selalu ada (biar bisa ganti file) */}
      <Button
        variant="outlined"
        component="label"
        fullWidth
        disabled={disabled}
        sx={{ borderRadius: 2, textTransform: "none" }}
      >
        {value ? "Ganti File" : shownPreview ? "Ganti File" : "Upload File"}
        <input type="file" hidden onChange={onChange} />
      </Button>

      {/* ✅ nama file baru kalau ada */}
      {value?.name ? (
        <Typography sx={{ fontSize: 12, opacity: 0.75 }}>
          File dipilih: {value.name}
        </Typography>
      ) : null}
    </Box>
  );
}
