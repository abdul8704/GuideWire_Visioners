# IncomeShield MVP — Features & API Reference

This document describes the **current MVP** implemented in the repository: in-memory storage, Express routes under `/api`, and optional OpenWeatherMap polling (falls back to simulated weather when `OPENWEATHER_API_KEY` is unset).

**Base URL (local default):** `http://localhost:5000`

**Response envelope:** All JSON responses use:

```json
{
  "success": true | false,
  "message": "string",
  "data": { },
  "error": null | unknown
}
```

**Authentication:** Protected routes expect:

```http
Authorization: Bearer <token>
```

The token is returned by `POST /api/auth/login` (opaque string stored in server memory).

---

## Current features

| Area | Description |
|------|-------------|
| **Auth** | Register user, login (session token), fetch profile (`/auth/me`). |
| **Catalog** | List seeded **zones** and **insurance plans** (Basic / Standard / Pro). |
| **Policy** | Purchase a **7-day** policy (one active policy per user at a time); read active policy. |
| **Trigger monitor** | Background ~15 min loop + manual **run once**; stores weather time-series and builds **rainfall** / **heatwave** events with duration. |
| **Claims & payout** | Evaluate parametric claim from latest **closed** event in user’s policy zone; payout = `maxWeeklyPayout × intensityFactor × durationFactor`, capped by weekly remaining balance. |
| **Health** | Liveness check at `/health`. |

**Seeded data (reference):**

- **Zones:** `zone_blr_north`, `zone_blr_south`, `zone_hyd_west`
- **Plans:** `plan_basic`, `plan_standard`, `plan_pro`

---

## Endpoints summary

| Method | Path | Auth |
|--------|------|------|
| GET | `/` | No |
| GET | `/health` | No |
| POST | `/api/auth/register` | No |
| POST | `/api/auth/login` | No |
| GET | `/api/auth/me` | Bearer |
| GET | `/api/zones` | No |
| GET | `/api/plans` | No |
| POST | `/api/policies/purchase` | Bearer |
| GET | `/api/policies/active` | Bearer |
| POST | `/api/triggers/run-now` | No |
| GET | `/api/triggers/latest` | No |
| POST | `/api/claims/evaluate` | Bearer |
| GET | `/api/claims` | Bearer |
| GET | `/api/claims/:id` | Bearer |

---

## Endpoint details & input formats

### GET `/`

Returns a short HTML/plain welcome string (not JSON).

**Input:** none.

---

### GET `/health`

**Input:** none.

**Success:** `data` includes `env`, `timestamp`.

---

### POST `/api/auth/register`

Register a new user. `zoneId` must match a seeded zone.

**Headers:** `Content-Type: application/json`

**Body (JSON):**

| Field | Type | Rules |
|-------|------|--------|
| `name` | string | min length 2 |
| `email` | string | valid email |
| `phone` | string | min length 8 |
| `password` | string | min length 6 |
| `zoneId` | string | min length 3; must exist in `/api/zones` |

**Example:**

```json
{
  "name": "Worker One",
  "email": "worker@example.com",
  "phone": "9999990000",
  "password": "secret12",
  "zoneId": "zone_blr_north"
}
```

---

### POST `/api/auth/login`

**Headers:** `Content-Type: application/json`

**Body (JSON):**

| Field | Type | Rules |
|-------|------|--------|
| `email` | string | valid email |
| `password` | string | min length 6 |

**Example:**

```json
{
  "email": "worker@example.com",
  "password": "secret12"
}
```

**Success `data`:** `{ "token": "...", "user": { "id", "name", "email", "zoneId" } }`

---

### GET `/api/auth/me`

**Headers:** `Authorization: Bearer <token>`

**Body:** none.

**Success `data`:** `{ "id", "name", "email", "phone", "zoneId" }`

---

### GET `/api/zones`

**Input:** none.

**Success `data`:** array of `{ "id", "name" }`.

