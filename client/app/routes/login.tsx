import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "~/lib/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="hero-gradient" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="animate-in" style={{ width: "100%", maxWidth: "420px", padding: "1rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link to="/" style={{ textDecoration: "none" }}>
            <span className="logo" style={{ fontSize: "1.5rem" }}>⚡ IncomeShield</span>
          </Link>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: "1.5rem", marginBottom: "0.5rem" }}>
            Welcome Back
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {error && (
            <div className="toast-error" style={{ padding: "0.75rem 1rem", borderRadius: "8px", fontSize: "0.85rem" }}>
              {error}
            </div>
          )}

          <div>
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              className="input-field"
              placeholder="worker@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Signing in..." : "Sign In →"}
          </button>

          <p style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color: "var(--accent)", textDecoration: "none" }}>Register here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
