import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "~/lib/auth";
import { api } from "~/lib/api";

export default function PoliciesPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<any[]>([]);
  const [activePolicy, setActivePolicy] = useState<any>(null);
  const [allPolicies, setAllPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }
    if (user) loadData();
  }, [user, authLoading]);

  const loadData = async () => {
    setLoading(true);
    const [plansRes, policyRes, policiesRes] = await Promise.all([
      api.plans(),
      api.activePolicy(),
      api.policies(),
    ]);
    if (plansRes.success) setPlans(plansRes.data as any[] ?? []);
    if (policyRes.success) setActivePolicy(policyRes.data);
    if (policiesRes.success) setAllPolicies(policiesRes.data as any[] ?? []);
    setLoading(false);
  };

  const purchase = async (planId: string) => {
    setPurchasing(planId);
    const res = await api.purchasePolicy(planId);
    if (res.success) {
      setToast({ msg: "Policy purchased successfully! 🎉", type: "success" });
      await loadData();
    } else {
      setToast({ msg: res.message, type: "error" });
    }
    setPurchasing("");
    setTimeout(() => setToast(null), 4000);
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
          <Link to="/policies" className="active">Policies</Link>
          <Link to="/claims">Claims</Link>
          <Link to="/weather">Weather</Link>
          <Link to="/admin">Admin</Link>
          <button className="btn-secondary" onClick={() => { logout(); navigate("/"); }} style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}>Logout</button>
        </div>
      </nav>

      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
      )}

      <div className="page-container">
        <div className="page-header animate-in">
          <h1>🛡️ Insurance Plans</h1>
          <p>Choose a weekly plan that fits your needs. Premiums adjusted by zone risk.</p>
        </div>

        {/* Active Policy Banner */}
        {activePolicy && (
          <div className="glass-card animate-in animate-in-delay-1 pulse-glow" style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <span className="badge badge-success" style={{ marginBottom: "0.5rem", display: "inline-flex" }}>Active Policy</span>
              <h3 style={{ fontWeight: 700 }}>{activePolicy.plan_id?.replace("plan_", "").toUpperCase()} Plan</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                Expires {new Date(activePolicy.end_at).toLocaleDateString()} • Max Payout ₹{Number(activePolicy.max_weekly_payout)}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Remaining Cap</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--success)" }}>
                ₹{Number(activePolicy.max_weekly_payout) - Number(activePolicy.consumed_payout)}
              </div>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid-3" style={{ marginBottom: "2rem" }}>
          {plans.map((plan, i) => {
            const isActive = activePolicy?.plan_id === plan.id;
            return (
              <div
                key={plan.id}
                className={`glass-card animate-in animate-in-delay-${i + 1}`}
                style={{
                  textAlign: "center",
                  padding: "2rem 1.5rem",
                  ...(plan.code === "STANDARD" ? { border: "1px solid var(--accent)" } : {}),
                }}
              >
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.75rem" }}>{plan.code}</h3>
                <div style={{ fontSize: "2.25rem", fontWeight: 800, marginBottom: "0.25rem" }}>₹{Number(plan.weekly_premium)}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>per week</div>
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1.25rem", marginBottom: "1.25rem" }}>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Max Weekly Payout</div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--success)" }}>₹{Number(plan.max_weekly_payout)}</div>
                </div>
                <ul style={{ listStyle: "none", padding: 0, marginBottom: "1.25rem", textAlign: "left" }}>
                  {["Zero-touch claims", "Real-time monitoring", "UPI instant payout", "FraudShield protection"].map((f) => (
                    <li key={f} style={{ padding: "0.3rem 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      ✅ {f}
                    </li>
                  ))}
                </ul>
                {isActive ? (
                  <button className="btn-success" disabled style={{ width: "100%", opacity: 0.8 }}>Current Plan ✓</button>
                ) : activePolicy ? (
                  <button className="btn-secondary" disabled style={{ width: "100%" }}>Already Insured</button>
                ) : (
                  <button
                    className="btn-primary"
                    style={{ width: "100%" }}
                    disabled={!!purchasing}
                    onClick={() => purchase(plan.id)}
                  >
                    {purchasing === plan.id ? "Purchasing..." : `Choose ${plan.code}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Policy History */}
        {allPolicies.length > 0 && (
          <div className="glass-card animate-in animate-in-delay-4">
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>📜 Policy History</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Premium</th>
                  <th>Max Payout</th>
                  <th>Period</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {allPolicies.map((p: any) => {
                  const isActive = new Date(p.start_at) <= new Date() && new Date(p.end_at) >= new Date();
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.plan_id?.replace("plan_", "").toUpperCase()}</td>
                      <td>₹{Number(p.premium_paid)}</td>
                      <td>₹{Number(p.max_weekly_payout)}</td>
                      <td style={{ fontSize: "0.8rem" }}>
                        {new Date(p.start_at).toLocaleDateString()} — {new Date(p.end_at).toLocaleDateString()}
                      </td>
                      <td>
                        <span className={`badge ${isActive ? "badge-success" : "badge-warning"}`}>
                          {isActive ? "Active" : "Expired"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
