import { config } from "@/config/app.config";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const logLevels = {
  error: 0,
  warning: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const consoleFormat = winston.format.combine(
  winston.format.errors({ stack: true }),
  winston.format.timestamp({
    format: "YYYY-MM-DD hh:mm:ss.SSS A",
  }),
  winston.format.printf((info) => {
    const {
      timestamp = "N/A",
      level = "N/A",
      message = "N/A",
      reqMethod = "N/A",
      reqEndpoint = "N/A",
      reqId = "N/A",
      reqUserId = "N/A",
      reqDuration = "N/A",
      status = "N/A",
      scope = "N/A",
      dbOperation = "N/A",
      dbCollection = "N/A",
      dbDuration = "N/A",
      errorCode = "N/A",
      errorMsg = "N/A",
      errorStack = "N/A",
    } = info;

    if (scope === "CONTROLLER") {
      return `[${timestamp}] - ${level.toLocaleUpperCase()} - ${reqMethod} - ${reqEndpoint} - [CONTROLLER]: [REQ_ID]:${reqId} [USER]:${reqUserId} [STATUS]:${status} ${message} ${
        reqDuration ? `[DURATION]${reqDuration}` : ""
      }`;
    } else if (scope === "DB") {
      return `[${timestamp}] - ${level.toLocaleUpperCase()} - ${reqMethod} - ${reqEndpoint} - [DB]: [REQ_ID]:${reqId} [USER]:${reqUserId} [OP]:${dbOperation} [COLLECTION]:${dbCollection} [DURATION]:${dbDuration} ${message}`;
    } else if (scope === "ERROR") {
      return `[${timestamp}] - ${level.toLocaleUpperCase()} - ${reqMethod} - ${reqEndpoint} - [ERROR]: [REQ_ID]:${reqId} [USER]:${reqUserId} [STATUS]:${status} [ERROR_CODE]:${errorCode} [ERR_MSG]:${message}`;
    } else {
      return `[${timestamp}] - ${level.toLocaleUpperCase()} - ${reqMethod} - ${reqEndpoint} - [EXTERNAL_SERVICE_ERROR]: [REQ_ID]:${reqId} [USER]:${reqUserId} [ERR_MSG]:${message}`;
    }
  })
);

const fileFormat = winston.format.combine(
  winston.format.errors({ stack: true }),
  winston.format.timestamp(),
  winston.format.json()
);

const logger = winston.createLogger({
  levels: logLevels,
  level: config.LOG_LEVEL,
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});

const fileRotateTransport = new DailyRotateFile({
  filename: "logs/application-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
  format: fileFormat,
});

logger.add(fileRotateTransport);

export default logger;
