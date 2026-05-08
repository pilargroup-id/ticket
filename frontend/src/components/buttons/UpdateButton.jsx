import Button from "@mui/material/Button";
import EditIcon from "@mui/icons-material/Edit";

const UpdateButton = ({ onClick, loading }) => (
  <Button
    onClick={onClick}
    startIcon={<EditIcon />}
    disabled={loading}
    sx={{
      backgroundColor: "var(--gold-600)",
      color: "var(--gray-900)",
      borderRadius: "var(--radius-md)",
      boxShadow: "var(--shadow-sm)",
      textTransform: "none",

      "&:hover": {
        backgroundColor: "var(--gold-700)",
        boxShadow: "var(--shadow-md)",
      },

      /* disabled / loading */
      "&.Mui-disabled": {
        backgroundColor: "var(--gray-300)",
        color: "var(--gray-600)",
        boxShadow: "none",
        cursor: "not-allowed",
      },
    }}
  >
    {loading ? "Updating..." : "Update"}
  </Button>
);

export default UpdateButton;
