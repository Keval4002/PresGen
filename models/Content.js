import mongoose from "mongoose";

const ContentSchema = new mongoose.Schema({
  slides: { type: Array, required: true },
  request_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PptRequest",
    required: true,
  },
  theme_slug: { type: String },
  prompt: { type: String },
  status: { type: String, default: "image creation" },
  slide_count: { type: Number },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

ContentSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

const Content = mongoose.model("Content", ContentSchema);

export default Content;
