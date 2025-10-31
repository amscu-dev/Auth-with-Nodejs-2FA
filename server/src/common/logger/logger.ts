import { config } from "@/config/app.config";
import winston from "winston";

const logLevels = {
  error: 0,
  warning: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logger = winston.createLogger({
  levels: logLevels,
  level: config.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.timestamp({
      format: "YYYY-MM-DD hh:mm:ss.SSS A",
    }),
    winston.format.printf(
      ({ timestamp, level, message, logMetadata, stack }) => {
        return `${timestamp} ${level}: ${logMetadata || ""} ${message} ${
          stack || ""
        }`;
      }
    )
  ),
  transports: [new winston.transports.Console()],
});

export default logger;
