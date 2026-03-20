import type { Request, Response, NextFunction } from "express";
import logger from "../utils/logger.js";
import { sendResponse } from "../utils/apiResponse.js";
import env from "../config/env.js";

export interface AppError extends Error {
    status?: number;
}

export function errorMiddleware(
    err: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    const status = err.status ?? 500;
    const message = err.message ?? "Internal Server Error";

    logger.error(`[Error] ${message} - Status: ${status}`, {
        error: err,
        stack: env.NODE_ENV === "development" ? err.stack : undefined,
    });

    sendResponse(res, {
        statusCode: status,
        success: false,
        message,
        error: env.NODE_ENV === "development" ? err.stack : undefined,
    });
}
