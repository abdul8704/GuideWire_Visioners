import winston from "winston";
import env from "../config/env.js";

const logger = winston.createLogger({
    level: env.NODE_ENV === "production" ? "info" : "debug",
    format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.printf(({ timestamp, level, message }) => {
            return `[${timestamp}] ${level}: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message }) => {
                    return `[${timestamp}] ${level}: ${message}`;
                })
            ),
        }),
        /* Commenting out production file logging as requested
        new winston.transports.File({ filename: "logs/error.log", level: "error" }),
        new winston.transports.File({ filename: "logs/combined.log" }),
        */
    ],
});

export default logger;