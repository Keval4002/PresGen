import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema({
  projectId: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  cover_image_url: {
    type: String,
  },
  content: {
    type: Object,
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "trashed", "deleted"],
    default: "active",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

ProjectSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

const Project = mongoose.model("Project", ProjectSchema);

export default Project;
