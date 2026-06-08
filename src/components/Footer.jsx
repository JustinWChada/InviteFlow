import React from "react";

export default function Footer() {
  return (
    <footer className="" style={{ padding: 20, borderTop: "1px solid #eee", marginTop: 40 }}>
      <div style={{ maxWidth: 1126, margin: "0 auto", textAlign: "center", color: "#666" }}>
        © {new Date().getFullYear()} InviteFlow — Built with ❤️
      </div>
    </footer>
  );
}
