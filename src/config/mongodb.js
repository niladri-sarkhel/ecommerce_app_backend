import mongoose from "mongoose";

import { logger } from "#utils";

mongoose.connection.on("connected", () => {
  logger.info("MongoDB connected");
});

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected");
});

mongoose.connection.on("error", (error) => {
  logger.error({ err: error }, "MongoDB connection error");
});

export const connectMongoDB = async (mongodbURL) => {
  try {
    logger.info("Connecting to MongoDB...");

    await mongoose.connect(mongodbURL);

    return mongoose.connection;
  } catch (error) {
    logger.fatal({ err: error }, "Failed to connect to MongoDB");

    throw error;
  }
};

export const disconnectMongoDB = async () => {
  try {
    await mongoose.disconnect();
    logger.info("MongoDB connection closed");
  } catch (error) {
    logger.error({ err: error }, "Failed to disconnect MongoDB");

    throw error;
  }
};
