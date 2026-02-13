import "dotenv/config";
import { createServer } from "node:http";
import { createApp } from "./app.js";

function parsePort(rawPort: string | undefined): number {
  const fallbackPort = 8082;
  const parsed = Number.parseInt(rawPort ?? String(fallbackPort), 10);

  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    return fallbackPort;
  }

  return parsed;
}

const port = parsePort(process.env.PORT);
const app = createApp();
const server = createServer(app);

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Gateway failed to start: port ${port} is already in use.`);
    process.exit(1);
  }

  throw error;
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection in gateway process:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception in gateway process:", error);
  process.exit(1);
});

server.listen(port, () => {
  console.log(`Gateway listening on port ${port}`);
});
