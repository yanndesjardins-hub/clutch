import { useState } from "react";
import { supabase } from "../lib/supabase";

const RADIO = ({ name, value, checked, onChange, label }) => (
  <label
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      cursor: "pointer",
      fontSize: 14,
      color: checked ? "#fff" : "var(--text2)",
    }}
  >
    <input
      type="radio"
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
      style={{ accentColor: "var(--purple)", width: 20, height: 20 }}
    />
    {label}
  </label>
);

export default function Login() {
  const [mode, setMode] = useState("login");

  // Login fields
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");

  // Signup fields
  const [firstName, setFirstName] = useState("");
  const [postcode, setPostcode] = useState("");
  const [playsBasket, setPlaysBasket] = useState("");
  const [followsNBA, setFollowsNBA] = useState("");
  const [followsEuro, setFollowsEuro] = useState("");
  const [favTeam, setFavTeam] = useState("");
  const [emailConsent, setEmailConsent] = useState(false);

  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  function signupValid() {
    return (
      firstName.trim() &&
      postcode.trim() &&
      email.trim() &&
      pwd.length >= 6 &&
      playsBasket &&
      followsNBA &&
      followsEuro &&
      emailConsent
    );
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: pwd,
        });
        if (error) throw error;
        if (data.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            display_name: firstName.trim(),
            postcode: postcode.trim(),
            plays_basketball: playsBasket === "yes",
            follows_nba: followsNBA === "yes",
            follows_euro: followsEuro === "yes",
            fav_team: favTeam.trim() || null,
            email_consent: emailConsent,
          });
        }
        setMsg(
          "✅ Account created! Check your email to confirm, then sign in.",
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: pwd,
        });
        if (error) throw error;
        const pending = sessionStorage.getItem("hc_pending_invite");
        if (pending) {
          sessionStorage.removeItem("hc_pending_invite");
          window.location.href = `/join/${pending}`;
        }
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div className="text-center" style={{ marginBottom: 32 }}>
          <img
            src="/clutch_logo.png"
            alt="Clutch"
            style={{ height: 120, marginBottom: 12 }}
          />
          <p style={{ color: "var(--text3)", fontSize: 16, letterSpacing: 0 }}>
            Predict NBA playoff results with your friends, till the finals!🏀🔮
          </p>
        </div>

        <div className="card fade-up">
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              marginBottom: 20,
              borderBottom: "1px solid var(--border)",
            }}
          >
            {[
              ["login", "Sign In"],
              ["signup", "Sign Up"],
            ].map(([m, label]) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setErr("");
                  setMsg("");
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "none",
                  border: "none",
                  borderBottom:
                    mode === m
                      ? "2px solid var(--purple)"
                      : "2px solid transparent",
                  color: mode === m ? "var(--purple)" : "var(--text3)",
                  fontFamily: "Barlow Condensed",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <form
            onSubmit={submit}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            {/* SIGNUP FIELDS */}
            {mode === "signup" && (
              <>
                <div>
                  <label className="label-form">Your Name *</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="Your Name (doesn't need to be your real name :)"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="label-form">Your postcode *</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="e.g. 75011"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    required
                    maxLength={10}
                  />
                </div>

                <div>
                  <label className="label-form">
                    Do/did you play basketball? *
                  </label>
                  <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                    <RADIO
                      name="plays"
                      value="yes"
                      checked={playsBasket === "yes"}
                      onChange={() => setPlaysBasket("yes")}
                      label="Yes"
                    />
                    <RADIO
                      name="plays"
                      value="no"
                      checked={playsBasket === "no"}
                      onChange={() => setPlaysBasket("no")}
                      label="No"
                    />
                  </div>
                </div>

                <div>
                  <label className="label-form">Do you follow NBA? *</label>
                  <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                    <RADIO
                      name="nba"
                      value="yes"
                      checked={followsNBA === "yes"}
                      onChange={() => setFollowsNBA("yes")}
                      label="Yes"
                    />
                    <RADIO
                      name="nba"
                      value="no"
                      checked={followsNBA === "no"}
                      onChange={() => setFollowsNBA("no")}
                      label="No"
                    />
                  </div>
                </div>

                <div>
                  <label className="label-form">
                    Do you follow European basketball? *
                  </label>
                  <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                    <RADIO
                      name="euro"
                      value="yes"
                      checked={followsEuro === "yes"}
                      onChange={() => setFollowsEuro("yes")}
                      label="Yes"
                    />
                    <RADIO
                      name="euro"
                      value="no"
                      checked={followsEuro === "no"}
                      onChange={() => setFollowsEuro("no")}
                      label="No"
                    />
                  </div>
                </div>

                <div>
                  <label className="label-form">
                    Your favorite team? (optional)
                  </label>
                  <input
                    className="input"
                    type="text"
                    placeholder="e.g. Miami Heat"
                    value={favTeam}
                    onChange={(e) => setFavTeam(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* EMAIL */}
            <div>
              <label className="label-form">Email *</label>
              <input
                className="input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* PASSWORD */}
            <div style={{ position: "relative" }}>
              <input
                className="input"
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--text3)",
                  cursor: "pointer",
                  fontSize: 16,
                }}
              >
                {showPwd ? "🙈" : "👁️"}
              </button>
            </div>

            {/* EMAIL CONSENT */}
            {mode === "signup" && (
              <div className="checkbox-row">
                <input
                  type="checkbox"
                  id="consent"
                  checked={emailConsent}
                  onChange={(e) => setEmailConsent(e.target.checked)}
                  required
                />
                <label htmlFor="consent">
                  I agree to receive email communications from the team that
                  created this game regarding basketball (follow up on this
                  game, other news, events). I can unsubscribe at any time via
                  the link included in each email. *
                </label>
              </div>
            )}

            {err && (
              <p style={{ color: "var(--red)", fontSize: 13 }}>❌ {err}</p>
            )}
            {msg && (
              <p style={{ color: "var(--green)", fontSize: 13 }}>{msg}</p>
            )}

            <button
              className="btn btn-purple btn-full"
              type="submit"
              disabled={busy || (mode === "signup" && !signupValid())}
              style={{ marginTop: 4 }}
            >
              {busy ? "…" : mode === "signup" ? "Create my account" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}