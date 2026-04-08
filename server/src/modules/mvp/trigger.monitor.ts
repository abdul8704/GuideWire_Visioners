import crypto from "crypto";
import logger from "../../utils/logger.js";
import env from "../../config/env.js";
import { ZoneRepository } from "../../db/repositories/zone.repository.js";
import { WeatherRepository, type WeatherRow } from "../../db/repositories/weather.repository.js";
import {
    TriggerEventRepository,
    type HazardType,
    type TriggerEventRow,
} from "../../db/repositories/trigger-event.repository.js";

const OPEN_WEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

const RAINFALL_THRESHOLD = 40;
const HEATWAVE_THRESHOLD = 40;
const GRACE_PERIOD_MINUTES = 30;

const createId = (prefix: string): string =>
    `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const minutesBetween = (a: string, b: string): number => {
    const diffMs = Math.abs(new Date(a).getTime() - new Date(b).getTime());
    return Math.floor(diffMs / 60000);
};

const durationMinutes = (startAt: string, endAt: string): number => {
    const diffMs = Math.max(0, new Date(endAt).getTime() - new Date(startAt).getTime());
    return Math.floor(diffMs / 60000);
};

const eventIntensityBreached = (hazardType: HazardType, rainfallMmPerHr: number, tempC: number): boolean => {
    return hazardType === "rainfall"
        ? rainfallMmPerHr >= RAINFALL_THRESHOLD
        : tempC >= HEATWAVE_THRESHOLD;
};

const eventIntensityValue = (hazardType: HazardType, rainfallMmPerHr: number, tempC: number): number => {
    return hazardType === "rainfall" ? rainfallMmPerHr : tempC;
};

const updateEventLifecycle = async (
    zoneId: string,
    hazardType: HazardType,
    observedAt: string,
    rainfallMmPerHr: number,
    tempC: number
) => {
    const breached = eventIntensityBreached(hazardType, rainfallMmPerHr, tempC);
    const observedIntensity = eventIntensityValue(hazardType, rainfallMmPerHr, tempC);
    const openEvent = await TriggerEventRepository.findOpenByZoneAndHazard(zoneId, hazardType);

    if (breached) {
        if (!openEvent) {
            const newEvent: TriggerEventRow = {
                id: createId("evt"),
                zone_id: zoneId,
                hazard_type: hazardType,
                event_start_at: observedAt,
                event_end_at: null,
                duration_minutes: null,
                peak_intensity: observedIntensity,
                event_status: "open",
                last_breach_at: observedAt,
            };
            await TriggerEventRepository.create(newEvent);
            return;
        }

        await TriggerEventRepository.updateBreach(openEvent.id, observedAt, observedIntensity);
        return;
    }

    if (!openEvent) return;

    const gapMinutes = minutesBetween(openEvent.last_breach_at, observedAt);
    if (gapMinutes <= GRACE_PERIOD_MINUTES) return;

    const dur = durationMinutes(openEvent.event_start_at, observedAt);
    await TriggerEventRepository.closeEvent(openEvent.id, observedAt, dur);
};

const generateSimulatedObservation = (zoneId: string, observedAt: string) => {
    const randomRain = Math.round(Math.random() * 90);
    const randomTemp = Math.round(28 + Math.random() * 17);
    return {
        zoneId,
        observedAt,
        rainfallMmPerHr: randomRain,
        tempC: randomTemp,
        sourceHash: crypto
            .createHash("sha1")
            .update(`${zoneId}:${observedAt}:${randomRain}:${randomTemp}`)
            .digest("hex"),
    };
};

const fetchZoneObservation = async (zoneId: string, zoneName: string, observedAt: string) => {
    if (!env.OPENWEATHER_API_KEY) {
        return generateSimulatedObservation(zoneId, observedAt);
    }

    const params = new URLSearchParams({
        q: zoneName,
        appid: env.OPENWEATHER_API_KEY,
        units: "metric",
    });
    try {
        const response = await fetch(`${OPEN_WEATHER_BASE_URL}?${params.toString()}`);
        if (!response.ok) {
            logger.warn(`OpenWeather failed for zone ${zoneId}. Using simulation fallback.`);
            return generateSimulatedObservation(zoneId, observedAt);
        }
        const payload = (await response.json()) as {
            main?: { temp?: number };
            rain?: { "1h"?: number };
        };
        const rainfallMmPerHr = payload.rain?.["1h"] ?? 0;
        const tempC = payload.main?.temp ?? 30;
        return {
            zoneId,
            observedAt,
            rainfallMmPerHr,
            tempC,
            sourceHash: crypto.createHash("sha1").update(JSON.stringify(payload)).digest("hex"),
        };
    } catch {
        logger.warn(`OpenWeather request error for zone ${zoneId}. Using simulation fallback.`);
        return generateSimulatedObservation(zoneId, observedAt);
    }
};

export const runTriggerMonitorIteration = async (): Promise<void> => {
    const observedAt = new Date().toISOString();
    const zones = await ZoneRepository.findAll();

    for (const zone of zones) {
        const observation = await fetchZoneObservation(zone.id, zone.name, observedAt);

        const weatherRow: WeatherRow = {
            id: createId("wx"),
            zone_id: observation.zoneId,
            observed_at: observation.observedAt,
            rainfall_mm_per_hr: observation.rainfallMmPerHr,
            temp_c: observation.tempC,
            source_hash: observation.sourceHash,
        };
        await WeatherRepository.insert(weatherRow);

        await updateEventLifecycle(zone.id, "rainfall", observedAt, observation.rainfallMmPerHr, observation.tempC);
        await updateEventLifecycle(zone.id, "heatwave", observedAt, observation.rainfallMmPerHr, observation.tempC);
    }
};

let monitorStarted = false;
export const startTriggerMonitor = () => {
    if (monitorStarted || env.NODE_ENV === "test") return;
    monitorStarted = true;
    void runTriggerMonitorIteration();
    setInterval(() => {
        void runTriggerMonitorIteration();
    }, 15 * 60 * 1000);
};

export { RAINFALL_THRESHOLD, HEATWAVE_THRESHOLD, GRACE_PERIOD_MINUTES };
