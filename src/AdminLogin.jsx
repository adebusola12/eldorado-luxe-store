
import { useState } from "react";
import { supabase } from "./supabaseClient";
import "./AdminLogin.css";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (
        data.user?.email?.toLowerCase() !==
        "igbedelekan6@gmail.com"
      ) {
        await supabase.auth.signOut();
        setError("You are not authorised to access this dashboard.");
        return;
      }

      window.location.reload();
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login-page">

      {/* LEFT: BRAND EXPERIENCE */}
      <section className="login-visual">
        <div className="login-visual-overlay"></div>

        <div className="login-visual-content">
          <p className="login-eyebrow">
            THE ART OF TIMELESS STYLE
          </p>

          <h1>
            MADE FOR
            <span>THE MODERN GENTLEMAN.</span>
          </h1>

          <div className="login-gold-line"></div>

          <p className="login-brand-message">
            Crafting distinction.
            <br />
            Defining elegance.
          </p>

          <p className="login-brand-footer">
            THE LUNGU TAILOR
          </p>
        </div>

        <p className="login-image-caption">
          ELEGANCE IS IN THE DETAILS
        </p>
      </section>

      {/* RIGHT: ADMIN LOGIN */}
      <section className="login-form-section">
        <div className="login-form-container">

          <div className="login-logo-wrap">
            <img
              src="/images/eldorado-logo.jpg"
              alt="ELDORADO LUXE - The Lungu Tailor"
              className="login-logo"
            />
          </div>

          <p className="login-form-eyebrow">
            PRIVATE ADMINISTRATION
          </p>

          <h2>Welcome back.</h2>

          <p className="login-description">
            Your store, your collections, your vision.
            Sign in to manage the ELDORADO LUXE experience.
          </p>

          <form onSubmit={handleLogin}>

            <div className="login-field">
              <label htmlFor="admin-email">
                Email address
              </label>

              <input
                id="admin-email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="login-field">
              <label htmlFor="admin-password">
                Password
              </label>

              <div className="password-input-wrap">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? "SIGNING IN..." : "ACCESS DASHBOARD"}
              <span>↗</span>
            </button>

          </form>

          <div className="login-security-note">
            <span></span>
            SECURE ADMINISTRATOR ACCESS
          </div>

          <p className="login-copyright">
            © {new Date().getFullYear()} ELDORADO LUXE.
            ALL RIGHTS RESERVED.
          </p>

        </div>
      </section>

    </main>
  );
}

export default AdminLogin;
