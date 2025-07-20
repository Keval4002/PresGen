import mongoose from 'mongoose';

const TemplateSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: Object, required: true }, // parsed PPT content as JSON
  theming: { type: Object, required: false }, // extracted theming as JSON
  cover_image_url: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export default mongoose.model('Template', TemplateSchema); 