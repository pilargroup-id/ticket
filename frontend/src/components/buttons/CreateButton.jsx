import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";

const CreateButton = ({ onClick, loading }) => (
  <Button
    onClick={onClick}
    startIcon={<AddIcon />}
    disabled={loading}
    sx={{
      backgroundColor: "var(--blue-600)",
      color: "var(--white)",
      borderRadius: "var(--radius-md)",
      boxShadow: "var(--shadow-sm)",
      textTransform: "none",

      "&:hover": {
        backgroundColor: "var(--blue-700)",
        boxShadow: "var(--shadow-md)",
      },

      "&.Mui-disabled": {
        backgroundColor: "var(--gray-300)",
        color: "var(--gray-600)",
        boxShadow: "none",
        cursor: "not-allowed",
      },
    }}
  >
    {loading ? "Creating..." : "Create"}
  </Button>
);

export default CreateButton;
