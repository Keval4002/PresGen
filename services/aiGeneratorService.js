import PptProject from "../models/pptProject.js";
import { geminiAgent1 } from "./geminiAgent1.js";
import { geminiAgent2 } from "./geminiAgent2.js";
import Theme from "../models/Theme.js";
import { generateCanvasElements } from "../utils/canvasElements.js";

async function triggerAIGeneration({
  pptProjectId,
  themeSlug,
  mode,
  slideCount,
  prompt,
  outline,
  requestId,
}) {
  console.log(`Starting AI generation for PPT Project ID: ${pptProjectId}`);

  try {
    // geminiAgent1 now handles the entire content+image generation process and its own status updates.
    // It will update the project status to 'image creation' and then 'completed'.
    const enrichedSlides = await geminiAgent1({
      prompt,
      outline,
      slideCount,
      themeSlug,
      mode,
      requestId,
      pptProjectId,
    });

    console.log(
      `Content and images generated for project ${pptProjectId}. Now adding layout information.`
    );

    let layoutSlides;
    try {
      // geminiAgent2 polls the `content` table. Since geminiAgent1 just finished,
      // it will find the 'completed' status and data immediately and add layout info.
      layoutSlides = await geminiAgent2(requestId, slideCount);
      console.log("✅ Layout processing done via geminiAgent2");
    } catch (layoutErr) {
      console.warn(
        "⚠ Failed to process layout slides with Agent2, using slides without layout info:",
        layoutErr.message
      );
      // Fallback to the slides we have if layout generation fails.
      layoutSlides = enrichedSlides;
    }

    // Fetch the theme for canvasElements generation
    const theme = await Theme.findOne({ slug: themeSlug });
    if (!theme) {
      throw new Error(`Theme with slug ${themeSlug} not found`);
    }
    const themeObj = theme.toObject();

    // Attach canvasElements to each slide using the backend utility
    const slidesWithCanvas = layoutSlides.map((slide) => {
      // If layout is present, use it; otherwise fallback to empty
      const layout = slide.layout || {};
      return {
        ...slide,
        canvasElements: generateCanvasElements(slide, layout, themeObj),
      };
    });

    // FINAL UPDATE: Save the slides that now include layout information and canvasElements.
    await PptProject.findByIdAndUpdate(
      pptProjectId,
      { slides: slidesWithCanvas, updated_at: new Date() },
      { new: true }
    );

    console.log(
      `PPT Project ${pptProjectId} successfully finalized with layout and canvasElements.`
    );
  } catch (err) {
    console.error(
      `AI generation failed for PPT Project ID: ${pptProjectId}:`,
      err
    );
    await PptProject.findByIdAndUpdate(
      pptProjectId,
      { status: "failed", updated_at: new Date() },
      { new: true }
    );
  }
}

export { triggerAIGeneration };
