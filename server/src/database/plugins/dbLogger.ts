import { asyncLocalStorage } from "@/common/context/asyncLocalStorage";
import logger from "@/common/logger/logger";
import { logWithMetadata } from "@/common/utils/logWithMetadata";
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
      // ! Collect data from storage & query/document
      const reqMethod = asyncLocalStorage.getStore()?.get("reqMethod");
      const reqEndpoint = asyncLocalStorage.getStore()?.get("reqEndpoint");
      const reqId = asyncLocalStorage.getStore()?.get("reqId");
      const reqUserId =
        asyncLocalStorage.getStore()?.get("reqUserId") || "ANONYM";
      const dbDuration = Date.now() - (this as any)._startTime;
      const dbOperation = (this as any).op || hook;
      const dbCollection =
        (this as any)?.mongooseCollection?.modelName ||
        (this as any)?.constructor?.modelName ||
        "unknown";

      // ! Construct logg metadata
      const loggerMetaInfo = {};

      // ! Log different based on db op duration
      if (dbDuration > 200) {
        logWithMetadata({
          level: "warn",
          scope: "DB",
          message: "too long db operation",
          metadata: {
            dbDuration,
            dbOperation,
            dbCollection,
          },
        });
      } else {
        logWithMetadata({
          level: "info",
          scope: "DB",
          message: "db operation performed within good parameters",
          metadata: {
            dbDuration,
            dbOperation,
            dbCollection,
          },
        });
      }

      next();
    });
  });
};

export default executionTimePlugin;
