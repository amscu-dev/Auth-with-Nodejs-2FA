import { asyncLocalStorage } from "@/common/context/asyncLocalStorage";
import mongoose from "mongoose";

const mongooseMiddlewareOperations = [
  // Query middleware
  "count",
  "countDocuments",
  "deleteOne",
  "deleteMany",
  "estimatedDocumentCount",
  "find",
  "findOne",
  "findOneAndDelete",
  "findOneAndReplace",
  "findOneAndUpdate",
  "update",
  "updateOne",
  "updateMany",

  // Document middleware
  "save",
  "remove", // pentru doc.remove()

  // Model / Static middleware
  "insertMany",
  "createCollection",
  "bulkWrite",

  // Other / Initialization
  "init",
];

const executionTimePlugin = (schema: mongoose.Schema) => {
  mongooseMiddlewareOperations.forEach((hook) => {
    const regex = new RegExp(`^${hook}$`);
    schema.pre(regex, async function (next) {
      if (!(this as any)._startTime) {
        (this as any)._startTime = Date.now();
      }
      next();
    });
    schema.post(regex, function (res, next) {
      const duration = Date.now() - (this as any)._startTime;
      const op = (this as any).op || hook;
      const collection =
        (this as any)?.mongooseCollection?.modelName ||
        (this as any)?.constructor?.modelName ||
        "unknown";
      const time = new Date();
      const requestId = asyncLocalStorage.getStore()?.get("requestId");
      const userId = asyncLocalStorage.getStore()?.get("userId") || "ANONYM";
      const api = asyncLocalStorage.getStore()?.get("api");
      // logger.info({
      //   msg: `[DB] ${op} on ${collection}`,
      //   duration,
      // });
      const logEntry = {
        timestamp: time.toISOString(),
        level: "INFO",
        type: "DB",
        operation: op,
        collection: collection,
        requestId: requestId,
        userId: userId,
        api: api,
        durationMs: duration,
      };

      console.log(JSON.stringify(logEntry));
      // if (duration > 200) {
      //   logger.warn(`[DB] Slow query detected (${duration}ms) on ${collection}`);
      // }

      next();
    });
  });
};

export default executionTimePlugin;
