import mongoose from "mongoose";

const executionTimePlugin = (schema: mongoose.Schema) => {
  schema.pre(/^find|update|delete|save|aggregate/, function (next) {
    (this as any)._startTime = Date.now();
    console.log(this);
    next();
  });

  schema.post(/^find|update|delete|save|aggregate/, function (res, next) {
    const duration = Date.now() - (this as any)._startTime;
    const op = (this as any).op || "unknown";
    const collection = (this as any).model?.collection?.name;

    // logger.info({
    //   msg: `[DB] ${op} on ${collection}`,
    //   duration,
    // });
    console.log(`[DB] ${op} on ${collection} took ${duration}`);
    console.log(this);
    // if (duration > 200) {
    //   logger.warn(`[DB] Slow query detected (${duration}ms) on ${collection}`);
    // }

    next();
  });
};

export default executionTimePlugin;
