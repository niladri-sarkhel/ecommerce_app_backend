// server.js
import http from "node:http";
import { app } from "#app";
import { logger } from "#utils";
import { connectMongoDB } from "#config";

export const startServer = async ({ port, appName, appUrl, databaseUrl }) => {
  const httpServer = http.createServer(app);
  let isShuttingDown = false;

  httpServer.on("listening", () => {
    // logger.info({ service: "auth" }, "NODE_LOKI_TEST");
    logger.info(
      { appName, appUrl },
      "🚀 %s server running at %s",
      appName,
      appUrl,
    );
  });

  httpServer.on("error", (error) => {
    if (error.syscall !== "listen") {
      logger.error({ err: error }, "Server socket runtime error encountered");
      return;
    }

    switch (error.code) {
      case "EADDRINUSE":
        logger.error({ port }, `Port ${port} is already in use`);
        break;
      case "EACCES":
        logger.error({ port }, `Port ${port} requires elevated privileges`);
        break;
      default:
        logger.error(
          { err: error },
          "Failed to start server due to system network error",
        );
    }
    process.exit(1);
  });

  const shutdown = (signalOrError) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.warn(`\nReceived ${signalOrError}. Closing active connections...`);

    const forceQuitTimeout = setTimeout(() => {
      logger.error(
        "Forced shutdown initiated: Active connections did not close in time.",
      );
      process.exit(1);
    }, 10000);

    httpServer.close((err) => {
      clearTimeout(forceQuitTimeout);
      if (err) {
        logger.error({ err }, "Error occurred while closing HTTP server");
        process.exit(1);
      }
      logger.info("HTTP server closed cleanly. Process exiting.");
      process.exit(0);
    });
  };

  process.on("uncaughtException", (error) => {
    logger.error({ err: error }, `Uncaught Exception caught: ${error.message}`);
    shutdown("uncaughtException");
  });

  process.on("unhandledRejection", (reason) => {
    logger.error({ err: reason }, `Unhandled Promise Rejection caught`);
    shutdown("unhandledRejection");
  });

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  try {
    await connectMongoDB(databaseUrl);

    httpServer.listen(port, "0.0.0.0");
  } catch (error) {
    logger.error({ err: error }, "Failed to initialize server requirements");
    process.exit(1);
  }
};
