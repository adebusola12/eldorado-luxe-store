import { useState } from "react";
import { supabase } from "./supabaseClient";
import { displayName } from "./useCustomer";

// Customers create their own account and choose their own password.
function AccountSection({ customer }) {
  const [mode, setMode] = useState("signup"); // signup | signin | forgot
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  function switchMode(next) {
    setMode(next);
    setMessage({ type: "", text: "" });
  }

  async function handleSignUp(event) {
    event.preventDefault();
    setBusy(true);
    setMessage({ type: "", text: "" });

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          whatsapp: whatsapp.trim(),
        },
      },
    });

    setBusy(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setPassword("");

    // When email confirmation is switched on in Supabase there is no session yet.
    if (!data.session) {
      setMessage({
        type: "success",
        text: "Almost done! We sent a link to your email. Open it to confirm your account, then sign in.",
      });
      setMode("signin");
    } else {
      setMessage({ type: "success", text: "Your account is ready. Welcome!" });
    }
  }

  async function handleSignIn(event) {
    event.preventDefault();
    setBusy(true);
    setMessage({ type: "", text: "" });

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setBusy(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setPassword("");
  }

  async function handleForgot(event) {
    event.preventDefault();
    setBusy(true);
    setMessage({ type: "", text: "" });

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/#account`,
    });

    setBusy(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setMessage({
      type: "success",
      text: "If that email has an account, a reset link is on its way.",
    });
  }

  async function handleNewPassword(event) {
    event.preventDefault();
    setBusy(true);
    setMessage({ type: "", text: "" });

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    setBusy(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setNewPassword("");
    customer.clearRecovery();
    setMessage({ type: "success", text: "Your password has been updated." });
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setMessage({ type: "", text: "" });
    setMode("signin");
  }

  return (
    <section className="account-section" id="account">

      <div className="account-inner">

        <div className="account-intro">
          <p className="eyebrow">YOUR ACCOUNT</p>

          <h2>
            Join <em>ELDORADO LUXE.</em>
          </h2>

          <p>
            Create a free account with your own email and password.
          </p>

          <ul className="consult-points">
            <li>Leave reviews on the outfits you have bought</li>
            <li>Get your details filled in when you book a consultation</li>
            <li>Be first to know about new collections</li>
          </ul>
        </div>

        <div className="account-card">

          {!customer.ready ? (
            <p className="section-note">Loading...</p>
          ) : customer.recovery && customer.user ? (

            <form className="account-form" onSubmit={handleNewPassword}>
              <h3>Choose a new password</h3>

              <label className="form-field">
                <span className="form-label">New password</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  autoComplete="new-password"
                  required
                />
              </label>

              {message.text && (
                <p className={`form-message ${message.type}`} role="status">
                  {message.text}
                </p>
              )}

              <button className="dark-button form-submit" type="submit" disabled={busy}>
                {busy ? "SAVING..." : "SAVE NEW PASSWORD"}
              </button>
            </form>

          ) : customer.user ? (

            <div className="account-welcome">
              <h3>Welcome, {displayName(customer.user)}</h3>

              <p>
                You are signed in as <strong>{customer.user.email}</strong>.
              </p>

              <div className="account-actions">
                <a className="dark-button whatsapp-link" href="#/reviews">
                  WRITE A REVIEW
                </a>
                <a className="view-all-button" href="#/consultation">
                  BOOK A CONSULTATION
                </a>
              </div>

              <button type="button" className="continue-link" onClick={handleSignOut}>
                Sign out
              </button>

              {message.text && (
                <p className={`form-message ${message.type}`} role="status">
                  {message.text}
                </p>
              )}
            </div>

          ) : (
            <>
              {mode !== "forgot" && (
                <div className="account-tabs" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "signup"}
                    className={mode === "signup" ? "active" : ""}
                    onClick={() => switchMode("signup")}
                  >
                    CREATE ACCOUNT
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "signin"}
                    className={mode === "signin" ? "active" : ""}
                    onClick={() => switchMode("signin")}
                  >
                    SIGN IN
                  </button>
                </div>
              )}

              {mode === "signup" && (
                <form className="account-form" onSubmit={handleSignUp}>
                  <label className="form-field">
                    <span className="form-label">Full name</span>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      autoComplete="name"
                      maxLength={80}
                      required
                    />
                  </label>

                  <label className="form-field">
                    <span className="form-label">Email address</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </label>

                  <label className="form-field">
                    <span className="form-label">WhatsApp number (optional)</span>
                    <input
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      autoComplete="tel"
                      maxLength={25}
                    />
                  </label>

                  <label className="form-field">
                    <span className="form-label">Create a password</span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={6}
                      autoComplete="new-password"
                      placeholder="At least 6 characters"
                      required
                    />
                  </label>

                  {message.text && (
                    <p className={`form-message ${message.type}`} role="status">
                      {message.text}
                    </p>
                  )}

                  <button className="dark-button form-submit" type="submit" disabled={busy}>
                    {busy ? "CREATING..." : "CREATE MY ACCOUNT"}
                  </button>
                </form>
              )}

              {mode === "signin" && (
                <form className="account-form" onSubmit={handleSignIn}>
                  <label className="form-field">
                    <span className="form-label">Email address</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </label>

                  <label className="form-field">
                    <span className="form-label">Password</span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                  </label>

                  {message.text && (
                    <p className={`form-message ${message.type}`} role="status">
                      {message.text}
                    </p>
                  )}

                  <button className="dark-button form-submit" type="submit" disabled={busy}>
                    {busy ? "SIGNING IN..." : "SIGN IN"}
                  </button>

                  <button
                    type="button"
                    className="continue-link"
                    onClick={() => switchMode("forgot")}
                  >
                    Forgot your password?
                  </button>
                </form>
              )}

              {mode === "forgot" && (
                <form className="account-form" onSubmit={handleForgot}>
                  <h3>Reset your password</h3>

                  <label className="form-field">
                    <span className="form-label">Email address</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </label>

                  {message.text && (
                    <p className={`form-message ${message.type}`} role="status">
                      {message.text}
                    </p>
                  )}

                  <button className="dark-button form-submit" type="submit" disabled={busy}>
                    {busy ? "SENDING..." : "SEND RESET LINK"}
                  </button>

                  <button
                    type="button"
                    className="continue-link"
                    onClick={() => switchMode("signin")}
                  >
                    Back to sign in
                  </button>
                </form>
              )}
            </>
          )}

        </div>

      </div>

    </section>
  );
}

export default AccountSection;