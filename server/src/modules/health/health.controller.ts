import type { Request, Response } from "express";
import { sendResponse } from "../../utils/apiResponse.js";
import env from "../../config/env.js";

export const getHealth = (_req: Request, res: Response) => {
    sendResponse(res, {
        success: true,
        message: "Guidewire DevTrails Server is running",
        data: {
            env: env.NODE_ENV,
            timestamp: new Date().toISOString(),
        },
    });
};
