import { callLLM } from "../utils/geminiApi.js";
import Theme from "../models/Theme.js";
import PptProject from "../models/pptProject.js";
import Content from "../models/Content.js";
import { geminiAgent3 } from "./geminiAgent3.js";

// FIX: Added pptProjectId to handle status updates directly
async function geminiAgent1({
  prompt,
  outline,
  slideCount,
  themeSlug,
  mode,
  requestId,
  pptProjectId,
}) {
  try {
    const theme = await Theme.findOne({ slug: themeSlug });
    if (!theme) {
      throw new Error(`Theme "${themeSlug}" not found`);
    }
    const finalPrompt =
      `You are a world-class presentation designer and expert content strategist. Your task is to generate the complete structure and content for a presentation that is both informative and engaging, grounded in human reasoning and effective communication design, based on user requirements and a specific visual theme.

**Core Task:**
- Main Topic/Prompt: "${prompt}"
- Total Number of Slides: ${slideCount}

(✨) **Content Philosophy (Crucial):**
- **Create a Narrative:** Construct a logical, story-driven flow. Each slide must smoothly transition into the next, reinforcing audience understanding and curiosity.
- **Substantive, Human-Centric Content:** Every slide should reflect deep reasoning and clarity. Avoid shallow phrases or redundant ideas. Use human expertise to explain *why* something matters and *how* it connects to real-world scenarios.
- **Balanced Pacing & Density:** Ensure consistent content volume across 'ContentSlide' types—no slide should feel overpacked or underdeveloped. Each should feel complete and digestible.

**Visual Theme Guidelines (Strictly Adhere to This):**
- Theme Name: "${theme.name}"
- Style Description: "${theme.description}"
- Key Colors: Use the essence of Primary (${theme.primary_color}), Secondary (${theme.secondary_color}), and Background (${theme.background_color}) to influence mood and tone.
- ❌ **Image Constraint:** Image suggestions must NOT include any embedded or overlaid text or typography.

**Instructions:**
1. Your response MUST be a single, valid JSON object. Do not include any text or explanations outside of the JSON.
2. The root of the JSON object must be a key named "slides", which is an array of slide objects.
3. Generate exactly ${slideCount} slide objects.
4. The first slide must be a 'TitleSlide' and the last a 'ConclusionSlide' or 'Q&A'.

5. For each slide object, include all the following key-value pairs:
    - "slideNumber": (Number)
    - "type": (String) Choose from: "TitleSlide", "AgendaSlide", "ContentSlide", "ConclusionSlide", "Q&A".
    - "header": (String) A short, persistent header (usually the topic or session name).
    - "title": (String) An impactful, slide-specific title summarizing the key idea.

    (✨) - "content": (String) Audience-visible slide text in markdown-style bullet points:
        - Begin each bullet with a **bolded concept or term**.
        - Follow it with 1–2 clear, information-rich sentences that add original insight.
        - Focus on meaningful takeaways over generic advice.
        - Aim for 3–5 bullets per 'ContentSlide' to maintain structure and readability.

    (✨) - "speakerNotes": (String) A comprehensive speaker script expanding on the slide's bullets.
        - This is where you explain the reasoning, give practical context, transition smoothly, or even pose questions to the audience.
        - The tone should be confident, natural, and audience-aware, simulating how a knowledgeable human would speak and think through the slide.

    - "footer": (String) Consistent footer text for all slides (e.g., organization, campaign name, or author).

    - "imageSuggestion": (Object)
        - "description": (String) A highly visual prompt that reflects the mood, tone, and theme colors — without any visible text or lettering. Describe scenes, objects, or compositions relevant to the slide's idea.
        - "style": (String) Choose from: "photorealistic", "cinematic", "minimalist vector art", "data visualization graph", "abstract shapes", "isometric illustration", etc.

6. Do not include any backticks, JSON markers, code fences, Markdown formatting, or extra text — only return a raw JSON object.

⚠ Your response will be fed directly to a parser. If it is not valid JSON, it will fail.`.trim();

    let rawResponse = await callLLM({
      model: "gemini-2.0-flash",
      prompt: finalPrompt,
      apiType: "gemini",
    });
    rawResponse = rawResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let slidesData;
    try {
      slidesData = JSON.parse(rawResponse);
    } catch (parseErr) {
      console.error("Gemini response parse error:", parseErr);
      throw new Error("LLM returned unstructured data.");
    }
    if (!slidesData.slides || !Array.isArray(slidesData.slides)) {
      throw new Error("LLM response missing 'slides' array");
    }

    const contentOnlySlides = slidesData.slides;

    // Update project status to 'image creation' and save text content.
    await PptProject.findByIdAndUpdate(
      pptProjectId,
      {
        slides: contentOnlySlides,
        status: "image creation",
        updated_at: new Date(),
      },
      { new: true }
    );
    console.log(`Project ${pptProjectId} status updated to 'image creation'.`);

    // Insert initial content into `content` collection for logging/polling
    await Content.create({
      slides: contentOnlySlides,
      request_id: requestId,
      theme_slug: themeSlug,
      prompt,
      status: "image creation",
      slide_count: slideCount,
    });

    // Begin image generation
    const enrichedSlides = await geminiAgent3(contentOnlySlides);

    // Final update. Status is now 'completed' with image URLs.
    await PptProject.findByIdAndUpdate(
      pptProjectId,
      { slides: enrichedSlides, status: "completed", updated_at: new Date() },
      { new: true }
    );
    console.log(`Project ${pptProjectId} status updated to 'completed'.`);

    // Also update the 'content' collection to reflect completion.
    await Content.findOneAndUpdate(
      { request_id: requestId },
      { slides: enrichedSlides, status: "completed", updated_at: new Date() },
      { new: true }
    );

    return enrichedSlides;
  } catch (error) {
    console.error("geminiAgent1 error:", error.message);
    // Let the error bubble up to aiGeneratorService, which will set the project status to 'failed'
    throw error;
  }
}

export { geminiAgent1 };
