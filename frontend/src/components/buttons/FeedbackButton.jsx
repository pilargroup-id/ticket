import Button from "@mui/material/Button";
import "../../styles/FeedbackButton.css"

const FeedbackButton = ({ onClick, loading }) => (
  <Button
    onClick={onClick}
    disabled={loading}
    className="btn-feedback"
    variant="contained"
    disableElevation
    sx={{ textTransform: "none" }}
  >
    {loading ? "Loading..." : "Feedback"}
  </Button>
);


export default FeedbackButton;
