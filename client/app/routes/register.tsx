import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "~/lib/auth";
import { api } from "~/lib/api";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", zoneId: "" });
  const [zones, setZones] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.zones().then((res) => {
      if (res.success && res.data) setZones(res.data);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await register(form);
    if (result.success) {
      navigate("/login");
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="hero-gradient" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="animate-in" style={{ width: "100%", maxWidth: "420px", padding: "1rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link to="/" style={{ textDecoration: "none" }}>
            <span className="logo" style={{ fontSize: "1.5rem" }}>⚡ IncomeShield</span>
          </Link>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: "1.5rem", marginBottom: "0.5rem" }}>
            Create Account
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Join 1M+ protected gig workers</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {error && (
            <div className="toast-error" style={{ padding: "0.75rem 1rem", borderRadius: "8px", fontSize: "0.85rem" }}>
              {error}
            </div>
          )}

          <div>
            <label htmlFor="reg-name">Full Name</label>
            <input id="reg-name" className="input-field" placeholder="Worker Name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </div>
          <div>
            <label htmlFor="reg-email">Email</label>
            <input id="reg-email" type="email" className="input-field" placeholder="worker@example.com" value={form.email} onChange={(e) => update("email", e.target.value)} required />
          </div>
          <div>
            <label htmlFor="reg-phone">Phone</label>
            <input id="reg-phone" className="input-field" placeholder="9999990000" value={form.phone} onChange={(e) => update("phone", e.target.value)} required />
          </div>
          <div>
            <label htmlFor="reg-password">Password</label>
            <input id="reg-password" type="password" className="input-field" placeholder="Min 6 characters" value={form.password} onChange={(e) => update("password", e.target.value)} required />
          </div>
          <div>
            <label htmlFor="reg-zone">Delivery Zone</label>
            <select id="reg-zone" className="input-field" value={form.zoneId} onChange={(e) => update("zoneId", e.target.value)} required>
              <option value="">Select your zone</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Creating Account..." : "Create Account →"}
          </button>

          <p style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "var(--accent)", textDecoration: "none" }}>Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
