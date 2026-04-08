import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "~/lib/auth";
import { api } from "~/lib/api";

export default function AdminPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [recentClaims, setRecentClaims] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }
    if (user) loadData();
  }, [user, authLoading]);

  const loadData = async () => {
    setLoading(true);
    const [statsRes, alertsRes, claimsRes, eventsRes] = await Promise.all([
      api.adminStats(),
      api.adminFraudAlerts(),
      api.adminRecentClaims(),
      api.adminEvents(),
    ]);
    if (statsRes.success) setStats(statsRes.data);
    if (alertsRes.success) setAlerts(alertsRes.data as any[] ?? []);
    if (claimsRes.success) setRecentClaims(claimsRes.data as any[] ?? []);
    if (eventsRes.success) setEvents(eventsRes.data as any[] ?? []);
    setLoading(false);
  };

  if (authLoading || loading) {
    return <div className="loading-page"><div className="spinner" /></div>;
  }

  const fraudStats = stats?.fraudStats ?? {};

  return (
    <div style={{ minHeight: "100vh" }}>
      <nav className="navbar">
        <Link to="/" style={{ textDecoration: "none" }}><span className="logo">⚡ IncomeShield</span></Link>
        <div className="nav-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/policies">Policies</Link>
          <Link to="/claims">Claims</Link>
          <Link to="/weather">Weather</Link>
          <Link to="/admin" className="active">Admin</Link>
          <button className="btn-secondary" onClick={() => { logout(); navigate("/"); }} style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}>Logout</button>
        </div>
      </nav>

      <div className="page-container">
        <div className="page-header animate-in">
          <h1>🏢 Admin Dashboard</h1>
          <p>Platform-wide analytics, fraud monitoring, and system health</p>
        </div>

        {/* Stats Overview */}
        <div className="grid-4 animate-in animate-in-delay-1" style={{ marginBottom: "1.5rem" }}>
          <div className="stat-card">
            <span className="stat-label">Active Policies</span>
            <span className="stat-value">{stats?.activePolicies ?? 0}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total Claims</span>
            <span className="stat-value">{stats?.totalClaims ?? 0}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total Payouts</span>
            <span className="stat-value" style={{
              background: "linear-gradient(135deg, var(--success), var(--teal))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>₹{(stats?.totalPayouts ?? 0).toLocaleString()}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Avg BTS Score</span>
            <span className="stat-value" style={{
              background: fraudStats.avg_bts >= 75
                ? "linear-gradient(135deg, var(--success), var(--teal))"
                : fraudStats.avg_bts >= 40
                ? "linear-gradient(135deg, var(--warning), #ea580c)"
                : "linear-gradient(135deg, var(--danger), #dc2626)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>{fraudStats.avg_bts ?? 0}</span>
          </div>
        </div>

        {/* Fraud Stats Row */}
        <div className="grid-3 animate-in animate-in-delay-2" style={{ marginBottom: "1.5rem" }}>
          <div className="glass-card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>AUTO APPROVED</div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--success)" }}>
              {fraudStats.tier_counts?.auto_approved ?? 0}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>BTS ≥ 75</div>
          </div>
          <div className="glass-card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>SOFT VERIFY</div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--warning)" }}>
              {fraudStats.tier_counts?.soft_verify ?? 0}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>BTS 40–74</div>
          </div>
          <div className="glass-card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>HELD FOR REVIEW</div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--danger)" }}>
              {fraudStats.tier_counts?.held_for_review ?? 0}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>BTS &lt; 40 / Ring</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }} className="animate-in animate-in-delay-3">
          {["overview", "fraud", "events"].map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? "btn-primary" : "btn-secondary"}
              onClick={() => setActiveTab(tab)}
              style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", textTransform: "capitalize" }}
            >
              {tab === "overview" ? "📊 Claims" : tab === "fraud" ? "🛡️ Fraud Alerts" : "⚡ Events"}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="glass-card animate-in animate-in-delay-4">
          {activeTab === "overview" && (
            <>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>📊 Recent Claims</h3>
              {recentClaims.length > 0 ? (
                <div style={{ overflowX: "auto" }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Worker</th>
                        <th>Hazard</th>
                        <th>Payout</th>
                        <th>BTS</th>
                        <th>Tier</th>
                        <th>Ring</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentClaims.map((c: any) => (
                        <tr key={c.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{c.user_name}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{c.user_email}</div>
                          </td>
                          <td><span className="badge badge-info">{c.hazard_type}</span></td>
                          <td style={{ fontWeight: 600, color: "var(--success)" }}>₹{Number(c.calculated_payout)}</td>
                          <td>
                            {c.fraud ? (
                              <span style={{ fontWeight: 600, color: c.fraud.btsScore >= 75 ? "var(--success)" : c.fraud.btsScore >= 40 ? "var(--warning)" : "var(--danger)" }}>
                                {c.fraud.btsScore}
                              </span>
                            ) : "—"}
                          </td>
                          <td>
                            {c.fraud ? (
                              <span className={`badge ${c.fraud.tier === "auto_approved" ? "badge-success" : c.fraud.tier === "soft_verify" ? "badge-warning" : "badge-danger"}`}>
                                {c.fraud.tier.replace(/_/g, " ")}
                              </span>
                            ) : "—"}
                          </td>
                          <td>{c.fraud?.ringFlagged ? "⚠️" : "✅"}</td>
                          <td style={{ fontSize: "0.8rem" }}>{new Date(c.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state"><p>No claims yet</p></div>
              )}
            </>
          )}

          {activeTab === "fraud" && (
            <>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>🛡️ Ring Detection Alerts</h3>
              {alerts.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Zone</th>
                      <th>Type</th>
                      <th>Workers</th>
                      <th>Status</th>
                      <th>Detected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map((a: any) => (
                      <tr key={a.id}>
                        <td>{a.zone_id}</td>
                        <td><span className="badge badge-danger">{a.alert_type?.replace(/_/g, " ")}</span></td>
                        <td style={{ fontWeight: 600 }}>{a.worker_count}</td>
                        <td>
                          <span className={`badge ${a.resolved ? "badge-success" : "badge-danger"}`}>
                            {a.resolved ? "Resolved" : "Active"}
                          </span>
                        </td>
                        <td style={{ fontSize: "0.8rem" }}>{new Date(a.detected_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">🛡️</div>
                  <p>No fraud ring alerts detected. The system is monitoring claim patterns in real-time.</p>
                </div>
              )}
            </>
          )}

          {activeTab === "events" && (
            <>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>⚡ All Trigger Events</h3>
              {events.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Zone</th>
                      <th>Hazard</th>
                      <th>Status</th>
                      <th>Peak</th>
                      <th>Duration</th>
                      <th>Started</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((evt: any) => (
                      <tr key={evt.id}>
                        <td>{evt.zone_id?.replace(/_/g, " ").replace("zone ", "")}</td>
                        <td><span className={`badge ${evt.hazard_type === "rainfall" ? "badge-info" : "badge-warning"}`}>{evt.hazard_type}</span></td>
                        <td><span className={`badge ${evt.event_status === "open" ? "badge-danger" : "badge-success"}`}>{evt.event_status}</span></td>
                        <td>{Number(evt.peak_intensity).toFixed(1)}</td>
                        <td>{evt.duration_minutes ? `${evt.duration_minutes} min` : "Active"}</td>
                        <td style={{ fontSize: "0.8rem" }}>{new Date(evt.event_start_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">⚡</div>
                  <p>No trigger events recorded</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
