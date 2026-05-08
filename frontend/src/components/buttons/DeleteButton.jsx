import Button from "@mui/material/Button";
import DeleteIcon from "@mui/icons-material/Delete";

const DeleteButton = ({ onClick, loading }) => (
  <Button
    onClick={onClick}
    startIcon={<DeleteIcon />}
    disabled={loading}
    sx={{
      backgroundColor: "var(--danger)",
      color: "var(--white)",
      borderRadius: "var(--radius-md)",
      boxShadow: "var(--shadow-sm)",
      textTransform: "none",

      "&:hover": {
        backgroundColor: "#dc2626",
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
    {loading ? "Deleting..." : "Delete"}
  </Button>
);

export default DeleteButton;
