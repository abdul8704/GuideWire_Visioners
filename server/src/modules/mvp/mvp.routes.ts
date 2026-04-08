import crypto from "crypto";
import { Router } from "express";
import { z } from "zod";
import { sendResponse } from "../../utils/apiResponse.js";
import { type AuthenticatedRequest, requireAuth } from "./auth.middleware.js";
import { UserRepository } from "../../db/repositories/user.repository.js";
import { SessionRepository } from "../../db/repositories/session.repository.js";
import { ZoneRepository } from "../../db/repositories/zone.repository.js";
import { PlanRepository } from "../../db/repositories/plan.repository.js";
import { PolicyRepository } from "../../db/repositories/policy.repository.js";
import { WeatherRepository } from "../../db/repositories/weather.repository.js";
import { TriggerEventRepository, type HazardType } from "../../db/repositories/trigger-event.repository.js";
import { ClaimRepository } from "../../db/repositories/claim.repository.js";
import { PayoutRepository } from "../../db/repositories/payout.repository.js";
import { evaluateFraud } from "../fraud/fraud.service.js";
import { runTriggerMonitorIteration, RAINFALL_THRESHOLD, HEATWAVE_THRESHOLD, GRACE_PERIOD_MINUTES } from "./trigger.monitor.js";

const router = Router();

