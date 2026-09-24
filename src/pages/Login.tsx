import { useState, type KeyboardEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types";
import "./Login.css";

function authErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-email":
        return "Enter a valid email address.";
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Email or password is incorrect.";
      case "auth/email-already-in-use":
        return "That email already has an account. Log in instead.";
      case "auth/weak-password":
        return "Password must be at least 6 characters.";
      default:
        return error.message;
    }
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Try again.";
}

function Login() {
  const { login, signup, user, profile, loading, configured } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("patient");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  if (!loading && user && profile) {
    return (
      <Navigate to={profile.role === "doctor" ? "/doctor" : "/patient"} replace />
    );
  }

  async function handleSubmit() {
    setError("");

    if (!configured) {
      setError("Firebase is not configured. Add your keys to client/.env.");
      return;
    }

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    if (mode === "signup" && !name.trim()) {
      setError("Enter your name to create an account.");
      return;
    }

    setSubmitting(true);
    try {
      const nextProfile =
        mode === "signup"
          ? await signup(name, email.trim(), password, role)
          : await login(email.trim(), password);
      navigate(nextProfile.role === "doctor" ? "/doctor" : "/patient");
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      void handleSubmit();
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>QueueCare</h1>
        <p>Hospital Queue Management System</p>

        {!configured && (
          <p className="login-error">
            Copy client/.env.example to client/.env and paste your Firebase web keys, then restart the dev server.
          </p>
        )}

        {mode === "signup" && (
          <>
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            <div className="role-toggle">
              <button
                type="button"
                className={role === "patient" ? "selected" : ""}
                onClick={() => setRole("patient")}
              >
                Patient
              </button>
              <button
                type="button"
                className={role === "doctor" ? "selected" : ""}
                onClick={() => setRole("doctor")}
              >
                Doctor
              </button>
            </div>
          </>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <div className="password-container">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <button
            type="button"
            className="show-password"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        {error && <p className="login-error">{error}</p>}

        <button onClick={() => void handleSubmit()} disabled={submitting || !configured}>
          {submitting
            ? "Please wait…"
            : mode === "signup"
              ? "Create account"
              : "Login"}
        </button>

        <button
          type="button"
          className="mode-switch"
          onClick={() => {
            setMode((prev) => (prev === "login" ? "signup" : "login"));
            setError("");
          }}
        >
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  );
}

export default Login;
