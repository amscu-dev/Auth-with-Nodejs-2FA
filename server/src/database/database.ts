import { config } from "@/config/app.config";
import mongoose from "./mongoose/mongoose";
const connectDatabase = async () => {
  try {
    await mongoose.connect(config.DB_URI);
    console.log("Connected to Mongo database");
  } catch (error) {
    console.log("Error connecting to Mongo database");
    process.exit(1);
  }
};
export default connectDatabase;
