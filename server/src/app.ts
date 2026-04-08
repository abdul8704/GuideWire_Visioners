import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { notFoundMiddleware } from "./middlewares/notFound.middleware.js";
import { sendResponse } from "./utils/apiResponse.js";
import logger from "./utils/logger.js";
import env from "./config/env.js";
import swaggerSpec from "./docs/swagger.js";
import healthRoutes from "./modules/health/health.routes.js";
import mvpRoutes from "./modules/mvp/mvp.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import { startTriggerMonitor } from "./modules/mvp/trigger.monitor.js";

const app: Express = express();

// Security Middlewares
app.use(helmet());
app.use(cors());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Performance Middlewares
app.use(compression());
app.use(express.json());

// Logging
app.use(
    morgan(env.NODE_ENV === "production" ? "combined" : "dev", {
        stream: { write: (message) => logger.info(message.trim()) },
        skip: (req) => {
            const url = req.url || "";
            return (
                (url.includes("api-docs") && url !== "/api-docs/") ||
                /\.(css|js|png|ico|map)$/.test(url)
            );
        },
    })
);

// Swagger Documentation
if (env.NODE_ENV === "development") {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// Routes
app.use("/health", healthRoutes);
app.use("/api", mvpRoutes);
app.use("/api/admin", adminRoutes);
startTriggerMonitor();

app.get("/", (_req, res) => {
    let message = "Welcome to Guidewire DevTrails API.";
    if (env.NODE_ENV === "development") {
        message += " Visit /api-docs for documentation.";
    }
    res.send(message);
});

// 404 & Error Handling
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
