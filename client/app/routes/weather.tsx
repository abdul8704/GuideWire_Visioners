import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "~/lib/auth";
import { api } from "~/lib/api";

export default function WeatherPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [zones, setZones] = useState<any[]>([]);
  const [selectedZone, setSelectedZone] = useState("");
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }
    if (user) loadZones();
  }, [user, authLoading]);

  const loadZones = async () => {
    const res = await api.zones();
    if (res.success && res.data) {
      setZones(res.data);
      const defaultZone = user?.zoneId || (res.data as any[])[0]?.id;
      setSelectedZone(defaultZone);
      await loadWeather(defaultZone);
    }
    setLoading(false);
  };

  const loadWeather = async (zoneId: string) => {
    const res = await api.latestTrigger(zoneId);
    if (res.success) setWeatherData(res.data);
  };

  const handleZoneChange = async (zoneId: string) => {
    setSelectedZone(zoneId);
    await loadWeather(zoneId);
  };

  const runTrigger = async () => {
    setTriggering(true);
    const res = await api.runTrigger();
    if (res.success) {
      setToast({ msg: "Trigger monitor iteration completed! Weather data refreshed.", type: "success" });
      await loadWeather(selectedZone);
    } else {
      setToast({ msg: "Failed to run trigger", type: "error" });
    }
    setTriggering(false);
    setTimeout(() => setToast(null), 4000);
  };

  if (authLoading || loading) {
    return <div className="loading-page"><div className="spinner" /></div>;
  }

  const obs = weatherData?.latestObservation;
  const events: any[] = weatherData?.latestEvents ?? [];

  return (
    <div style={{ minHeight: "100vh" }}>
      <nav className="navbar">
        <Link to="/" style={{ textDecoration: "none" }}><span className="logo">⚡ IncomeShield</span></Link>
        <div className="nav-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/policies">Policies</Link>
          <Link to="/claims">Claims</Link>
          <Link to="/weather" className="active">Weather</Link>
          <Link to="/admin">Admin</Link>
          <button className="btn-secondary" onClick={() => { logout(); navigate("/"); }} style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}>Logout</button>
        </div>
      </nav>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      <div className="page-container">
        <div className="page-header animate-in" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1>🌤️ Weather & Triggers</h1>
            <p>Real-time weather monitoring and trigger event tracking</p>
          </div>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <select className="input-field" value={selectedZone} onChange={(e) => handleZoneChange(e.target.value)} style={{ width: "auto" }}>
              {zones.map((z: any) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
            <button className="btn-primary" onClick={runTrigger} disabled={triggering}>
              {triggering ? "Running..." : "🔄 Run Monitor"}
            </button>
          </div>
        </div>

        {/* Current Conditions */}
        <div className="grid-3 animate-in animate-in-delay-1" style={{ marginBottom: "1.5rem" }}>
          <div className="stat-card">
            <span className="stat-label">Rainfall</span>
            <span className="stat-value" style={{
              background: obs && Number(obs.rainfall_mm_per_hr) >= 40
                ? "linear-gradient(135deg, var(--danger), #dc2626)"
                : "linear-gradient(135deg, var(--success), var(--teal))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              {obs ? `${Number(obs.rainfall_mm_per_hr).toFixed(1)} mm/hr` : "—"}
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Threshold: 40 mm/hr</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Temperature</span>
            <span className="stat-value" style={{
              background: obs && Number(obs.temp_c) >= 40
                ? "linear-gradient(135deg, var(--warning), var(--danger))"
                : "linear-gradient(135deg, var(--text-primary), var(--accent))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              {obs ? `${Number(obs.temp_c).toFixed(1)}°C` : "—"}
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Threshold: 40°C</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Last Updated</span>
            <span className="stat-value" style={{ fontSize: "1.25rem" }}>
              {obs ? new Date(obs.observed_at).toLocaleTimeString() : "—"}
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Polls every 15 min</span>
          </div>
        </div>

        {/* Threshold Indicators */}
        {obs && (
          <div className="glass-card animate-in animate-in-delay-2" style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>📊 Threshold Status</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Rainfall bar */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.4rem" }}>
                  <span>Rainfall</span>
                  <span style={{ color: Number(obs.rainfall_mm_per_hr) >= 40 ? "var(--danger)" : "var(--text-muted)" }}>
                    {Number(obs.rainfall_mm_per_hr).toFixed(1)} / 40 mm/hr
                  </span>
                </div>
                <div style={{ height: "10px", borderRadius: "5px", background: "var(--bg-glass)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: "5px",
                    width: `${Math.min(100, (Number(obs.rainfall_mm_per_hr) / 90) * 100)}%`,
                    background: Number(obs.rainfall_mm_per_hr) >= 71 ? "var(--danger)" : Number(obs.rainfall_mm_per_hr) >= 40 ? "var(--warning)" : "var(--success)",
                    transition: "width 0.5s ease",
                  }} />
                </div>
              </div>
              {/* Temperature bar */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.4rem" }}>
                  <span>Temperature</span>
                  <span style={{ color: Number(obs.temp_c) >= 40 ? "var(--danger)" : "var(--text-muted)" }}>
                    {Number(obs.temp_c).toFixed(1)} / 40°C
                  </span>
                </div>
                <div style={{ height: "10px", borderRadius: "5px", background: "var(--bg-glass)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: "5px",
                    width: `${Math.min(100, (Number(obs.temp_c) / 50) * 100)}%`,
                    background: Number(obs.temp_c) >= 45 ? "var(--danger)" : Number(obs.temp_c) >= 40 ? "var(--warning)" : "var(--success)",
                    transition: "width 0.5s ease",
                  }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trigger Events */}
        <div className="glass-card animate-in animate-in-delay-3">
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>⚡ Trigger Events</h3>
          {events.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Hazard</th>
                  <th>Status</th>
                  <th>Peak Intensity</th>
                  <th>Duration</th>
                  <th>Started</th>
                </tr>
              </thead>
              <tbody>
                {events.map((evt: any) => (
                  <tr key={evt.id}>
                    <td><span className={`badge ${evt.hazard_type === "rainfall" ? "badge-info" : "badge-warning"}`}>{evt.hazard_type}</span></td>
                    <td><span className={`badge ${evt.event_status === "open" ? "badge-danger" : "badge-success"}`}>{evt.event_status}</span></td>
                    <td>{Number(evt.peak_intensity).toFixed(1)}</td>
                    <td>{evt.duration_minutes ? `${evt.duration_minutes} min` : "Ongoing"}</td>
                    <td style={{ fontSize: "0.8rem" }}>{new Date(evt.event_start_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🌤️</div>
              <p>No trigger events recorded for this zone yet. Click "Run Monitor" to generate weather data.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
