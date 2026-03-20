# Client Documentation

This file contains important instructions to run the client and information about the modules used in this project.

## Run Instructions

| Command | Action |
|---------|--------|
| `npm run dev` | Starts the client in development mode using `vite`. |
| `npm run build` | Compiles the TypeScript code into JavaScript in the `dist/` directory. |
| `npm start` | Runs the compiled client from the `dist/` directory. |
| `npm run lint` | Runs ESLint to check for code quality and style issues. |
| `npm run format` | Runs Prettier to automatically format the source code. |
| `npm test` | Runs the test suite using Vitest. |

> [!NOTE]
> **API Documentation (`/api-docs`)** is only accessible when `NODE_ENV=development`. It is disabled in production for security.

## Docker Instructions
To run the client using Docker:
1. **Build the image**:
   ```bash
   docker build -t guidewire-client -f Dockerfile.client .
   ```
2. **Run the container**:
   ```bash
   docker run -p 3000:3000 --env-file .env guidewire-client
   ```

## Project Structure (Highlights)
- **`src/docs/*.yaml`**: API documentation stored in YAML files for a cleaner codebase.
- **`src/modules/`**: Feature-based modules (each can have its own `.docs.yaml`).
- **`src/utils/`**: Shared utilities like `logger.ts` and `apiResponse.ts`.

## Modules and Their Usage

### Core & Framework
- **[react](https://react.dev/)**: The core library for building the user interface.
- **[typescript](https://www.typescriptlang.org/)**: Provides static typing for better developer experience and code reliability.

### State Management & Data Fetching
- **[reduxjs/toolkit](https://redux-toolkit.js.org/)**: The official, opinionated, batteries-included toolset for efficient Redux development.
- **[react-redux](https://react-redux.js.org/)**: The official React bindings for Redux.
- **[axios](https://axios-http.com/)**: A promise-based HTTP client for the browser and Node.js, used for making API calls.

### Routing
- **[react-router-dom](https://reactrouter.com/)**: Declarative routing for React applications.

### UI Components & Styling
- **[tailwindcss](https://tailwindcss.com/)**: A utility-first CSS framework for rapidly building custom designs.
- **[daisyui](https://daisyui.com/)**: A plugin for Tailwind CSS that adds component classes (buttons, cards, modals, etc.) on top of Tailwind's utility classes.
- **[lucide-react](https://lucide.dev/)**: A simple, beautiful, and open-source icon library.

### Forms & Validation
- **[react-hook-form](https://react-hook-form.com/)**: A performant, flexible and extensible forms with easy to use validation.
- **[zod](https://zod.dev/)**: A TypeScript-first schema declaration and validation library.

### Testing
- **[vitest](https://vitest.dev/)**: A fast, Vite-native testing framework used for unit and integration tests.
- **[testing-library](https://testing-library.com/)**: A family of libraries for testing user interfaces.

### Utilities
- **[clsx](https://github.com/lukeed/clsx)**: A utility for constructing `className` strings conditionally.
- **[tailwind-merge](https://github.com/dcastil/tailwind-merge)**: A utility for merging Tailwind CSS class names while respecting Tailwind's class precedence rules.
- **[date-fns](https://date-fns.org/)**: A modern JavaScript date utility library for parsing, validating, manipulating, and formatting dates.