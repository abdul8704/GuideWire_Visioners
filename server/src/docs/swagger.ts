import swaggerJsdoc from "swagger-jsdoc";
import env from "../config/env.js";

const swaggerOptions: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Guidewire DevTrails API",
            version: "1.0.0",
            description: "API documentation for Guidewire DevTrails Server",
        },
        servers: [
            {
                url: `http://localhost:${env.PORT}`,
                description: env.NODE_ENV,
            },
        ],
    },
    apis: ["./src/docs/*.yaml", "./src/modules/**/*.yaml"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export default swaggerSpec;
