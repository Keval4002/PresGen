import Content from "../models/Content.js";
import LayoutSlide from "../models/LayoutSlide.js";
import { callLLM } from "../utils/geminiApi.js";

const layoutStyles = [
  {
    name: "LeftImageRightContent",
    applicableTo: ["ContentSlide", "AgendaSlide"],
    layout: {
      title: { x: 0.08, y: 0.06, width: 0.84, height: 0.08 },
      image: { x: 0.08, y: 0.18, width: 0.38, height: 0.68 },
      content: { x: 0.52, y: 0.18, width: 0.4, height: 0.68 },
    },
  },
  {
    name: "RightImageLeftContent",
    applicableTo: ["ContentSlide", "AgendaSlide"],
    layout: {
      title: { x: 0.08, y: 0.06, width: 0.84, height: 0.08 },
      content: { x: 0.08, y: 0.18, width: 0.4, height: 0.68 },
      image: { x: 0.54, y: 0.18, width: 0.38, height: 0.68 },
    },
  },
  {
    name: "TopImageBottomContent",
    applicableTo: ["ContentSlide", "AgendaSlide"],
    layout: {
      title: { x: 0.08, y: 0.06, width: 0.84, height: 0.08 },
      image: { x: 0.08, y: 0.18, width: 0.84, height: 0.35 },
      content: { x: 0.08, y: 0.58, width: 0.84, height: 0.34 },
    },
  },
  {
    name: "BottomImageTopContent",
    applicableTo: ["ContentSlide", "AgendaSlide"],
    layout: {
      title: { x: 0.08, y: 0.06, width: 0.84, height: 0.08 },
      content: { x: 0.08, y: 0.18, width: 0.84, height: 0.35 },
      image: { x: 0.08, y: 0.58, width: 0.84, height: 0.34 },
    },
  },
  {
    name: "TwoColumnTextImage",
    applicableTo: ["ContentSlide", "AgendaSlide"],
    layout: {
      title: { x: 0.08, y: 0.06, width: 0.84, height: 0.07 },
      content: { x: 0.08, y: 0.18, width: 0.38, height: 0.68 },
      image: { x: 0.54, y: 0.18, width: 0.38, height: 0.68 },
    },
  },
  {
    name: "ContentOnlyLayout",
    applicableTo: ["ContentSlide", "AgendaSlide"],
    layout: {
      title: { x: 0.08, y: 0.06, width: 0.84, height: 0.08 },
      content: { x: 0.08, y: 0.18, width: 0.84, height: 0.72 },
    },
  },
  {
    name: "CenteredContentWithSideImage",
    applicableTo: ["ContentSlide", "AgendaSlide"],
    layout: {
      title: { x: 0.08, y: 0.06, width: 0.84, height: 0.08 },
      content: { x: 0.08, y: 0.18, width: 0.6, height: 0.68 },
      image: { x: 0.72, y: 0.25, width: 0.2, height: 0.5 },
    },
  },
  {
    name: "CenteredTitleWithImage",
    applicableTo: ["TitleSlide"],
    layout: {
      title: { x: 0.15, y: 0.25, width: 0.7, height: 0.2 },
      image: { x: 0.25, y: 0.5, width: 0.5, height: 0.35 },
    },
  },
  {
    name: "FullImageWithOverlayTitle",
    applicableTo: ["TitleSlide"],
    layout: {
      image: { x: 0, y: 0, width: 1, height: 1 },
      title: { x: 0.2, y: 0.35, width: 0.6, height: 0.3 },
    },
  },
  {
    name: "MinimalTitleOnly",
    applicableTo: ["TitleSlide"],
    layout: {
      title: { x: 0.15, y: 0.4, width: 0.7, height: 0.2 },
    },
  },
  {
    name: "TitleWithSubtitle",
    applicableTo: ["TitleSlide"],
    layout: {
      title: { x: 0.1, y: 0.3, width: 0.8, height: 0.15 },
      content: { x: 0.15, y: 0.5, width: 0.7, height: 0.1 },
      image: { x: 0.35, y: 0.65, width: 0.3, height: 0.25 },
    },
  },
  {
    name: "SideImageTitle",
    applicableTo: ["TitleSlide"],
    layout: {
      title: { x: 0.08, y: 0.3, width: 0.5, height: 0.25 },
      image: { x: 0.65, y: 0.2, width: 0.27, height: 0.6 },
    },
  },
  {
    name: "CenteredQALayout",
    applicableTo: ["Q&A"],
    layout: {
      title: { x: 0.25, y: 0.35, width: 0.5, height: 0.3 },
      image: { x: 0.35, y: 0.7, width: 0.3, height: 0.25 },
    },
  },
  {
    name: "FullScreenQA",
    applicableTo: ["Q&A"],
    layout: {
      title: { x: 0.08, y: 0.35, width: 0.6, height: 0.2 },
      image: { x: 0.72, y: 0.25, width: 0.2, height: 0.4 },
    },
  },
  {
    name: "MinimalQA",
    applicableTo: ["Q&A"],
    layout: {
      title: { x: 0.2, y: 0.45, width: 0.6, height: 0.1 },
    },
  },
  {
    name: "ConclusionWithImage",
    applicableTo: ["ConclusionSlide"],
    layout: {
      title: { x: 0.15, y: 0.2, width: 0.7, height: 0.15 },
      content: { x: 0.15, y: 0.4, width: 0.7, height: 0.25 },
      image: { x: 0.3, y: 0.7, width: 0.4, height: 0.25 },
    },
  },
  {
    name: "FullImageConclusion",
    applicableTo: ["ConclusionSlide"],
    layout: {
      title: { x: 0.08, y: 0.1, width: 0.6, height: 0.12 },
      content: { x: 0.08, y: 0.26, width: 0.6, height: 0.5 },
      image: { x: 0.72, y: 0.2, width: 0.2, height: 0.4 },
    },
  },
];

