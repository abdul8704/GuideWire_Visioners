const API_BASE = "http://localhost:5000";

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  error: unknown;
}

function getToken(): string | null {
  return localStorage.getItem("incomeshield_token");
}

export function setToken(token: string) {
  localStorage.setItem("incomeshield_token", token);
}

export function clearToken() {
  localStorage.removeItem("incomeshield_token");
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const json = await res.json();
  return json as ApiResponse<T>;
}

export const api = {
  // Auth
  register: (data: { name: string; email: string; phone: string; password: string; zoneId: string }) =>
    request("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: { id: string; name: string; email: string; zoneId: string } }>(
      "/api/auth/login",
      { method: "POST", body: JSON.stringify(data) }
    ),

  me: () =>
    request<{ id: string; name: string; email: string; phone: string; zoneId: string }>("/api/auth/me"),

  // Catalog
  zones: () => request<{ id: string; name: string }[]>("/api/zones"),
  plans: () => request<{ id: string; code: string; weekly_premium: number; max_weekly_payout: number }[]>("/api/plans"),

  // Policies
  purchasePolicy: (planId: string) =>
    request("/api/policies/purchase", { method: "POST", body: JSON.stringify({ planId }) }),

  activePolicy: () => request("/api/policies/active"),
  policies: () => request("/api/policies"),

  // Triggers
  runTrigger: () => request("/api/triggers/run-now", { method: "POST" }),
  latestTrigger: (zoneId?: string) =>
    request(`/api/triggers/latest${zoneId ? `?zoneId=${zoneId}` : ""}`),

  // Claims
  evaluateClaim: (hazardType: string) =>
    request("/api/claims/evaluate", { method: "POST", body: JSON.stringify({ hazardType }) }),

  claims: () => request("/api/claims"),
  claim: (id: string) => request(`/api/claims/${id}`),

  // Admin
  adminStats: () => request("/api/admin/stats"),
  adminFraudAlerts: () => request("/api/admin/fraud-alerts"),
  adminRecentClaims: () => request("/api/admin/recent-claims"),
  adminEvents: () => request("/api/admin/events"),
};
