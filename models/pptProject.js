import mongoose from "mongoose";

const PptProjectSchema = new mongoose.Schema({
  request_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PptRequest",
    required: true,
  },
  status: { type: String, default: "pending" },
  slides: { type: Array },
  updated_at: { type: Date, default: Date.now },
});

const PptProject = mongoose.model("PptProject", PptProjectSchema);

export default PptProject;