function validateCoordinate(coords) {
  if (!coords || typeof coords !== "object") return false;
  const { x, y, width, height } = coords;
  return (
    typeof x === "number" &&
    typeof y === "number" &&
    typeof width === "number" &&
    typeof height === "number" &&
    x >= 0 &&
    x <= 1 &&
    y >= 0 &&
    y <= 1 &&
    width > 0.02 &&
    width <= 1 &&
    height > 0.02 &&
    height <= 1 &&
    x + width <= 1.02 &&
    y + height <= 1.02
  );
}

function validateLayout(layout) {
  if (!layout || typeof layout !== "object") return false;

  for (const [key, coords] of Object.entries(layout)) {
    if (
      coords !== null &&
      coords !== undefined &&
      !validateCoordinate(coords)
    ) {
      console.warn(`Invalid coordinate for ${key}:`, coords);
      return false;
    }
  }
  return true;
}

function getRandomLayout(slideType, hasImage = false) {
  let filtered = layoutStyles.filter((style) =>
    style.applicableTo.includes(slideType)
  );

  if (hasImage) {
    filtered = filtered.filter(
      (style) => style.layout.image !== undefined && style.layout.image !== null
    );
  }

  if (filtered.length === 0) {
    console.warn(
      `No layouts found for slide type ${slideType} with image=${hasImage}, using fallback`
    );
    return getFallbackLayout(slideType, hasImage);
  }

  const randomStyle = filtered[Math.floor(Math.random() * filtered.length)];
  const layout = randomStyle?.layout;

  if (!validateLayout(layout)) {
    console.warn(`Invalid layout for slide type ${slideType}, using fallback`);
    return getFallbackLayout(slideType, hasImage);
  }

  return layout;
}

function getFallbackLayout(slideType, hasImage = false) {
  switch (slideType) {
    case "TitleSlide":
      if (hasImage) {
        return {
          title: { x: 0.15, y: 0.25, width: 0.7, height: 0.2 },
          image: { x: 0.25, y: 0.5, width: 0.5, height: 0.35 },
        };
      }
      return {
        title: { x: 0.15, y: 0.4, width: 0.7, height: 0.2 },
      };
    case "Q&A":
      if (hasImage) {
        return {
          title: { x: 0.25, y: 0.35, width: 0.5, height: 0.3 },
          image: { x: 0.35, y: 0.7, width: 0.3, height: 0.25 },
        };
      }
      return {
        title: { x: 0.2, y: 0.45, width: 0.6, height: 0.1 },
      };
    case "AgendaSlide":
    case "ContentSlide":
    default:
      if (hasImage) {
        return {
          title: { x: 0.08, y: 0.06, width: 0.84, height: 0.08 },
          content: { x: 0.08, y: 0.18, width: 0.4, height: 0.68 },
          image: { x: 0.54, y: 0.18, width: 0.38, height: 0.68 },
        };
      }
      return {
        title: { x: 0.08, y: 0.06, width: 0.84, height: 0.08 },
        content: { x: 0.08, y: 0.18, width: 0.84, height: 0.72 },
      };
  }
}

export async function geminiAgent2(requestId, slideCount) {
  console.log(
    `Starting geminiAgent2 for requestId: ${requestId}, slideCount: ${slideCount}`
  );

  const baseRetries = 5;
  const interval = 5000;
  const maxRetries = slideCount * baseRetries;
  let attempts = 0;

  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        console.log(
          `Polling attempt ${
            attempts + 1
          }/${maxRetries} for requestId: ${requestId}`
        );

        const contentDoc = await Content.findOne({ request_id: requestId });
        if (!contentDoc) {
          if (attempts >= maxRetries) {
            return reject(
              new Error(
                "Request ID not found in content collection after multiple attempts."
              )
            );
          }
          attempts++;
          setTimeout(poll, interval);
          return;
        }

        const slides = contentDoc.slides;
        const status = contentDoc.status;

        if (!Array.isArray(slides)) {
          return reject(
            new Error("Slides data is not in expected array format")
          );
        }

        const slidesWithLayout = slides.map((slide) => {
          const hasImage = !!(slide.imageUrl && slide.imageUrl.trim() !== "");
          const layout = getRandomLayout(slide.type, hasImage);

          console.log(
            `Slide ${slide.slideNumber} (${slide.type}) - hasImage: ${hasImage}, layout:`,
            layout
          );

          return {
            ...slide,
            layout: layout,
          };
        });

        try {
          const existingLayout = await LayoutSlide.findOne({
            request_id: requestId,
          });
          if (!existingLayout) {
            await LayoutSlide.create({
              request_id: requestId,
              slides: slidesWithLayout,
            });
          } else {
            await LayoutSlide.findOneAndUpdate(
              { request_id: requestId },
              { slides: slidesWithLayout, updated_at: new Date() },
              { new: true }
            );
          }
        } catch (dbError) {
          console.error("Database operation in geminiAgent2 failed:", dbError);
        }

        if (status === "completed") {
          console.log(
            "Content generation completed, returning slides with layout."
          );
          return resolve(slidesWithLayout);
        }

        if (attempts >= maxRetries) {
          return reject(
            new Error("Timed out waiting for content generation to complete.")
          );
        }

        attempts++;
        setTimeout(poll, interval);
      } catch (error) {
        console.error("geminiAgent2 polling error:", error);
        reject(error);
      }
    };
    poll();
  });
}
