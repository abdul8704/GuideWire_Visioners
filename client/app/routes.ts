import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("policies", "routes/policies.tsx"),
  route("claims", "routes/claims.tsx"),
  route("weather", "routes/weather.tsx"),
  route("admin", "routes/admin.tsx"),
] satisfies RouteConfig;
