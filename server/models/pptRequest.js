import mongoose from "mongoose";

const PptRequestSchema = new mongoose.Schema({
  project_id: { type: String, required: true },
  theme_slug: { type: String, required: true },
  mode: { type: String },
  slide_count: { type: Number },
  prompt: { type: String },
  outline: { type: Array },
  created_at: { type: Date, default: Date.now },
});

const PptRequest = mongoose.model("PptRequest", PptRequestSchema);

export default PptRequest;
