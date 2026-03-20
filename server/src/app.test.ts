import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import app from "./app.js";

// Mocking dependencies if needed, but for health check it's mostly fine
// We might need to mock logger to avoid cluttering test output
vi.mock("./utils/logger.js", () => ({
    default: {
        info: vi.fn(),
        error: vi.fn(),
    },
}));

describe("GET /health", () => {
    it("should return 200 and success message", async () => {
        const response = await request(app).get("/health");
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            success: true,
            message: "Guidewire DevTrails Server is running",
            data: expect.objectContaining({
                env: expect.any(String),
                timestamp: expect.any(String),
            }),
            error: null,
        });
    });
});
