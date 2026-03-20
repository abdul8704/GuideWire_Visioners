import type { Request, Response } from "express";
import { sendResponse } from "../utils/apiResponse.js";

export function notFoundMiddleware(_req: Request, res: Response): void {
    sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Route not found",
    });
}
