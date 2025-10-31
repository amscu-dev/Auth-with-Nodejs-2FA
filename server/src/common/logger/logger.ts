import { config } from "@/config/app.config";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const sensitivityRules = [
  {
    key: "password",
    pattern: /.*/s,
    replacement: "############",
  },
  {
    key: "confirmPassword",
    pattern: /.*/s,
    replacement: "############",
  },
  {
    key: "secret",
    pattern: /.*/s,
    replacement: "############",
  },
  {
    key: "code",
    pattern: /.*/s,
    replacement: "############",
  },
  {
    key: "email",
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
    replacement: "****@****.com",
  },
];

const maskSensitiveData = (info: any) => {
  if (typeof info === "object" && info !== null) {
    for (const key in info) {
      if (typeof info[key] === "string") {
        sensitivityRules.forEach((rule) => {
          if (key === rule.key) {
            info[key] = rule.replacement;
          }
        });
      } else if (typeof info[key] === "object") {
        info[key] = maskSensitiveData(info[key]);
      }
    }
  }
  return info;
};

const maskSensitiveDataFormat = winston.format((info) => {
  if (info.reqPayload) {
    info.reqPayload = maskSensitiveData(info.reqPayload);
  }
  if (info.resPayload) {
    info.resPayload = maskSensitiveData(info.reqPayload);
  }

  return info;
});

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
      reqDuration,
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
        reqDuration ? `[DURATION]:${reqDuration}(ms)` : ""
      }`;
    } else if (scope === "DB") {
      return `[${timestamp}] - ${level.toLocaleUpperCase()} - ${reqMethod} - ${reqEndpoint} - [DB]: [REQ_ID]:${reqId} [USER]:${reqUserId} [OP]:${dbOperation} [COLLECTION]:${dbCollection} [DURATION]:${dbDuration}(ms) ${message}`;
    } else if (scope === "ERROR") {
      return `[${timestamp}] - ${level.toLocaleUpperCase()} - ${reqMethod} - ${reqEndpoint} - [ERROR]: [REQ_ID]:${reqId} [USER]:${reqUserId} [STATUS]:${status} [ERROR_CODE]:${errorCode} [ERR_MSG]:${message}`;
    } else {
      return `[${timestamp}] - ${level.toLocaleUpperCase()} - ${reqMethod} - ${reqEndpoint} - [EXTERNAL_SERVICE_ERROR]: [REQ_ID]:${reqId} [USER]:${reqUserId} [ERR_MSG]:${message}`;
    }
  })
);

const fileFormat = winston.format.combine(
  maskSensitiveDataFormat(),
  winston.format.timestamp(),
  winston.format.json(),
  winston.format.prettyPrint()
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
