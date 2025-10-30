import mongoose from "mongoose";
import executionTimePlugin from "../plugins/dbLogger";

// ! Initialize global plugins
mongoose.plugin(executionTimePlugin);

export default mongoose;
