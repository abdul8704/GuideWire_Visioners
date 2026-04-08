import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "~/lib/auth";
import { api } from "~/lib/api";

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [policy, setPolicy] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }
    if (user) loadData();
  }, [user, authLoading]);

  const loadData = async () => {
    setLoading(true);
    const [policyRes, claimsRes, weatherRes] = await Promise.all([
      api.activePolicy(),
      api.claims(),
      api.latestTrigger(user?.zoneId),
    ]);
    if (policyRes.success) setPolicy(policyRes.data);
    if (claimsRes.success) setClaims(claimsRes.data as any[] ?? []);
    if (weatherRes.success) setWeather(weatherRes.data);
    setLoading(false);
  };

  if (authLoading || loading) {
    return <div className="loading-page"><div className="spinner" /></div>;
  }

  const consumed = policy ? Number(policy.consumed_payout) : 0;
  const maxPayout = policy ? Number(policy.max_weekly_payout) : 0;
  const remaining = maxPayout - consumed;
  const usagePercent = maxPayout > 0 ? (consumed / maxPayout) * 100 : 0;

  return (
    <div style={{ minHeight: "100vh" }}>
      <nav className="navbar">
        <Link to="/" style={{ textDecoration: "none" }}><span className="logo">⚡ IncomeShield</span></Link>
        <div className="nav-links">
          <Link to="/dashboard" className="active">Dashboard</Link>
          <Link to="/policies">Policies</Link>
          <Link to="/claims">Claims</Link>
          <Link to="/weather">Weather</Link>
          <Link to="/admin">Admin</Link>
          <button className="btn-secondary" onClick={() => { logout(); navigate("/"); }} style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}>Logout</button>
        </div>
      </nav>

      <div className="page-container">
        <div className="page-header animate-in">
          <h1>👋 Welcome, {user?.name}</h1>
          <p>Zone: {user?.zoneId?.replace(/_/g, " ").replace("zone ", "")} • Here's your insurance overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid-4 animate-in animate-in-delay-1" style={{ marginBottom: "1.5rem" }}>
          <div className="stat-card">
            <span className="stat-label">Policy Status</span>
            <div>{policy ? <span className="badge badge-success">Active</span> : <span className="badge badge-warning">No Policy</span>}</div>
          </div>
          <div className="stat-card">
            <span className="stat-label">Weekly Payout Cap</span>
            <span className="stat-value">{maxPayout > 0 ? `₹${maxPayout}` : "—"}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Remaining Balance</span>
            <span className="stat-value" style={{ color: remaining > 0 ? "var(--success)" : "var(--danger)" }}>
              {maxPayout > 0 ? `₹${remaining}` : "—"}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total Claims</span>
            <span className="stat-value">{claims.length}</span>
          </div>
        </div>

        <div className="grid-2" style={{ gap: "1.5rem" }}>
          {/* Active Policy Card */}
          <div className="glass-card animate-in animate-in-delay-2">
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>📋 Active Policy</h3>
            {policy ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Plan</span>
                  <span style={{ fontWeight: 600 }}>{policy.plan_id?.replace("plan_", "").toUpperCase()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Premium Paid</span>
                  <span>₹{Number(policy.premium_paid)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Expires</span>
                  <span>{new Date(policy.end_at).toLocaleDateString()}</span>
                </div>
                {/* Usage bar */}
                <div style={{ marginTop: "0.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                    <span>Consumed</span>
                    <span>₹{consumed} / ₹{maxPayout}</span>
                  </div>
                  <div style={{ height: "8px", borderRadius: "4px", background: "var(--bg-glass)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: "4px",
                      width: `${usagePercent}%`,
                      background: usagePercent > 80 ? "var(--danger)" : "linear-gradient(90deg, var(--accent), var(--teal))",
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: "1.5rem 0" }}>
                <p>No active policy</p>
                <Link to="/policies" className="btn-primary" style={{ marginTop: "1rem", display: "inline-flex" }}>Buy a Policy</Link>
              </div>
            )}
          </div>

          {/* Weather Status */}
          <div className="glass-card animate-in animate-in-delay-3">
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>🌤️ Current Weather</h3>
            {weather?.latestObservation ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Rainfall</span>
                  <span style={{ fontWeight: 600, color: Number(weather.latestObservation.rainfall_mm_per_hr) >= 40 ? "var(--danger)" : "var(--success)" }}>
                    {Number(weather.latestObservation.rainfall_mm_per_hr).toFixed(1)} mm/hr
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Temperature</span>
                  <span style={{ fontWeight: 600, color: Number(weather.latestObservation.temp_c) >= 40 ? "var(--danger)" : "var(--success)" }}>
                    {Number(weather.latestObservation.temp_c).toFixed(1)} °C
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Last Updated</span>
                  <span style={{ fontSize: "0.85rem" }}>{new Date(weather.latestObservation.observed_at).toLocaleTimeString()}</span>
                </div>
                {weather.latestEvents?.length > 0 && (
                  <div style={{ marginTop: "0.5rem", borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Active Triggers</span>
                    {weather.latestEvents.slice(0, 3).map((evt: any) => (
                      <div key={evt.id} style={{ display: "flex", justifyContent: "space-between", marginTop: "0.4rem", fontSize: "0.85rem" }}>
                        <span className={`badge ${evt.event_status === "open" ? "badge-danger" : "badge-success"}`}>
                          {evt.hazard_type} • {evt.event_status}
                        </span>
                        <span>{Number(evt.peak_intensity).toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: "1.5rem 0" }}>
                <p>No weather data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Claims */}
        <div className="glass-card animate-in animate-in-delay-4" style={{ marginTop: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>📜 Recent Claims</h3>
            <Link to="/claims" style={{ color: "var(--accent)", textDecoration: "none", fontSize: "0.85rem" }}>View All →</Link>
          </div>
          {claims.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Hazard</th>
                  <th>Payout</th>
                  <th>Intensity</th>
                </tr>
              </thead>
              <tbody>
                {claims.slice(0, 5).map((c: any) => (
                  <tr key={c.id}>
                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td><span className="badge badge-info">{c.hazard_type}</span></td>
                    <td style={{ fontWeight: 600, color: "var(--success)" }}>₹{Number(c.calculated_payout)}</td>
                    <td>{Number(c.intensity_factor_used).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state"><p>No claims yet</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