const createId = (prefix: string): string =>
    `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const hashPassword = (rawPassword: string): string =>
    crypto.createHash("sha256").update(rawPassword).digest("hex");

const getIntensityFactor = (hazardType: HazardType, peakIntensity: number): number => {
    if (hazardType === "rainfall") {
        if (peakIntensity >= 71) return 1;
        if (peakIntensity >= 56) return 0.75;
        return 0.5;
    }
    if (peakIntensity >= 45) return 1;
    if (peakIntensity >= 42) return 0.75;
    return 0.5;
};

const getDurationFactor = (durationMinutes: number): number => {
    if (durationMinutes >= 480) return 1;
    if (durationMinutes >= 240) return 0.7;
    if (durationMinutes >= 120) return 0.4;
    return 0;
};

// ─── Auth ──────────────────────────────────────────

router.post("/auth/register", async (req, res) => {
    const schema = z.object({
        name: z.string().min(2),
        email: z.string().email(),
        phone: z.string().min(8),
        password: z.string().min(6),
        zoneId: z.string().min(3),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        sendResponse(res, { statusCode: 400, success: false, message: "Invalid registration payload", error: parsed.error.issues });
        return;
    }
    const { name, email, phone, password, zoneId } = parsed.data;

    const existing = await UserRepository.findByEmailOrPhone(email, phone);
    if (existing) {
        sendResponse(res, { statusCode: 409, success: false, message: "User already exists" });
        return;
    }

    const zone = await ZoneRepository.findById(zoneId);
    if (!zone) {
        sendResponse(res, { statusCode: 400, success: false, message: "Invalid zoneId" });
        return;
    }

    const user = await UserRepository.create({
        id: createId("usr"),
        name,
        email,
        phone,
        password_hash: hashPassword(password),
        zone_id: zoneId,
    });

    sendResponse(res, {
        statusCode: 201,
        message: "Registration successful",
        data: { id: user.id, name: user.name, email: user.email, zoneId: user.zone_id },
    });
});

router.post("/auth/login", async (req, res) => {
    const schema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        sendResponse(res, { statusCode: 400, success: false, message: "Invalid login payload", error: parsed.error.issues });
        return;
    }

    const user = await UserRepository.findByEmail(parsed.data.email);
    if (!user || user.password_hash !== hashPassword(parsed.data.password)) {
        sendResponse(res, { statusCode: 401, success: false, message: "Invalid credentials" });
        return;
    }

    const token = createId("token");
    await SessionRepository.create(token, user.id);

    sendResponse(res, {
        message: "Login successful",
        data: { token, user: { id: user.id, name: user.name, email: user.email, zoneId: user.zone_id } },
    });
});

router.get("/auth/me", requireAuth, async (req: AuthenticatedRequest, res) => {
    const user = await UserRepository.findById(req.authUserId!);
    if (!user) {
        sendResponse(res, { statusCode: 404, success: false, message: "User not found" });
        return;
    }
    sendResponse(res, {
        message: "User profile fetched",
        data: { id: user.id, name: user.name, email: user.email, phone: user.phone, zoneId: user.zone_id },
    });
});

// ─── Catalog ──────────────────────────────────────────

router.get("/zones", async (_req, res) => {
    const zones = await ZoneRepository.findAll();
    sendResponse(res, { message: "Zones fetched", data: zones });
});

router.get("/plans", async (_req, res) => {
    const plans = await PlanRepository.findAll();
    sendResponse(res, { message: "Plans fetched", data: plans });
});

// ─── Policies ──────────────────────────────────────────

router.post("/policies/purchase", requireAuth, async (req: AuthenticatedRequest, res) => {
    const schema = z.object({ planId: z.string().min(3) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        sendResponse(res, { statusCode: 400, success: false, message: "Invalid purchase payload", error: parsed.error.issues });
        return;
    }

    const user = await UserRepository.findById(req.authUserId!);
    const plan = await PlanRepository.findById(parsed.data.planId);
    if (!user || !plan) {
        sendResponse(res, { statusCode: 404, success: false, message: "User or plan not found" });
        return;
    }

    const activePolicy = await PolicyRepository.findActiveByUserId(user.id);
    if (activePolicy) {
        sendResponse(res, { statusCode: 409, success: false, message: "Active weekly policy already exists" });
        return;
    }

    const startAt = new Date();
    const endAt = new Date(startAt.getTime() + 7 * 24 * 60 * 60 * 1000);

    const policy = await PolicyRepository.create({
        id: createId("pol"),
        user_id: user.id,
        zone_id: user.zone_id,
        plan_id: plan.id,
        premium_paid: Number(plan.weekly_premium),
        max_weekly_payout: Number(plan.max_weekly_payout),
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
    });

    sendResponse(res, { statusCode: 201, message: "Policy purchased", data: policy });
});

router.get("/policies/active", requireAuth, async (req: AuthenticatedRequest, res) => {
    const activePolicy = await PolicyRepository.findActiveByUserId(req.authUserId!);
    if (!activePolicy) {
        sendResponse(res, { statusCode: 404, success: false, message: "No active policy" });
        return;
    }
    sendResponse(res, { message: "Active policy fetched", data: activePolicy });
});

router.get("/policies", requireAuth, async (req: AuthenticatedRequest, res) => {
    const policies = await PolicyRepository.findAllByUserId(req.authUserId!);
    sendResponse(res, { message: "Policies fetched", data: policies });
});

// ─── Triggers ──────────────────────────────────────────

router.post("/triggers/run-now", async (_req, res) => {
    await runTriggerMonitorIteration();
    sendResponse(res, { message: "Trigger monitor iteration completed" });
});

router.get("/triggers/latest", async (req, res) => {
    const zoneId = typeof req.query.zoneId === "string" ? req.query.zoneId : undefined;
    let resolvedZoneId = zoneId;
    if (!resolvedZoneId) {
        const zones = await ZoneRepository.findAll();
        resolvedZoneId = zones[0]?.id;
    }
    if (!resolvedZoneId) {
        sendResponse(res, { statusCode: 404, success: false, message: "No zones found" });
        return;
    }

    const latestObservation = await WeatherRepository.findLatestByZone(resolvedZoneId);
    const latestEvents = await TriggerEventRepository.findRecentByZone(resolvedZoneId, 5);

    sendResponse(res, { message: "Latest trigger data fetched", data: { latestObservation, latestEvents } });
});

// ─── Claims ──────────────────────────────────────────

router.post("/claims/evaluate", requireAuth, async (req: AuthenticatedRequest, res) => {
    const schema = z.object({ hazardType: z.enum(["rainfall", "heatwave"]) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        sendResponse(res, { statusCode: 400, success: false, message: "Invalid claim payload", error: parsed.error.issues });
        return;
    }

    const userId = req.authUserId!;
    const policy = await PolicyRepository.findActiveByUserId(userId);
    if (!policy) {
        sendResponse(res, { statusCode: 404, success: false, message: "No active policy for user" });
        return;
    }

    const hazardType = parsed.data.hazardType;
    const selectedEvent = await TriggerEventRepository.findLatestClosedByZoneAndHazard(policy.zone_id, hazardType);

    if (!selectedEvent || !selectedEvent.duration_minutes) {
        sendResponse(res, { statusCode: 404, success: false, message: "No qualifying trigger event found" });
        return;
    }

    const intensityFactor = getIntensityFactor(hazardType, Number(selectedEvent.peak_intensity));
    const durationFactor = getDurationFactor(selectedEvent.duration_minutes);
    if (durationFactor === 0) {
        sendResponse(res, { statusCode: 422, success: false, message: "Event duration below minimum qualifying threshold (120 min)" });
        return;
    }

    const maxPayout = Number(policy.max_weekly_payout);
    const consumed = Number(policy.consumed_payout);
    const rawPayout = maxPayout * intensityFactor * durationFactor;
    const remainingCap = Math.max(0, maxPayout - consumed);
    const payout = Math.min(Math.round(rawPayout), remainingCap);

    if (payout <= 0) {
        sendResponse(res, { statusCode: 422, success: false, message: "Weekly cap exhausted for active policy" });
        return;
    }

    // Create claim record
    const claimId = createId("clm");
    const claim = await ClaimRepository.create({
        id: claimId,
        user_id: userId,
        policy_id: policy.id,
        event_id: selectedEvent.id,
        hazard_type: hazardType,
        intensity_factor_used: intensityFactor,
        duration_factor_used: durationFactor,
        max_weekly_payout_snapshot: maxPayout,
        calculated_payout: payout,
    });

    // Run FraudShield evaluation
    const fraudResult = await evaluateFraud(claimId, userId, policy.zone_id, selectedEvent.event_start_at);

    // Determine payout status based on fraud tier
    const payoutStatus = fraudResult.tier === "auto_approved" ? "finalized" as const : "calculated" as const;

    // Create payout ledger entry
    const ledger = await PayoutRepository.create({
        id: createId("pay"),
        claim_id: claim.id,
        policy_id: policy.id,
        amount: payout,
        status: payoutStatus,
    });

    // Update consumed payout on policy
    await PolicyRepository.updateConsumedPayout(policy.id, payout);

    sendResponse(res, {
        statusCode: 201,
        message: "Claim evaluated successfully",
        data: {
            claim,
            payoutLedger: ledger,
            formula: {
                maxWeeklyPayout: maxPayout,
                intensityFactor,
                durationFactor,
                payout,
            },
            event: {
                id: selectedEvent.id,
                hazardType: selectedEvent.hazard_type,
                durationMinutes: selectedEvent.duration_minutes,
                peakIntensity: selectedEvent.peak_intensity,
                thresholds: {
                    rainfallThresholdMmPerHr: RAINFALL_THRESHOLD,
                    heatwaveThresholdC: HEATWAVE_THRESHOLD,
                    gracePeriodMinutes: GRACE_PERIOD_MINUTES,
                },
            },
            fraudShield: {
                btsScore: fraudResult.btsScore,
                tier: fraudResult.tier,
                signals: fraudResult.signals,
                ringFlagged: fraudResult.ringFlagged,
            },
            remainingWeeklyCap: maxPayout - consumed - payout,
        },
    });
});

router.get("/claims", requireAuth, async (req: AuthenticatedRequest, res) => {
    const claims = await ClaimRepository.findByUserId(req.authUserId!);
    sendResponse(res, { message: "Claims fetched", data: claims });
});

router.get("/claims/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    const claim = await ClaimRepository.findById(String(req.params.id));
    if (!claim || claim.user_id !== req.authUserId) {
        sendResponse(res, { statusCode: 404, success: false, message: "Claim not found" });
        return;
    }
    const ledger = await PayoutRepository.findByClaimId(claim.id);
    sendResponse(res, { message: "Claim fetched", data: { claim, payoutLedger: ledger } });
});

export default router;