---

### GET `/api/plans`

**Input:** none.

**Success `data`:** array of `{ "id", "code", "weeklyPremium", "maxWeeklyPayout" }`.

---

### POST `/api/policies/purchase`

Purchase a weekly policy. Fails if the user already has an active policy.

**Headers:**

- `Content-Type: application/json`
- `Authorization: Bearer <token>`

**Body (JSON):**

| Field | Type | Rules |
|-------|------|--------|
| `planId` | string | min length 3; must match a plan `id` (e.g. `plan_basic`) |

**Example:**

```json
{
  "planId": "plan_basic"
}
```

**Success `data`:** policy object (`id`, `userId`, `zoneId`, `planId`, `premiumPaid`, `maxWeeklyPayout`, `startAt`, `endAt`, `consumedPayout`).

---

### GET `/api/policies/active`

**Headers:** `Authorization: Bearer <token>`

**Body:** none.

**Success `data`:** active policy object for the current time window.

---

### POST `/api/triggers/run-now`

Runs one trigger-monitor iteration immediately (fetches/simulates weather for all zones, updates time-series and events).

**Headers:** none required.

**Body:** none (empty body is fine).

---

### GET `/api/triggers/latest`

Latest observation and up to five most recent trigger events for a zone.

**Query parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `zoneId` | string | No | Zone id; if omitted or invalid, defaults to the first seeded zone. |

**Example:** `GET /api/triggers/latest?zoneId=zone_blr_north`

**Success `data`:**

```json
{
  "latestObservation": { ... } | null,
  "latestEvents": [ ... ]
}
```

---

### POST `/api/claims/evaluate`

Evaluates a parametric claim using the **most recent closed** trigger event for the user’s **policy `zoneId`** and chosen hazard.

**Headers:**

- `Content-Type: application/json`
- `Authorization: Bearer <token>`

**Body (JSON):**

| Field | Type | Rules |
|-------|------|--------|
| `hazardType` | string | enum: `"rainfall"` or `"heatwave"` |

**Example:**

```json
{
  "hazardType": "rainfall"
}
```

**Notes:**

- Requires an **active** policy.
- Picks the latest **closed** event with non-null `durationMinutes` for that zone and hazard.
- Duration must map to a non-zero duration factor (minimum ~120 minutes of event duration).
- Updates `consumedPayout` on the policy and appends claim + payout ledger rows.

**Success `data` (shape):** `claim`, `payoutLedger`, `formula`, `event` (includes threshold constants), `remainingWeeklyCap`.

---

### GET `/api/claims`

**Headers:** `Authorization: Bearer <token>`

**Body:** none.

**Success `data`:** array of claim objects for the authenticated user.

---

### GET `/api/claims/:id`

**Headers:** `Authorization: Bearer <token>`

**Path parameter:** `id` — claim id.

**Success `data`:** `{ "claim": { ... }, "payoutLedger": { ... } | undefined }`

---

## Payout logic (reference)

- **Formula:** `Payout = round(min(maxWeeklyPayout × intensityFactor × durationFactor, remainingWeeklyCap))` (rounded per server implementation).
- **Rainfall intensity factors** (peak mm/hr): ≥71 → 1.0; 56–70 → 0.75; 40–55 → 0.5.
- **Heatwave intensity factors** (peak °C): ≥45 → 1.0; 42–44 → 0.75; below → 0.5.
- **Duration factors** (closed event `durationMinutes`): ≥480 → 1.0; 240–479 → 0.7; 120–239 → 0.4; &lt;120 → ineligible (422).

---

## Environment (server)

Optional (see `server/src/config/env.ts`):

| Variable | Description |
|----------|-------------|
| `OPENWEATHER_API_KEY` | If set, trigger monitor uses OpenWeatherMap for real readings; otherwise simulated values are used. |

---

*Generated to match the MVP module in `server/src/modules/mvp/`.*
