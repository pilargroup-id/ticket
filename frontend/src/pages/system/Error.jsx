// ErrorPage.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function ErrorPage() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.code}>404</h1>
        <h2 style={styles.title}>Page Not Found</h2>
        <p style={styles.description}>
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" style={styles.button}>
          Go Back Home
        </Link>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "var(--blue-100)",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  card: {
    textAlign: "center",
    backgroundColor: "var(--white)",
    padding: "50px 40px",
    borderRadius: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    maxWidth: "450px",
    width: "90%",
  },
  code: {
    fontSize: "6rem",
    fontWeight: "bold",
    color: "var(--blue-900)",
    margin: "0",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "600",
    color: "var(--gray-900)",
    margin: "20px 0 10px",
  },
  description: {
    color: "var(--gray-600)",
    fontSize: "1rem",
    marginBottom: "30px",
  },
  button: {
    display: "inline-block",
    padding: "12px 30px",
    backgroundColor: "var(--gold-600)",
    color: "var(--white)",
    fontWeight: "600",
    borderRadius: "10px",
    textDecoration: "none",
    transition: "all 0.3s",
  },
};
