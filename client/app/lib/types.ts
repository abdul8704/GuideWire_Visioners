export interface Zone {
  id: string;
  name: string;
}

export interface Plan {
  id: string;
  code: string;
  weekly_premium: number;
  max_weekly_payout: number;
}

export interface Policy {
  id: string;
  user_id: string;
  zone_id: string;
  plan_id: string;
  premium_paid: number;
  max_weekly_payout: number;
  start_at: string;
  end_at: string;
  consumed_payout: number;
}

export interface WeatherObservation {
  id: string;
  zone_id: string;
  observed_at: string;
  rainfall_mm_per_hr: number;
  temp_c: number;
}

export interface TriggerEvent {
  id: string;
  zone_id: string;
  hazard_type: "rainfall" | "heatwave";
  event_start_at: string;
  event_end_at: string | null;
  duration_minutes: number | null;
  peak_intensity: number;
  event_status: "open" | "closed";
}

export interface Claim {
  id: string;
  user_id: string;
  policy_id: string;
  event_id: string;
  hazard_type: string;
  intensity_factor_used: number;
  duration_factor_used: number;
  max_weekly_payout_snapshot: number;
  calculated_payout: number;
  created_at: string;
}

export interface FraudScore {
  btsScore: number;
  tier: "auto_approved" | "soft_verify" | "held_for_review";
  signals: Record<string, number>;
  ringFlagged: boolean;
}
