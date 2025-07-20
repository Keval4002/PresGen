import express from "express";
import Theme from "../models/Theme.js";
import PptRequest from "../models/pptRequest.js";
import PptProject from "../models/pptProject.js";
import { triggerAIGeneration } from "../services/aiGeneratorService.js";

const router = express.Router();

// Get active themes
router.get("/", async (req, res) => {
  console.log("GET /api/themes called");
  try {
    const themes = await Theme.find({ is_active: true }).sort({ sort_order: 1 });
    console.log('[themes.js] Number of themes found:', themes.length);
    console.log('[themes.js] Themes:', themes);
    res.json(themes);
  } catch (err) {
    console.error('[themes.js] Error fetching themes:', err);
    res.status(500).send("Server Error");
  }
});

// Receive PPT details, save to DB, trigger AI generation
router.post("/:slug/details", async (req, res) => {
  const { slug } = req.params;
  const { mode, slideCount, prompt, outline } = req.body;

  // Input validation
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: "Invalid theme slug" });
  }

  if (!mode || !['ai', 'outline'].includes(mode)) {
    return res.status(400).json({ error: "Invalid mode. Must be 'ai' or 'outline'" });
  }

  if (!slideCount || typeof slideCount !== 'number' || slideCount < 3 || slideCount > 20) {
    return res.status(400).json({ error: "Invalid slide count. Must be between 3 and 20" });
  }

  if (mode === 'ai' && (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0)) {
    return res.status(400).json({ error: "Prompt is required for AI mode" });
  }

  if (mode === 'outline' && (!outline || !Array.isArray(outline) || outline.length === 0)) {
    return res.status(400).json({ error: "Outline is required for outline mode" });
  }

  try {
    console.log(`🎨 Creating new project with theme: ${slug}`);
    const randomProjectId = Math.floor(Math.random() * 10000).toString();

    const pptRequest = new PptRequest({
      project_id: randomProjectId,
      theme_slug: slug,
      mode,
      slide_count: slideCount,
      prompt: prompt || null,
      outline: outline && outline.length > 0 ? outline : null
    });
    await pptRequest.save();
    const requestId = pptRequest._id;
    console.log(`📝 Request created with ID: ${requestId}`);

    const pptProject = new PptProject({
      request_id: requestId,
      status: 'pending'
    });
    await pptProject.save();
    const pptProjectId = pptProject._id;
    console.log(`🚀 PPT Project created with ID: ${pptProjectId}. This ID will be sent to the frontend.`);

    triggerAIGeneration({
      pptProjectId,
      themeSlug: slug,
      mode,
      slideCount,
      prompt,
      outline,
      requestId,
    });

    res.status(200).json({
      message: "PPT details saved and AI generation started",
      projectId: pptProjectId,
    });

  } catch (err) {
    console.error("Error saving PPT details:", err);
    res.status(500).json({ error: "Failed to save PPT details" });
  }
});

// Get last request
router.get("/last-request", async (req, res) => {
  try {
    const lastRequest = await PptRequest.findOne().sort({ created_at: -1 });
    if (!lastRequest) {
      return res.status(404).json({ message: "No PPT request found." });
    }
    res.status(200).json({ lastPptRequest: lastRequest });
  } catch (err) {
    console.error("Error fetching last PPT request:", err);
    res.status(500).json({ error: "Failed to fetch last PPT request" });
  }
});

// Get project by ID
router.get("/project/:projectId", async (req, res) => {
  const { projectId } = req.params;

  try {
    console.log(`📊 Fetching project ${projectId}`);
    
    // Validate projectId
    if (!projectId || projectId === 'undefined' || projectId === 'null') {
      console.error(`❌ Invalid projectId: ${projectId}`);
      return res.status(400).json({ error: "Invalid project ID" });
    }
    
    // Step 1: Get the project data and its request_id
    const project = await PptProject.findById(projectId);
    if (!project) {
      console.error(`❌ Project ${projectId} not found`);
      return res.status(404).json({ message: "Project not found." });
    }
    console.log(`📊 Project ${projectId} status: ${project.status}`);
    // Step 2: Use the request_id to get the theme_slug
    const request = await PptRequest.findById(project.request_id);
    if (!request) {
      console.error(`❌ No request found for project ${projectId}`);
      throw new Error(`Could not find original request for project ID ${projectId}`);
    }
    const themeSlug = request.theme_slug;
    // Step 3: Use the theme_slug to get the full theme details
    const theme = await Theme.findOne({ slug: themeSlug });
    if (!theme) {
      console.error(`❌ Theme not found: ${themeSlug}`);
      throw new Error(`Theme with slug "${themeSlug}" not found.`);
    }
    console.log(`✅ Successfully fetched project ${projectId}`);
    // Step 4: Combine project data and theme data into a single response
    res.json({
      ...project.toObject(),
      theme: theme.toObject()
    });
  } catch (error) {
    console.error("Error fetching project:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;