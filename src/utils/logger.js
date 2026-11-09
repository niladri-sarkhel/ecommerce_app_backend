import pino from "pino";
import { env } from "#config";

const transport =
  env.NODE_ENV === "development"
    ? pino.transport({
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname,app,env",
        },
      })
    : undefined;

export const logger = pino(
  {
    level: env.LOG_LEVEL || "info",

    timestamp: pino.stdTimeFunctions.isoTime,

    base: {
      app: env.APP_NAME,
      env: env.NODE_ENV,
      pid: process.pid,
    },

    formatters: {
      level: (label) => ({ level: label.toUpperCase() }),
    },

    redact: {
      paths: [
        "password",
        "confirmPassword",
        "accessToken",
        "refreshToken",
        "token",
        "authorization",
        "req.headers.authorization",
        "req.headers.cookie",
        "cookies",
        "*.password",
        "*.confirmPassword",
        "*.*.password",
        "*.token",
        "*.accessToken",
        "*.refreshToken",
      ],
      censor: "[REDACTED]",
    },

    serializers: {
      err: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
    },
  },
  transport,
);
