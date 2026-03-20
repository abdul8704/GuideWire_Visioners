# Guidewire DevTrails Server Documentation

This file contains important instructions to run the server and information about the modules used in this project.

## Run Instructions

| Command | Action |
|---------|--------|
| `npm run dev` | Starts the server in development mode using `tsx`. |
| `npm run dev:watch` | Starts the server in development mode with auto-reload (watch mode). |
| `npm run build` | Compiles the TypeScript code into JavaScript in the `dist/` directory. |
| `npm start` | Runs the compiled server from the `dist/` directory. |
| `npm run lint` | Runs ESLint to check for code quality and style issues. |
| `npm run format` | Runs Prettier to automatically format the source code. |
| `npm test` | Runs the test suite using Vitest. |

> [!NOTE]
> **API Documentation (`/api-docs`)** is only accessible when `NODE_ENV=development`. It is disabled in production for security.

## Docker Instructions
To run the server using Docker:
1. **Build the image**:
   ```bash
   docker build -t guidewire-server -f Dockerfile.server .
   ```
2. **Run the container**:
   ```bash
   docker run -p 5000:5000 --env-file src/.env guidewire-server
   ```

## Project Structure (Highlights)
- **`src/docs/*.yaml`**: API documentation stored in YAML files for a cleaner codebase.
- **`src/modules/`**: Feature-based modules (each can have its own `.docs.yaml`).
- **`src/utils/`**: Shared utilities like `logger.ts` and `apiResponse.ts`.

## Modules and Their Usage

### Core & Framework
- **[express](https://expressjs.com/)**: The core web framework used to build the API.
- **[typescript](https://www.typescriptlang.org/)**: Provides static typing for better developer experience and code reliability.

### Configuration & Validation
- **[zod](https://zod.dev/)**: Used for schema-based validation of environment variables and (potentially) request bodies.
- **[dotenv](https://github.com/motdotla/dotenv)**: Loads environment variables from a `.env` file into `process.env`.

### Security
- **[helmet](https://helmetjs.github.io/)**: Helps secure the app by setting various HTTP headers.
- **[express-rate-limit](https://github.com/express-rate-limit/express-rate-limit)**: Protects the API from brute-force attacks and abuse by limiting the number of requests from a single IP.
- **[cors](https://github.com/expressjs/cors)**: Enables Cross-Origin Resource Sharing, allowing the frontend to communicate with the server.

### Logging & Performance
- **[winston](https://github.com/winstonjs/winston)**: A multi-transport logging library for structured logs (console, files).
- **[morgan](https://github.com/expressjs/morgan)**: HTTP request logger middleware, integrated with Winston.
- **[compression](https://github.com/expressjs/compression)**: Gzip compression middleware to reduce the size of response bodies.

### Documentation & Testing
- **[swagger-ui-express](https://github.com/scottie198/swagger-ui-express)** & **[swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc)**: Provides interactive API documentation at `/api-docs`.
- **[vitest](https://vitest.dev/)**: A fast, Vite-native testing framework used for unit and integration tests.
- **[supertest](https://github.com/ladjs/supertest)**: Library for testing HTTP servers.

### Utilities
- **[tsx](https://github.com/privatenumber/tsx)**: TypeScript Execute (node wrapper) for running TypeScript files directly without a separate build step during development.
