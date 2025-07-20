import express from "express";
import Project from "../models/Project.js";
import PptProject from "../models/pptProject.js";
import PptRequest from "../models/pptRequest.js";
import Theme from "../models/Theme.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// --- UPGRADED ---
// Replaced the Pollinations functions with a self-contained SVG generator.
// This function creates a clean, reliable, and theme-based cover image instantly.

/**
 * Generates a beautiful, programmatic SVG cover image based on the presentation theme and title.
 * @param {string} title - The title of the presentation.
 * @param {object} theme - The theme object containing colors.
 * @returns {string} A data URL for the generated SVG image.
 */
async function generateCoverImageSVG(title, theme) {
  // Sanitize colors and provide defaults
  const color1 = theme.primary_color || "#3B82F6";
  const color2 = theme.secondary_color || "#8B5CF6";
  const textColor = theme.text_color || "#FFFFFF";

  // Simple word wrapping for the title
  const words = title.split(" ");
  let lines = [""];
  let currentLine = 0;
  for (const word of words) {
    if ((lines[currentLine] + word).length > 25) {
      // Character limit per line
      currentLine++;
      lines[currentLine] = "";
    }
    lines[currentLine] += word + " ";
  }
  const titleLines = lines
    .map(
      (line, index) =>
        `<tspan x="50" y="${120 + index * 50}">${line.trim()}</tspan>`
    )
    .join("");

  const svg = `
        <svg width="600" height="338" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#grad)" />
            <text fill="${textColor}" font-family="Arial, sans-serif" font-size="36" font-weight="bold" text-anchor="start">
                ${titleLines}
            </text>
            <text x="580" y="320" font-family="Arial, sans-serif" font-size="14" fill="${textColor}" text-anchor="end" opacity="0.7">
                AI Presentation Builder
            </text>
        </svg>
    `;

  // Return as a Data URL
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString(
    "base64"
  )}`;
  return dataUrl;
}

// Check if project is already saved
router.get("/check/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;

    // Validate projectId
    if (!projectId || projectId === "undefined" || projectId === "null") {
      console.error(`❌ Invalid projectId: ${projectId}`);
      return res.status(400).json({ error: "Invalid project ID" });
    }

    const project = await Project.findOne({
      projectId: projectId,
      status: "active",
    });
    res.json({ alreadySaved: !!project });
  } catch (error) {
    console.error("Check project error:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// FIXED: Enhanced save route with proper ObjectId handling
router.post("/save", async (req, res) => {
  try {
    const { projectId, slides, theme, title: customTitle } = req.body;

    if (!projectId || !slides || !theme) {
      return res
        .status(400)
        .json({ error: "Missing required fields: projectId, slides, theme" });
    }

    console.log(`🔍 Processing save request for project ID: ${projectId}`);

    // Check if project already exists (by projectId field, not _id)
    const existingProject = await Project.findOne({
      projectId: projectId,
      status: "active",
    });
    if (existingProject) {
      console.log(`⚠️ Project ${projectId} already saved`);
      return res.status(409).json({ error: "Project already saved" });
    }

    const title = customTitle || slides[0]?.title || "Untitled Presentation";
    const description = `Saved presentation with ${slides.length} slides`;
    const coverImageUrl = await generateCoverImageSVG(title, theme);

    const newProject = new Project({
      projectId: projectId, // Store the original projectId as a separate field
      title,
      description,
      cover_image_url: coverImageUrl,
      content: { slides, theme },
      status: "active",
    });
    await newProject.save();

    console.log(`✅ Project saved successfully with ID: ${newProject._id}`);

    res.status(201).json({
      success: true,
      project: newProject,
      message: "Presentation saved successfully",
    });
  } catch (error) {
    // Handle duplicate key error (E11000)
    if (error.code === 11000 && error.keyPattern && error.keyPattern.projectId) {
      console.error("❌ Duplicate projectId error:", error);
      return res.status(409).json({ error: "A project with this projectId already exists." });
    }
    console.error("❌ Save project error:", error);
    res
      .status(500)
      .json({ error: "Failed to save presentation", details: error.message });
  }
});

router.get("/active", async (req, res) => {
  try {
    const projects = await Project.find({ status: "active" }).sort({
      updated_at: -1,
    });

    // Add formatted date labels to each project and ensure id field exists
    const projectsWithLabels = projects.map((project) => {
      const projectObj = project.toObject();
      return {
        ...projectObj,
        id: projectObj._id, // Ensure id field exists for frontend compatibility
        updated_label: getDateLabel(project.updated_at),
      };
    });

    res.json(projectsWithLabels);
  } catch (error) {
    console.error("DB query error : ", error);
    res.status(500).json({ error: "Database Error" });
  }
});

router.get("/deleted", async (req, res) => {
  try {
    const projects = await Project.find({ status: "deleted" }).sort({
      updated_at: -1,
    });

    // Add formatted date labels to each project and ensure id field exists
    const projectsWithLabels = projects.map((project) => {
      const projectObj = project.toObject();
      return {
        ...projectObj,
        id: projectObj._id, // Ensure id field exists for frontend compatibility
        updated_label: getDateLabel(project.updated_at),
      };
    });

    res.json(projectsWithLabels);
  } catch (error) {
    console.error("DB query error : ", error);
    res.status(500).json({ error: "Database Error" });
  }
});

router.post("/:id/trash", async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findOneAndUpdate(
      { _id: id },
      { status: "deleted" },
      { new: true }
    );
    if (!project) return res.status(404).json({ error: "Not found" });
    res.json(project);
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/:id/restore", async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findOneAndUpdate(
      { _id: id },
      { status: "active" },
      { new: true }
    );
    if (!project) return res.status(404).json({ error: "Not found" });
    res.json(project);
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findOneAndDelete(id);
    if (!project) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.get("/sidebar", async (req, res) => {
  try {
    const recentProjects = await Project.find()
      .sort({ updated_at: -1 })
      .limit(5);
    const recentlyViewed = recentProjects.map((p) => ({
      id: p._id,
      name: p.title,
      date: getDateLabel(p.updated_at),
    }));
    res.json({
      recentlyViewed,
      navigation: [
        { label: "Home", path: "/", icon: "Home" },
        { label: "Trash", path: "/trash", icon: "Trash2" },
      ],
    });
  } catch (err) {
    console.error("Sidebar data fetch error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

function getDateLabel(date) {
  const now = new Date();
  const updated = new Date(date);
  const diffDays = Math.floor((now - updated) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

router.get("/user", async (req, res) => {
  try {
    const result = await mongoose.connection.db.collection("users").findOne({});

    if (!result) {
      return res.status(404).json({ error: "No user found" });
    }

    res.json({
      id: result._id,
      created_at: result.created_at,
      name: result.name,
      email: result.email,
    });
  } catch (error) {
    console.error("Error fetching user:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add GET /edit/:projectId for editing a project
router.get("/edit/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findOne({ projectId: projectId, status: "active" });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json({
      ...project.content, // This contains slides and theme
      _id: project._id,
      projectId: project.projectId,
      title: project.title,
      description: project.description,
      status: "completed", // Saved projects are always completed
    });
  } catch (error) {
    console.error("Error fetching saved project for editing:", error);
    res.status(500).json({ error: "Failed to fetch project for editing" });
  }
});

// Add PUT /edit/:projectId for updating a project
router.put("/edit/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const updateData = req.body;
    const project = await Project.findOne({ projectId: projectId, status: "active" });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    // Update the project content with the new data
    project.content = {
      slides: updateData.slides,
      theme: updateData.theme,
    };
    project.title = updateData.title || project.title;
    project.updated_at = new Date();
    await project.save();
    res.json({
      success: true,
      message: "Project updated successfully",
      project: project,
    });
  } catch (error) {
    console.error("Error updating saved project:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
});

// Get project by projectId (for both saved and AI-generated projects)
router.get("/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    console.log(`🔍 Fetching project by projectId: ${projectId}`);
    // Validate projectId
    if (!projectId || projectId === "undefined" || projectId === "null") {
      console.error(`❌ Invalid projectId: ${projectId}`);
      return res.status(400).json({ error: "Invalid project ID" });
    }
    // Find by projectId
    let project = await Project.findOne({ projectId: projectId });
    if (project) {
      return res.json({
        ...project.content,
        _id: project._id,
        projectId: project.projectId,
        title: project.title,
        description: project.description,
        status: "completed",
      });
    }
    // If not found as saved project, try to find it as an AI-generated project
    const pptProject = await PptProject.findById(projectId);
    if (pptProject) {
      // Get the request to find the theme
      const request = await PptRequest.findById(pptProject.request_id);
      if (!request) {
        return res.status(404).json({ error: "Project request not found" });
      }
      // Get the theme
      const theme = await Theme.findOne({ slug: request.theme_slug });
      if (!theme) {
        return res.status(404).json({ error: "Theme not found" });
      }
      // Return the AI-generated project data
      return res.json({
        ...pptProject.toObject(),
        theme: theme.toObject(),
      });
    }
    // If not found in either collection
    return res.status(404).json({ error: "Project not found" });
  } catch (error) {
    console.error("Error fetching project by ObjectId:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

export default router;