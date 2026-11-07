
import { useState } from "react";
import { supabase } from "./supabaseClient";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data.user?.email?.toLowerCase() !== "igbedelekan6@gmail.com") {
      await supabase.auth.signOut();
      setError("You are not authorised to access this dashboard.");
      return;
    }

window.location.reload();
  }

  return (
    <main style={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      background: "#20231f",
      padding: "24px",
      fontFamily: "Arial, sans-serif"
    }}>
      <form onSubmit={handleLogin} style={{
        background: "#f6f4ef",
        padding: "40px",
        width: "100%",
        maxWidth: "420px",
        boxSizing: "border-box"
      }}>
        <h1 style={{ color: "#b49a67", textAlign: "center" }}>
          ELDORADO LUXE
        </h1>

        <p style={{ textAlign: "center", color: "#77786f" }}>
          Administrator Login
        </p>

        <label>Email address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
        />

        {error && (
          <p style={{ color: "red", fontSize: "14px" }}>{error}</p>
        )}
        {success && (
  <p style={{ color: "green", fontSize: "14px" }}>
    {success}
  </p>
)}

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}

const inputStyle = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  padding: "13px",
  margin: "8px 0 20px",
  border: "1px solid #ccc",
  background: "white"
};

const buttonStyle = {
  width: "100%",
  padding: "14px",
  background: "#b49a67",
  color: "#20231f",
  border: "none",
  cursor: "pointer",
  fontWeight: "bold"
};

export default AdminLogin;
