from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
import math
from datetime import datetime

app = FastAPI(title="IncomeShield ML API — FraudShield", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Models ─────────────────────────────


class BTSRequest(BaseModel):
    """Behavioral Trust Score request signals"""
    claim_timing_minutes: float  # minutes between trigger and claim
    zone_history_count: int       # past policies in this zone
    ip_match: bool               # IP city matches GPS zone
    network_type: str            # 'mobile' or 'wifi'
    active_order: bool           # had active order during disruption
    cohort_claim_rate: float     # % of zone workers who also claimed (0-1)


class BTSResponse(BaseModel):
    bts_score: int
    tier: str
    signals: dict
    recommendation: str


class RingDetectionRequest(BaseModel):
    zone_id: str
    claim_count_in_window: int   # claims in 3-min window
    amount_uniformity: float     # % of claims at max amount (0-1)
    avg_claim_amount: float
    max_plan_amount: float


class RingDetectionResponse(BaseModel):
    ring_flagged: bool
    alert_type: str | None
    confidence: float
    reason: str


class ZoneRiskRequest(BaseModel):
    zone_id: str
    historical_rainfall_events: int
    historical_heatwave_events: int
    avg_peak_intensity: float
    claim_frequency: float       # claims per week


class ZoneRiskResponse(BaseModel):
    zone_id: str
    risk_score: float
    risk_level: str
    premium_adjustment: float


# ─── BTS Scoring ─────────────────────────


def calculate_bts(req: BTSRequest) -> dict:
    """
    Behavioral Trust Score — composite of 6 software signals (0-100).
    Higher = more trustworthy.
    """
    signals = {}

    # Signal 1: Claim timing (max 20)
    if req.claim_timing_minutes <= 30:
        signals["claim_timing"] = 20
    elif req.claim_timing_minutes <= 120:
        signals["claim_timing"] = 15
    elif req.claim_timing_minutes <= 360:
        signals["claim_timing"] = 8
    else:
        signals["claim_timing"] = 3

    # Signal 2: Zone consistency (max 20)
    if req.zone_history_count >= 3:
        signals["zone_consistency"] = 20
    elif req.zone_history_count >= 1:
        signals["zone_consistency"] = 15
    else:
        signals["zone_consistency"] = 5

    # Signal 3: IP vs GPS delta (max 20)
    signals["ip_delta"] = 20 if req.ip_match else 3

    # Signal 4: Network type (max 15)
    signals["network_type"] = 15 if req.network_type == "mobile" else 5

    # Signal 5: Active order during disruption (max 15)
    signals["order_delta"] = 15 if req.active_order else 5

    # Signal 6: Cohort claim rate (max 10)
    if req.cohort_claim_rate >= 0.6:
        signals["cohort_rate"] = 10
    elif req.cohort_claim_rate >= 0.3:
        signals["cohort_rate"] = 7
    else:
        signals["cohort_rate"] = 3

    total = min(100, max(0, sum(signals.values())))
    return {"score": total, "signals": signals}


@app.post("/bts/score", response_model=BTSResponse)
def score_bts(req: BTSRequest):
    result = calculate_bts(req)
    score = result["score"]

    if score >= 75:
        tier = "auto_approved"
        recommendation = "Auto-approve. Payout in 90 seconds."
    elif score >= 40:
        tier = "soft_verify"
        recommendation = "Send one-tap confirmation prompt. Payout in 15 minutes."
    else:
        tier = "held_for_review"
        recommendation = "Hold for human review. 2-hour SLA."

    return BTSResponse(
        bts_score=score,
        tier=tier,
        signals=result["signals"],
        recommendation=recommendation,
    )


# ─── Ring Detection ─────────────────────


@app.post("/ring/detect", response_model=RingDetectionResponse)
def detect_ring(req: RingDetectionRequest):
    # Temporal spike: 5+ claims in 3-minute window
    if req.claim_count_in_window >= 5:
        return RingDetectionResponse(
            ring_flagged=True,
            alert_type="temporal_spike",
            confidence=min(0.95, 0.5 + (req.claim_count_in_window - 5) * 0.1),
            reason=f"{req.claim_count_in_window} claims filed within 3-minute window — statistically improbable for organic claims.",
        )

    # Amount uniformity: 90%+ at max tier
    if req.amount_uniformity >= 0.9 and req.claim_count_in_window >= 3:
        return RingDetectionResponse(
            ring_flagged=True,
            alert_type="amount_uniformity",
            confidence=0.8,
            reason=f"{req.amount_uniformity*100:.0f}% of claims at max plan amount — coordinated behavior detected.",
        )

    return RingDetectionResponse(
        ring_flagged=False,
        alert_type=None,
        confidence=0.0,
        reason="No ring pattern detected. Claim patterns within normal range.",
    )


# ─── Zone Risk ─────────────────────


@app.post("/zone-risk/score", response_model=ZoneRiskResponse)
def score_zone_risk(req: ZoneRiskRequest):
    """
    Zone risk score (0-100) based on historical weather events and claim frequency.
    Used for premium adjustment ±30%.
    """
    # Weighted factors
    event_score = min(50, (req.historical_rainfall_events + req.historical_heatwave_events) * 5)
    intensity_score = min(30, req.avg_peak_intensity * 0.5)
    frequency_score = min(20, req.claim_frequency * 10)

    risk_score = round(event_score + intensity_score + frequency_score, 1)
    risk_score = min(100, max(0, risk_score))

    if risk_score >= 70:
        risk_level = "high"
        premium_adjustment = 1.30  # +30%
    elif risk_score >= 40:
        risk_level = "medium"
        premium_adjustment = 1.0   # no change
    else:
        risk_level = "low"
        premium_adjustment = 0.70  # -30%

    return ZoneRiskResponse(
        zone_id=req.zone_id,
        risk_score=risk_score,
        risk_level=risk_level,
        premium_adjustment=premium_adjustment,
    )


# ─── Health ─────────────────────


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "FraudShield ML API",
        "timestamp": datetime.utcnow().isoformat(),
    }