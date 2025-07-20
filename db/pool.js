import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";

console.log("MONGO_URI:", process.env.MONGO_URI);

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  throw new Error("MONGO_URI is undefined. Please check your .env file.");
}

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB:", MONGO_URI);
});

export default mongoose;
