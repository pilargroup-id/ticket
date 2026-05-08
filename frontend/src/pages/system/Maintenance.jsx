import React from "react";

export default function Maintenance() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>We'll be back soon!</h1>
        <p style={styles.description}>
          Our system is currently undergoing maintenance. Thank you for your patience.
        </p>
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
  title: {
    fontSize: "2rem",
    fontWeight: "600",
    color: "var(--blue-900)",
    marginBottom: "20px",
  },
  description: {
    color: "var(--gray-600)",
    fontSize: "1rem",
  },
};
