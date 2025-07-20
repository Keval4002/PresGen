import express from "express";
import { geminiAgent1 } from "../services/geminiAgent1.js";
import { callPollinations } from "../utils/pollinationApi.js";

const router = express.Router();

router.get("/test-gemini", async (req, res) => {
  try {
    const prompt = req.query.prompt || "Test presentation on AI";
    const slideCount = parseInt(req.query.slideCount) || 5;
    const themeSlug = req.query.themeSlug || "nebula";

    const result = await geminiAgent1({
      prompt,
      outline: null,
      slideCount,
      themeSlug,
      mode: "ai",
    });

    res.json({
      success: true,
      slides: result,
    });
  } catch (err) {
    console.error("Test GeminiAgent1 error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

router.get("/test-image", async (req, res) => {
  try {
    const prompt =
      req.query.prompt ||
      "A futuristic cityscape at night, neon colors, cyberpunk style";
    const imageUrl = await callPollinations({ prompt });
    res.json({ success: true, imageUrl });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
