import { Link } from "react-router";
import { useAuth } from "~/lib/auth";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="hero-gradient" style={{ minHeight: "100vh" }}>
      {/* Navbar */}
      <nav className="navbar">
        <span className="logo">⚡ IncomeShield</span>
        <div className="nav-links">
          {user ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/policies">Policies</Link>
              <Link to="/claims">Claims</Link>
              <Link to="/weather">Weather</Link>
              <Link to="/admin">Admin</Link>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register" className="btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>Get Started</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ textAlign: "center", padding: "6rem 2rem 3rem" }}>
        <div className="animate-in" style={{ maxWidth: "800px", margin: "0 auto" }}>
          <span className="badge badge-info" style={{ marginBottom: "1.5rem", display: "inline-flex" }}>
            🛡️ India's First Parametric Insurance for Gig Workers
          </span>
          <h1 style={{
            fontSize: "clamp(2.5rem, 5vw, 4rem)",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            marginBottom: "1.5rem"
          }}>
            Protecting{" "}
            <span style={{
              background: "linear-gradient(135deg, var(--accent), var(--teal))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              1M+ Gig Workers
            </span>
            <br />with Zero-Touch Insurance
          </h1>
          <p style={{
            fontSize: "1.15rem",
            color: "var(--text-secondary)",
            maxWidth: "600px",
            margin: "0 auto 2rem",
            lineHeight: 1.7
          }}>
            AI-powered parametric insurance against climate and social disruptions.
            No forms. No proof. Instant payouts via UPI in under 90 seconds.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/register" className="btn-primary" style={{ padding: "1rem 2rem", fontSize: "1rem" }}>
              Get Protected Now →
            </Link>
            <a href="#how-it-works" className="btn-secondary" style={{ padding: "1rem 2rem", fontSize: "1rem" }}>
              How It Works
            </a>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section style={{ maxWidth: "900px", margin: "0 auto 4rem", padding: "0 2rem" }}>
        <div className="glass-card animate-in animate-in-delay-1" style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "1rem", padding: "2rem" }}>
          {[
            { value: "90s", label: "Payout Speed" },
            { value: "₹39", label: "Starting Premium" },
            { value: "24/7", label: "Auto Monitoring" },
            { value: "99.9%", label: "Genuine Claim Approval" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent)" }}>{s.value}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 2rem 4rem" }}>
        <h2 className="animate-in animate-in-delay-2" style={{ textAlign: "center", fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          How IncomeShield Works
        </h2>
        <p style={{ textAlign: "center", color: "var(--text-secondary)", marginBottom: "3rem" }}>
          Fully automated, zero paperwork, powered by real-time weather data
        </p>
        <div className="grid-3">
          {[
            { icon: "📡", title: "Monitor", desc: "Our system polls weather APIs every 15 minutes for rainfall, heatwaves, and other triggers across all zones." },
            { icon: "⚡", title: "Trigger", desc: "When rainfall exceeds 40 mm/hr or temperature hits 40°C+ in your zone, the parametric trigger fires automatically." },
            { icon: "💸", title: "Payout", desc: "FraudShield AI validates your claim in milliseconds. If verified, UPI payout hits your account in under 90 seconds." },
          ].map((item, i) => (
            <div key={i} className={`glass-card animate-in animate-in-delay-${i + 1}`} style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>{item.icon}</div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.75rem" }}>{item.title}</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 2rem 4rem" }}>
        <h2 style={{ textAlign: "center", fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          Simple, Weekly Pricing
        </h2>
        <p style={{ textAlign: "center", color: "var(--text-secondary)", marginBottom: "3rem" }}>
          No lock-ins. Cancel anytime. Premiums adjusted ±30% by your zone's risk score.
        </p>
        <div className="grid-3">
          {[
            { name: "Basic", price: "₹39", payout: "₹600", popular: false },
            { name: "Standard", price: "₹69", payout: "₹1,500", popular: true },
            { name: "Pro", price: "₹119", payout: "₹2,500", popular: false },
          ].map((plan, i) => (
            <div
              key={i}
              className="glass-card"
              style={{
                textAlign: "center",
                padding: "2.5rem 1.5rem",
                position: "relative",
                ...(plan.popular ? { border: "1px solid var(--accent)", boxShadow: "0 0 40px var(--accent-glow)" } : {}),
              }}
            >
              {plan.popular && (
                <span className="badge badge-info" style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)" }}>
                  Most Popular
                </span>
              )}
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>{plan.name}</h3>
              <div style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "0.25rem" }}>{plan.price}</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>per week</div>
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1.5rem", marginBottom: "1.5rem" }}>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Max Weekly Payout</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--success)" }}>{plan.payout}</div>
              </div>
              <Link
                to="/register"
                className={plan.popular ? "btn-primary" : "btn-secondary"}
                style={{ width: "100%", display: "block", textDecoration: "none", padding: "0.75rem" }}
              >
                Choose {plan.name}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FraudShield Section */}
      <section style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 2rem 4rem" }}>
        <div className="glass-card" style={{ padding: "3rem", display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: "1 1 400px" }}>
            <span className="badge badge-success" style={{ marginBottom: "1rem", display: "inline-flex" }}>🛡️ FraudShield AI</span>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "1rem" }}>
              Multi-Layer Fraud Detection
            </h2>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "1.5rem" }}>
              Our Behavioral Trust Score (BTS) system analyzes claim timing, zone consistency,
              IP signals, and cohort patterns to detect GPS spoofing and organized fraud rings —
              while ensuring genuine workers get paid instantly.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                { score: "BTS ≥ 75", result: "Auto-approved — Payout in 90 seconds ✅" },
                { score: "BTS 40–74", result: "Soft verify — One-tap confirm 🟡" },
                { score: "BTS < 40", result: "Human review — 2-hour SLA 🔴" },
              ].map((tier) => (
                <div key={tier.score} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <code style={{ background: "var(--bg-glass)", padding: "0.25rem 0.75rem", borderRadius: "6px", fontSize: "0.8rem", whiteSpace: "nowrap" }}>{tier.score}</code>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{tier.result}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: "1 1 200px", textAlign: "center" }}>
            <div style={{
              width: "180px", height: "180px", borderRadius: "50%", margin: "0 auto",
              background: "conic-gradient(var(--success) 0% 75%, var(--warning) 75% 90%, var(--danger) 90% 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative"
            }}>
              <div style={{
                width: "140px", height: "140px", borderRadius: "50%",
                background: "var(--bg-secondary)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexDirection: "column"
              }}>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--success)" }}>82</div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Avg. BTS</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid var(--border)",
        padding: "2rem",
        textAlign: "center",
        color: "var(--text-muted)",
        fontSize: "0.85rem"
      }}>
        <p>© 2026 IncomeShield by Visioners. Built for Guidewire DevTrails Hackathon.</p>
      </footer>
    </div>
  );
}
