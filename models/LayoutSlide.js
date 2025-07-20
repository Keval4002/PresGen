import mongoose from "mongoose";

const LayoutSlideSchema = new mongoose.Schema({
  request_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PptRequest",
    required: true,
  },
  slides: { type: Array, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

LayoutSlideSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

const LayoutSlide = mongoose.model("LayoutSlide", LayoutSlideSchema);

export default LayoutSlide;
