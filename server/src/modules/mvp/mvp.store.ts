type HazardType = "rainfall" | "heatwave";

type User = {
    id: string;
    name: string;
    email: string;
    phone: string;
    passwordHash: string;
    zoneId: string;
    createdAt: string;
};

type Session = {
    token: string;
    userId: string;
    createdAt: string;
};

type Zone = {
    id: string;
    name: string;
};

type Plan = {
    id: string;
    code: "BASIC" | "STANDARD" | "PRO";
    weeklyPremium: number;
    maxWeeklyPayout: number;
};

type Policy = {
    id: string;
    userId: string;
    zoneId: string;
    planId: string;
    premiumPaid: number;
    maxWeeklyPayout: number;
    startAt: string;
    endAt: string;
    consumedPayout: number;
};

type WeatherTimeSeries = {
    id: string;
    zoneId: string;
    observedAt: string;
    rainfallMmPerHr: number;
    tempC: number;
    sourceHash: string;
};

type TriggerEvent = {
    id: string;
    zoneId: string;
    hazardType: HazardType;
    eventStartAt: string;
    eventEndAt: string | null;
    durationMinutes: number | null;
    peakIntensity: number;
    eventStatus: "open" | "closed";
    lastBreachAt: string;
};

type Claim = {
    id: string;
    userId: string;
    policyId: string;
    eventId: string;
    hazardType: HazardType;
    intensityFactorUsed: number;
    durationFactorUsed: number;
    maxWeeklyPayoutSnapshot: number;
    calculatedPayout: number;
    createdAt: string;
};

type PayoutLedger = {
    id: string;
    claimId: string;
    policyId: string;
    amount: number;
    status: "calculated" | "finalized";
    createdAt: string;
};

const createId = (prefix: string): string =>
    `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const nowIso = () => new Date().toISOString();

const zones: Zone[] = [
    { id: "zone_blr_north", name: "Bengaluru North" },
    { id: "zone_blr_south", name: "Bengaluru South" },
    { id: "zone_hyd_west", name: "Hyderabad West" },
];

const plans: Plan[] = [
    { id: "plan_basic", code: "BASIC", weeklyPremium: 39, maxWeeklyPayout: 600 },
    { id: "plan_standard", code: "STANDARD", weeklyPremium: 69, maxWeeklyPayout: 1500 },
    { id: "plan_pro", code: "PRO", weeklyPremium: 119, maxWeeklyPayout: 2500 },
];

const users: User[] = [];
const sessions: Session[] = [];
const policies: Policy[] = [];
const weatherTimeSeries: WeatherTimeSeries[] = [];
const triggerEvents: TriggerEvent[] = [];
const claims: Claim[] = [];
const payoutLedger: PayoutLedger[] = [];

export const MVP_CONSTANTS = {
    rainfallThresholdMmPerHr: 40,
    heatwaveThresholdC: 40,
    gracePeriodMinutes: 30,
} as const;

export const mvpStore = {
    zones,
    plans,
    users,
    sessions,
    policies,
    weatherTimeSeries,
    triggerEvents,
    claims,
    payoutLedger,
    createId,
    nowIso,
};

export type {
    HazardType,
    User,
    Session,
    Zone,
    Plan,
    Policy,
    WeatherTimeSeries,
    TriggerEvent,
    Claim,
    PayoutLedger,
};
