import type { NextFunction, Request, Response } from "express";
import { sendResponse } from "../../utils/apiResponse.js";
import { SessionRepository } from "../../db/repositories/session.repository.js";

export type AuthenticatedRequest = Request & {
    authUserId?: string;
};

export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.header("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
        sendResponse(res, { statusCode: 401, success: false, message: "Missing bearer token" });
        return;
    }

    const session = await SessionRepository.findByToken(token);
    if (!session) {
        sendResponse(res, { statusCode: 401, success: false, message: "Invalid session token" });
        return;
    }

    req.authUserId = session.user_id;
    next();
};
