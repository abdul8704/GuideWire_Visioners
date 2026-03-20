import type { Response } from "express";

export const sendResponse = (
    res: Response,
    {
        statusCode = 200,
        success = true,
        message = "",
        data = null,
        error = null,
    }: {
        statusCode?: number;
        success?: boolean;
        message?: string;
        data?: unknown;
        error?: unknown;
    }
) => {
    return res.status(statusCode).json({
        success,
        message,
        data,
        error,
    });
};
