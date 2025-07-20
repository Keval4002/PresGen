import express from "express";
import PptProject from "../models/pptProject.js";
import PptRequest from "../models/pptRequest.js";

const router = express.Router();

router.get("/project/:projectId", async (req, res) => {
  const { projectId } = req.params;

  try {
    // Validate projectId
    if (!projectId || projectId === "undefined" || projectId === "null") {
      console.error(`❌ Invalid projectId: ${projectId}`);
      return res.status(400).json({ error: "Invalid project ID" });
    }

    // Find the pptProject by _id
    const pptProject = await PptProject.findById(projectId);
    if (!pptProject) {
      return res.status(404).json({ message: "Project not found." });
    }
    // Optionally, populate request info if needed
    // const pptRequest = await PptRequest.findById(pptProject.request_id);
    res.status(200).json({
      slides: pptProject.slides,
      status: pptProject.status,
      updated_at: pptProject.updated_at,
    });
  } catch (err) {
    console.error("Error fetching project data:", err);
    res.status(500).json({ error: "Failed to fetch project data." });
  }
});

export default router;
