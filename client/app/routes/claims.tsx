import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "~/lib/auth";
import { api } from "~/lib/api";

export default function ClaimsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const [lastResult, setLastResult] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }
    if (user) loadData();
  }, [user, authLoading]);

  const loadData = async () => {
    setLoading(true);
    const res = await api.claims();
    if (res.success) setClaims(res.data as any[] ?? []);
    setLoading(false);
  };

  const evaluate = async (hazardType: string) => {
    setEvaluating(hazardType);
    const res = await api.evaluateClaim(hazardType);
    if (res.success) {
      setToast({ msg: `Claim evaluated! Payout: ₹${(res.data as any).formula?.payout} 🎉`, type: "success" });
      setLastResult(res.data);
      await loadData();
    } else {
      setToast({ msg: res.message, type: "error" });
    }
    setEvaluating("");
    setTimeout(() => setToast(null), 5000);
  };

  if (authLoading || loading) {
    return <div className="loading-page"><div className="spinner" /></div>;
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <nav className="navbar">
        <Link to="/" style={{ textDecoration: "none" }}><span className="logo">⚡ IncomeShield</span></Link>
        <div className="nav-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/policies">Policies</Link>
          <Link to="/claims" className="active">Claims</Link>
          <Link to="/weather">Weather</Link>
          <Link to="/admin">Admin</Link>
          <button className="btn-secondary" onClick={() => { logout(); navigate("/"); }} style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}>Logout</button>
        </div>
      </nav>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      <div className="page-container">
        <div className="page-header animate-in">
          <h1>💰 Claims & Payouts</h1>
          <p>Evaluate new parametric claims or view your claim history</p>
        </div>

        {/* Evaluate Section */}
        <div className="glass-card animate-in animate-in-delay-1" style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>⚡ Evaluate New Claim</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
            Select a hazard type to check for qualifying trigger events in your zone. 
            The system will calculate your payout based on the parametric formula and run FraudShield verification.
          </p>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <button
              className="btn-primary"
              onClick={() => evaluate("rainfall")}
              disabled={!!evaluating}
              style={{ flex: "1 1 200px" }}
            >
              {evaluating === "rainfall" ? "Evaluating..." : "🌧️ Rainfall Claim"}
            </button>
            <button
              className="btn-primary"
              onClick={() => evaluate("heatwave")}
              disabled={!!evaluating}
              style={{ flex: "1 1 200px", background: "linear-gradient(135deg, var(--warning), #ea580c)" }}
            >
              {evaluating === "heatwave" ? "Evaluating..." : "🔥 Heatwave Claim"}
            </button>
          </div>
        </div>

        {/* Last Result */}
        {lastResult && (
          <div className="glass-card animate-in" style={{ marginBottom: "1.5rem", border: "1px solid var(--success)" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--success)" }}>✅ Claim Result</h3>
            <div className="grid-2" style={{ gap: "1.5rem" }}>
              <div>
                <h4 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.75rem" }}>Payout Formula</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.9rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Max Weekly Payout</span>
                    <span>₹{lastResult.formula?.maxWeeklyPayout}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>× Intensity Factor</span>
                    <span>{lastResult.formula?.intensityFactor}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>× Duration Factor</span>
                    <span>{lastResult.formula?.durationFactor}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, borderTop: "1px solid var(--border)", paddingTop: "0.5rem" }}>
                    <span>= Payout</span>
                    <span style={{ color: "var(--success)", fontSize: "1.1rem" }}>₹{lastResult.formula?.payout}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.75rem" }}>FraudShield Result</h4>
                {lastResult.fraudShield ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.9rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>BTS Score</span>
                      <span style={{ fontWeight: 700, color: lastResult.fraudShield.btsScore >= 75 ? "var(--success)" : lastResult.fraudShield.btsScore >= 40 ? "var(--warning)" : "var(--danger)" }}>
                        {lastResult.fraudShield.btsScore}/100
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Verification Tier</span>
                      <span className={`badge ${lastResult.fraudShield.tier === "auto_approved" ? "badge-success" : lastResult.fraudShield.tier === "soft_verify" ? "badge-warning" : "badge-danger"}`}>
                        {lastResult.fraudShield.tier.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Ring Flagged</span>
                      <span>{lastResult.fraudShield.ringFlagged ? "⚠️ Yes" : "✅ No"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Remaining Cap</span>
                      <span>₹{lastResult.remainingWeeklyCap}</span>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: "var(--text-muted)" }}>No fraud data</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Claims History */}
        <div className="glass-card animate-in animate-in-delay-2">
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>📜 Claim History</h3>
          {claims.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Hazard</th>
                  <th>Intensity</th>
                  <th>Duration</th>
                  <th>Payout</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((c: any) => (
                  <tr key={c.id}>
                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td><span className="badge badge-info">{c.hazard_type}</span></td>
                    <td>{Number(c.intensity_factor_used).toFixed(2)}</td>
                    <td>{Number(c.duration_factor_used).toFixed(2)}</td>
                    <td style={{ fontWeight: 600, color: "var(--success)" }}>₹{Number(c.calculated_payout)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state"><p>No claims filed yet. Evaluate a claim above when a weather event occurs.</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
