import Rating from '@mui/material/Rating';

export default function FeedbackRating({ value, size }) {
  return <Rating name="read-only" value={value} readOnly size={size} />;
}