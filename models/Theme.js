import mongoose from "mongoose";

const ThemeSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  primary_color: { type: String },
  secondary_color: { type: String },
  background_color: { type: String },
  text_color: { type: String },
  heading_font: { type: String },
  body_font: { type: String },
  is_active: { type: Boolean, default: true },
  sort_order: { type: Number, default: 0 },
});

const Theme = mongoose.model("Theme", ThemeSchema);

export default Theme;
