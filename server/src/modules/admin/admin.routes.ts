import { Router } from "express";
import { sendResponse } from "../../utils/apiResponse.js";
import { ClaimRepository } from "../../db/repositories/claim.repository.js";
import { PolicyRepository } from "../../db/repositories/policy.repository.js";
import { FraudRepository } from "../../db/repositories/fraud.repository.js";
import { TriggerEventRepository } from "../../db/repositories/trigger-event.repository.js";
import { UserRepository } from "../../db/repositories/user.repository.js";

const router = Router();

// ─── Dashboard Stats ──────────────────────────────────

router.get("/stats", async (_req, res) => {
    const [totalClaims, totalPayouts, activePolicies, fraudStats] = await Promise.all([
        ClaimRepository.totalCount(),
        ClaimRepository.totalPayouts(),
        PolicyRepository.countActive(),
        FraudRepository.findFraudStats(),
    ]);

    sendResponse(res, {
        message: "Admin stats fetched",
        data: {
            totalClaims,
            totalPayouts,
            activePolicies,
            fraudStats,
        },
    });
});

// ─── Fraud Alerts ──────────────────────────────────

router.get("/fraud-alerts", async (_req, res) => {
    const alerts = await FraudRepository.findRecentAlerts(20);
    sendResponse(res, { message: "Fraud alerts fetched", data: alerts });
});

// ─── Recent Claims with Fraud Scores ──────────────────

router.get("/recent-claims", async (_req, res) => {
    const claims = await ClaimRepository.findRecent(20);

    const enriched = await Promise.all(
        claims.map(async (claim) => {
            const fraudScore = await FraudRepository.findScoreByClaimId(claim.id);
            const user = await UserRepository.findById(claim.user_id);
            return {
                ...claim,
                user_name: user?.name ?? "Unknown",
                user_email: user?.email ?? "Unknown",
                fraud: fraudScore
                    ? {
                          btsScore: fraudScore.bts_score,
                          tier: fraudScore.tier,
                          ringFlagged: fraudScore.ring_flagged,
                      }
                    : null,
            };
        })
    );

    sendResponse(res, { message: "Recent claims fetched", data: enriched });
});

// ─── Trigger Events ──────────────────────────────────

router.get("/events", async (_req, res) => {
    const events = await TriggerEventRepository.findAll();
    sendResponse(res, { message: "Trigger events fetched", data: events });
});

export default router;
