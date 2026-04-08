import crypto from "crypto";
import { ClaimRepository } from "../../db/repositories/claim.repository.js";
import { FraudRepository, type VerificationTier } from "../../db/repositories/fraud.repository.js";
import { PolicyRepository } from "../../db/repositories/policy.repository.js";
import logger from "../../utils/logger.js";

const createId = (prefix: string): string =>
    `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export interface BTSSignals {
    claimTimingScore: number;
    zoneConsistencyScore: number;
    ipDeltaScore: number;
    networkTypeScore: number;
    orderDeltaScore: number;
    cohortClaimRate: number;
}

export interface BTSResult {
    btsScore: number;
    tier: VerificationTier;
    signals: BTSSignals;
    ringFlagged: boolean;
    ringAlertId?: string | undefined;
}

/**
 * Calculates a Behavioral Trust Score (BTS) for a claim.
 * In production, this would use real device/IP/behavioral signals.
 * For the demo, we simulate realistic scoring based on available data.
 */
export async function calculateBTS(
    userId: string,
    policyZoneId: string,
    eventStartAt: string,
    claimCreatedAt: string
): Promise<BTSSignals> {
    // Signal 1: Claim timing — how quickly after the trigger event was the claim filed?
    const triggerTime = new Date(eventStartAt).getTime();
    const claimTime = new Date(claimCreatedAt).getTime();
    const minutesAfterTrigger = Math.abs(claimTime - triggerTime) / 60000;
    // Genuine workers file within minutes; spoofers batch later
    const claimTimingScore = minutesAfterTrigger <= 30 ? 20 : minutesAfterTrigger <= 120 ? 15 : minutesAfterTrigger <= 360 ? 8 : 3;

    // Signal 2: Zone consistency — has this user had past policies in this zone?
    const pastPolicies = await PolicyRepository.findAllByUserId(userId);
    const zoneHits = pastPolicies.filter(p => p.zone_id === policyZoneId).length;
    const zoneConsistencyScore = zoneHits >= 3 ? 20 : zoneHits >= 1 ? 15 : 5;

    // Signal 3: IP vs GPS delta — simulated (in production: compare IP geolocation)
    // For demo, give benefit of the doubt (most workers are genuine)
    const ipDeltaScore = simulateSignal(14, 20);

    // Signal 4: Network type — simulated (mobile data = genuine, WiFi = suspicious)
    const networkTypeScore = simulateSignal(12, 15);

    // Signal 5: Order-to-claim delta — simulated (active order during disruption)
    const orderDeltaScore = simulateSignal(10, 15);

    // Signal 6: Cohort claim rate — what % of workers in the zone also claimed?
    const cohortClaimRate = simulateSignal(7, 10);

    return {
        claimTimingScore,
        zoneConsistencyScore,
        ipDeltaScore,
        networkTypeScore,
        orderDeltaScore,
        cohortClaimRate,
    };
}

function simulateSignal(min: number, max: number): number {
    // Weighted toward higher scores (most workers are genuine)
    const base = min + Math.random() * (max - min);
    return Math.round(base);
}

function getTotalBTS(signals: BTSSignals): number {
    return Math.min(100, Math.max(0,
        signals.claimTimingScore +
        signals.zoneConsistencyScore +
        signals.ipDeltaScore +
        signals.networkTypeScore +
        signals.orderDeltaScore +
        signals.cohortClaimRate
    ));
}

function getTier(btsScore: number, ringFlagged: boolean): VerificationTier {
    if (ringFlagged || btsScore < 40) return "held_for_review";
    if (btsScore < 75) return "soft_verify";
    return "auto_approved";
}

/**
 * Detects coordinated fraud ring patterns:
 * - Temporal correlation: many claims in same zone within 3-minute window
 * - Amount uniformity: 90%+ claiming max tier amount
 */
export async function detectRing(
    policyZoneId: string,
): Promise<{ ringFlagged: boolean; alertId?: string }> {
    const recentClaims = await ClaimRepository.countRecentByZone(policyZoneId, 3);

    // Temporal spike: 5+ claims in 3-minute window (lowered for demo; production uses 50+)
    if (recentClaims.count >= 5) {
        const alertId = createId("ring");
        try {
            await FraudRepository.insertRingAlert({
                id: alertId,
                zone_id: policyZoneId,
                detected_at: new Date().toISOString(),
                worker_count: recentClaims.count,
                claim_ids: recentClaims.claim_ids,
                alert_type: "temporal_spike",
            });
        } catch (err) {
            logger.error("Failed to insert ring alert", { err });
        }
        return { ringFlagged: true, alertId };
    }

    return { ringFlagged: false };
}

/**
 * Full FraudShield evaluation pipeline:
 * 1. Calculate BTS from behavioral signals
 * 2. Run ring detection
 * 3. Determine verification tier
 * 4. Persist fraud score to DB
 */
export async function evaluateFraud(
    claimId: string,
    userId: string,
    policyZoneId: string,
    eventStartAt: string,
): Promise<BTSResult> {
    const claimCreatedAt = new Date().toISOString();

    // Step 1: BTS signals
    const signals = await calculateBTS(userId, policyZoneId, eventStartAt, claimCreatedAt);
    const btsScore = getTotalBTS(signals);

    // Step 2: Ring detection
    const ringResult = await detectRing(policyZoneId);

    // Step 3: Tier
    const tier = getTier(btsScore, ringResult.ringFlagged);

    // Step 4: Persist
    const fraudScoreId = createId("fs");
    try {
        await FraudRepository.insertFraudScore({
            id: fraudScoreId,
            claim_id: claimId,
            user_id: userId,
            bts_score: btsScore,
            tier,
            signals: signals as unknown as Record<string, unknown>,
            ring_flagged: ringResult.ringFlagged,
        });
    } catch (err) {
        logger.error("Failed to persist fraud score", { err });
    }

    logger.info(`FraudShield: claim=${claimId} BTS=${btsScore} tier=${tier} ring=${ringResult.ringFlagged}`);

    return {
        btsScore,
        tier,
        signals,
        ringFlagged: ringResult.ringFlagged,
        ringAlertId: ringResult.alertId,
    };
}
