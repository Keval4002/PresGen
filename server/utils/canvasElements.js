import { v4 as uuidv4 } from "uuid";

// These constants MUST match the frontend exactly
const CANVAS_CONFIG = {
  WIDTH: 2560,
  HEIGHT: 1440,
};

// ELEMENT_TYPES to match frontend
const ELEMENT_TYPES = {
  TEXT: "text",
  IMAGE: "image",
  SHAPE: "shape",
};

// Create a text element for the canvas - match frontend exactly
function createTextElement({
  id,
  text,
  x,
  y,
  width,
  height,
  fontSize,
  fontFamily,
  fill,
  fontStyle,
  align,
  verticalAlign,
  lineHeight,
  draggable,
  shadowColor,
  shadowBlur,
  shadowOffsetX,
  shadowOffsetY,
  padding,
}) {
  return {
    id,
    type: ELEMENT_TYPES.TEXT,
    text,
    x,
    y,
    width,
    height,
    fontSize,
    fontFamily,
    fill,
    fontStyle,
    align,
    verticalAlign,
    lineHeight,
    draggable,
    shadowColor,
    shadowBlur,
    shadowOffsetX,
    shadowOffsetY,
    padding,
  };
}

// Create an image element for the canvas - match frontend exactly
function createImageElement({
  id,
  src,
  x,
  y,
  width,
  height,
  draggable,
  cornerRadius,
  shadowColor,
  shadowBlur,
  shadowOffsetX,
  shadowOffsetY,
}) {
  return {
    id,
    type: ELEMENT_TYPES.IMAGE,
    src,
    x,
    y,
    width,
    height,
    draggable,
    cornerRadius,
    shadowColor,
    shadowBlur,
    shadowOffsetX,
    shadowOffsetY,
  };
}

// Parse content for uniformity - match frontend exactly
function parseContentForUniformity(content) {
  if (!content) return { items: [], totalItems: 0 };

  if (typeof content === "string") {
    // Simple string content
    const lines = content.split("\n").filter((line) => line.trim());
    const items = lines.map((line) => ({
      title: line.trim(),
      description: "",
      hasTitle: true,
    }));
    return { items, totalItems: items.length };
  }

  if (Array.isArray(content)) {
    const items = content.map((item) => {
      if (typeof item === "string") {
        return { title: item, description: "", hasTitle: true };
      }
      if (typeof item === "object") {
        if (item.title && item.description) {
          return {
            title: item.title,
            description: item.description,
            hasTitle: true,
          };
        }
        return {
          title: item.text || item.content || "",
          description: "",
          hasTitle: true,
        };
      }
      return { title: String(item), description: "", hasTitle: true };
    });
    return { items, totalItems: items.length };
  }

  if (typeof content === "object") {
    const items = [];
    Object.keys(content).forEach((key) => {
      const value = content[key];
      if (typeof value === "string") {
        items.push({
          title: `${key}: ${value}`,
          description: "",
          hasTitle: true,
        });
      } else if (typeof value === "object") {
        items.push({
          title: key,
          description: JSON.stringify(value),
          hasTitle: true,
        });
      }
    });
    return { items, totalItems: items.length };
  }

  return { items: [], totalItems: 0 };
}

// IntelligentLayoutAnalyzer - match frontend exactly
class IntelligentLayoutAnalyzer {
  _getContentDensity(parsedContent) {
    const { totalItems, items } = parsedContent;
    const totalChars = items.reduce(
      (sum, item) =>
        sum + (item.title?.length || 0) + (item.description?.length || 0),
      0
    );

    if (totalItems === 0) return "empty";
    if (totalItems <= 3 && totalChars < 200) return "sparse";
    if (totalItems <= 6 && totalChars < 500) return "normal";
    if (totalItems <= 9 && totalChars < 800) return "dense";
    return "very-dense";
  }

  analyzeContent(slide, slideIndex = 0) {
    const { type, content, imageUrl, layout, title } = slide;
    const parsedContent = parseContentForUniformity(content);
    const { totalItems } = parsedContent;

    // Priority 1: Handle special slide types first
    if (type === "TitleSlide" || type === "Q&A")
      return { name: "title-special", params: { hasImage: !!imageUrl } };
    if (type === "Coordinate" && layout)
      return { name: "coordinate", params: { positions: layout } };

    const contentDensity = this._getContentDensity(parsedContent);

    // Priority 2: Select layout based on image presence
    if (imageUrl) {
      if (contentDensity === "very-dense")
        return { name: "image-content-stack" };
      if (contentDensity === "sparse")
        return {
          name: "image-focus",
          params: { isImageLeft: slideIndex % 2 === 0 },
        };
      return {
        name: "alternating-split",
        params: { isImageLeft: slideIndex % 2 === 0 },
      };
    }

    // Priority 3: Select layout for text-only slides
    if (contentDensity === "very-dense") {
      if (totalItems > 12)
        return { name: "multi-column", params: { columns: 2 } };
      return { name: "compact-list" };
    }
    if (totalItems >= 5 && totalItems <= 9)
      return { name: "zigzag-timeline", params: { itemCount: totalItems } };
    if (totalItems >= 3 && totalItems <= 4)
      return { name: "pyramid", params: { itemCount: totalItems } };

    // Default: Standard text layout with dynamic title height based on length
    const titleLength = (title || "").length;
    let titleHeight = 0.15;
    if (titleLength > 100) titleHeight = 0.25;
    else if (titleLength > 50) titleHeight = 0.2;
    return { name: "standard-text", params: { titleHeight } };
  }
}

// SmartLayoutManager - match frontend exactly
class SmartLayoutManager {
  generatePositions(layoutConfig) {
    const { name, params = {} } = layoutConfig;
    const layoutMethods = {
      coordinate: () => ({ name, positions: params.positions }),
      "title-special": () => ({
        name,
        positions: this.getTitleSpecialPositions(params),
      }),
      "alternating-split": () => ({
        name,
        positions: this.getAlternatingSplitPositions(params),
      }),
      "image-content-stack": () => ({
        name,
        positions: this.getImageContentStackPositions(),
      }),
      "image-focus": () => ({
        name,
        positions: this.getImageFocusPositions(params),
      }),
      "multi-column": () => ({
        name,
        positions: this.getMultiColumnPositions(params),
      }),
      "compact-list": () => ({
        name,
        positions: this.getCompactListPositions(),
      }),
      "zigzag-timeline": () => ({
        name,
        positions: this.getZigZagTimelinePositions(params),
      }),
      pyramid: () => ({ name, positions: this.getPyramidPositions(params) }),
      "standard-text": () => ({
        name,
        positions: this.getStandardTextPositions(params),
      }),
    };
    return (layoutMethods[name] || layoutMethods["standard-text"])();
  }

  getTitleSpecialPositions({ hasImage }) {
    return {
      title: { x: 0.1, y: 0.3, w: 0.8, h: 0.4 },
      image: hasImage ? { x: 0.4, y: 0.75, w: 0.2, h: 0.15 } : null,
    };
  }

  getStandardTextPositions({ titleHeight = 0.15 }) {
    const contentY = 0.1 + titleHeight + 0.05;
    return {
      title: { x: 0.05, y: 0.1, w: 0.9, h: titleHeight },
      content: { x: 0.05, y: contentY, w: 0.9, h: 1 - contentY - 0.1 },
    };
  }

  getAlternatingSplitPositions({ isImageLeft }) {
    const textX = isImageLeft ? 0.52 : 0.05;
    const imageX = isImageLeft ? 0.05 : 0.52;
    return {
      title: { x: textX, y: 0.1, w: 0.43, h: 0.15 },
      content: { x: textX, y: 0.28, w: 0.43, h: 0.62 },
      image: { x: imageX, y: 0.15, w: 0.43, h: 0.7 },
    };
  }

  getImageContentStackPositions() {
    return {
      title: { x: 0.05, y: 0.05, w: 0.9, h: 0.12 },
      image: { x: 0.1, y: 0.2, w: 0.8, h: 0.4 },
      content: { x: 0.05, y: 0.62, w: 0.9, h: 0.33 },
    };
  }

  getImageFocusPositions({ isImageLeft }) {
    const textX = isImageLeft ? 0.68 : 0.05;
    const imageX = isImageLeft ? 0.05 : 0.32;
    return {
      title: { x: textX, y: 0.2, w: 0.27, h: 0.15 },
      content: { x: textX, y: 0.38, w: 0.27, h: 0.42 },
      image: { x: imageX, y: 0.1, w: 0.6, h: 0.8 },
    };
  }

  getCompactListPositions() {
    return {
      title: { x: 0.05, y: 0.05, w: 0.9, h: 0.1 },
      content: { x: 0.05, y: 0.18, w: 0.9, h: 0.77 },
    };
  }

  getMultiColumnPositions({ columns = 2 }) {
    const positions = { title: { x: 0.05, y: 0.05, w: 0.9, h: 0.1 } };
    const colWidth = 0.9 / columns;
    for (let i = 0; i < columns; i++) {
      positions[`content${i}`] = {
        x: 0.05 + i * colWidth,
        y: 0.18,
        w: colWidth - 0.02,
        h: 0.77,
      };
    }
    return positions;
  }

  getZigZagTimelinePositions({ itemCount }) {
    const positions = { title: { x: 0.05, y: 0.02, w: 0.9, h: 0.13 } };
    positions.line = { x: 0.5 - 0.0025, y: 0.2, w: 0.005, h: 0.75 };

    const totalContentHeight = 0.8;
    const itemHeight = totalContentHeight / itemCount;
    const circleSize = Math.min(0.06, itemHeight * 0.6);

    for (let i = 0; i < itemCount; i++) {
      const y = 0.18 + i * itemHeight;
      const isLeft = i % 2 === 0;

      positions[`item${i}C`] = {
        x: 0.5 - circleSize / 2,
        y: y + itemHeight / 2 - circleSize / 2,
        w: circleSize,
        h: circleSize,
      };
      positions[`item${i}T`] = {
        x: isLeft ? 0.05 : 0.53,
        y,
        w: 0.42,
        h: itemHeight,
      };
    }
    return positions;
  }

  getPyramidPositions({ itemCount }) {
    const positions = { title: { x: 0.05, y: 0.02, w: 0.9, h: 0.13 } };
    const itemHeight = Math.max(0.1, 0.8 / itemCount);
    const circleSize = 0.06;

    for (let i = 0; i < itemCount; i++) {
      const y = 0.18 + i * itemHeight;
      positions[`item${i}C`] = {
        x: 0.1,
        y: y + itemHeight / 2 - circleSize / 2,
        w: circleSize,
        h: circleSize,
      };
      positions[`item${i}T`] = { x: 0.2, y: y, w: 0.7, h: itemHeight };
    }
    return positions;
  }
}

// Parse content text to match frontend exactly
function parseContentText(content) {
  if (!content) return "";

  // Handle different content formats
  if (typeof content === "string") {
    return content
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/^- /gm, "• ")
      .trim();
  }

  // Handle array of content items
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") {
          return item.replace(/\*\*(.*?)\*\*/g, "$1").replace(/^- /gm, "• ");
        }
        if (typeof item === "object") {
          // Handle object-based content items
          if (item.title && item.description) {
            return `${item.title}: ${item.description}`;
          }
          return (
            item.text || item.content || item.title || item.description || ""
          );
        }
        return "";
      })
      .join("\n");
  }

  // Handle object-based content
  if (typeof content === "object") {
    if (content.title && content.description) {
      return `${content.title}: ${content.description}`;
    }
    if (content.text) {
      return content.text;
    }
    if (content.content) {
      return parseContentText(content.content);
    }
    // Handle nested object structures
    const keys = Object.keys(content);
    if (keys.length > 0) {
      return keys
        .map((key) => {
          const value = content[key];
          if (typeof value === "string") {
            return `${key}: ${value}`;
          }
          if (typeof value === "object") {
            return `${key}: ${parseContentText(value)}`;
          }
          return `${key}: ${value}`;
        })
        .join("\n");
    }
  }

  return "";
}

// Convert percentage to pixels
function convertPercentageToPixels(percentage, dimension) {
  return Math.round(percentage * dimension);
}

// Main function to generate canvasElements from slide, layout, and theme
function generateCanvasElements(slide, layout, theme) {
  console.log("🎨 Backend: Starting canvasElements generation for slide:", {
    slideNumber: slide.slideNumber,
    title: slide.title,
    hasContent: !!slide.content,
    hasImageUrl: !!slide.imageUrl,
  });

  const elements = [];

  // Use the same intelligent layout analysis as frontend
  const intelligentAnalyzer = new IntelligentLayoutAnalyzer();
  const smartLayoutManager = new SmartLayoutManager();

  const layoutConfig = intelligentAnalyzer.analyzeContent(
    slide,
    slide.slideNumber || 0
  );
  const finalLayout = smartLayoutManager.generatePositions(layoutConfig);
  const layoutName = finalLayout.name;
  const positions = finalLayout.positions;

  console.log("🎨 Backend: Layout analysis:", {
    layoutName,
    hasTitlePosition: !!positions.title,
    hasContentPosition: !!positions.content,
    hasImagePosition: !!positions.image,
  });

  // Enhanced theme with better defaults - match frontend exactly
  const enhancedTheme = {
    background_color: theme.background_color || "#ffffff",
    primary_color: theme.primary_color || "#1f2937",
    text_color: theme.text_color || "#374151",
    accent_color: theme.accent_color || "#3b82f6",
    heading_font: theme.heading_font || "Inter, system-ui, sans-serif",
    body_font: theme.body_font || "Inter, system-ui, sans-serif",
    ...theme,
  };

  // Add title element with beautiful styling - match frontend exactly
  if (slide.title && positions.title) {
    const titlePos = positions.title;
    elements.push(
      createTextElement({
        id: `title-${slide.slideNumber || uuidv4()}`,
        text: slide.title,
        x: convertPercentageToPixels(titlePos.x, CANVAS_CONFIG.WIDTH),
        y: convertPercentageToPixels(titlePos.y, CANVAS_CONFIG.HEIGHT),
        width: convertPercentageToPixels(titlePos.w, CANVAS_CONFIG.WIDTH),
        height: convertPercentageToPixels(titlePos.h, CANVAS_CONFIG.HEIGHT),
        fontSize: layoutName === "title-special" ? 84 : 56,
        fontFamily: enhancedTheme.heading_font,
        fill: enhancedTheme.primary_color,
        fontStyle: "bold",
        align: layoutName === "title-special" ? "center" : "left",
        verticalAlign: "middle",
        lineHeight: 1.1,
        draggable: true,
        shadowColor: "rgba(0, 0, 0, 0.1)",
        shadowBlur: 2,
        shadowOffsetX: 1,
        shadowOffsetY: 1,
      })
    );
  }

  // Add content element with beautiful styling - match frontend exactly
  if (slide.content && positions.content) {
    const contentPos = positions.content;
    const contentText = parseContentText(slide.content);

    elements.push(
      createTextElement({
        id: `content-${slide.slideNumber || uuidv4()}`,
        text: contentText,
        x: convertPercentageToPixels(contentPos.x, CANVAS_CONFIG.WIDTH),
        y: convertPercentageToPixels(contentPos.y, CANVAS_CONFIG.HEIGHT),
        width: convertPercentageToPixels(contentPos.w, CANVAS_CONFIG.WIDTH),
        height: convertPercentageToPixels(contentPos.h, CANVAS_CONFIG.HEIGHT),
        fontSize: 32,
        lineHeight: 1.6,
        fontFamily: enhancedTheme.body_font,
        fill: enhancedTheme.text_color,
        align: "left",
        verticalAlign: "top",
        draggable: true,
        padding: 20,
      })
    );
  }

  // Add image element with beautiful styling - match frontend exactly
  if (slide.imageUrl && positions.image) {
    const imagePos = positions.image;
    let cleanImageUrl = slide.imageUrl.trim();
    if (
      cleanImageUrl &&
      !cleanImageUrl.startsWith("http://") &&
      !cleanImageUrl.startsWith("https://")
    ) {
      cleanImageUrl = `https://${cleanImageUrl}`;
    }
    let isValidUrl = false;
    try {
      new URL(cleanImageUrl);
      isValidUrl = true;
    } catch {
      // skip invalid
    }
    if (isValidUrl) {
      elements.push(
        createImageElement({
          id: `image-${slide.slideNumber || uuidv4()}`,
          src: cleanImageUrl,
          x: convertPercentageToPixels(imagePos.x, CANVAS_CONFIG.WIDTH),
          y: convertPercentageToPixels(imagePos.y, CANVAS_CONFIG.HEIGHT),
          width: convertPercentageToPixels(imagePos.w, CANVAS_CONFIG.WIDTH),
          height: convertPercentageToPixels(imagePos.h, CANVAS_CONFIG.HEIGHT),
          draggable: true,
          cornerRadius: 12,
          shadowColor: "rgba(0, 0, 0, 0.15)",
          shadowBlur: 8,
          shadowOffsetX: 2,
          shadowOffsetY: 4,
        })
      );
    }
  }

  // Handle multi-column content with beautiful styling
  if (
    layoutName === "multi-column" &&
    slide.content &&
    Array.isArray(slide.content)
  ) {
    slide.content.forEach((item, index) => {
      const contentPos = positions[`content${index}`];
      if (contentPos) {
        const contentText = parseContentText(item);
        elements.push(
          createTextElement({
            id: `content${index}-${slide.slideNumber || uuidv4()}`,
            text: contentText,
            x: convertPercentageToPixels(contentPos.x, CANVAS_CONFIG.WIDTH),
            y: convertPercentageToPixels(contentPos.y, CANVAS_CONFIG.HEIGHT),
            width: convertPercentageToPixels(contentPos.w, CANVAS_CONFIG.WIDTH),
            height: convertPercentageToPixels(
              contentPos.h,
              CANVAS_CONFIG.HEIGHT
            ),
            fontSize: 28,
            lineHeight: 1.5,
            fontFamily: enhancedTheme.body_font,
            fill: enhancedTheme.text_color,
            align: "left",
            verticalAlign: "top",
            draggable: true,
            padding: 16,
          })
        );
      }
    });
  }

  // Handle timeline content with beautiful styling
  if (
    (layoutName === "zigzag-timeline" || layoutName === "pyramid") &&
    slide.content &&
    Array.isArray(slide.content)
  ) {
    slide.content.forEach((item, index) => {
      // Check if timeline positions exist in the intelligent layout
      const itemTextPos = positions[`item${index}T`];

      if (itemTextPos) {
        const parsedContent = parseContentForUniformity(item);
        const itemText = parsedContent.items
          .map((item) => {
            if (item.hasTitle && item.description) {
              return `${item.title}: ${item.description}`;
            }
            return item.title || item.description || "";
          })
          .join("\n");

        elements.push(
          createTextElement({
            id: `timeline-${index}-${slide.slideNumber || uuidv4()}`,
            text: itemText,
            x: convertPercentageToPixels(itemTextPos.x, CANVAS_CONFIG.WIDTH),
            y: convertPercentageToPixels(itemTextPos.y, CANVAS_CONFIG.HEIGHT),
            width: convertPercentageToPixels(
              itemTextPos.w,
              CANVAS_CONFIG.WIDTH
            ),
            height: convertPercentageToPixels(
              itemTextPos.h,
              CANVAS_CONFIG.HEIGHT
            ),
            fontSize: 24,
            lineHeight: 1.4,
            fontFamily: enhancedTheme.body_font,
            fill: enhancedTheme.text_color,
            align: "left",
            verticalAlign: "top",
            draggable: true,
            padding: 12,
          })
        );
      }
    });
  }

  // Handle structural elements like lines
  if (positions.line) {
    // Add a shape element for the line
    elements.push({
      id: `line-${slide.slideNumber || uuidv4()}`,
      type: ELEMENT_TYPES.SHAPE,
      shapeType: "line",
      x: convertPercentageToPixels(positions.line.x, CANVAS_CONFIG.WIDTH),
      y: convertPercentageToPixels(positions.line.y, CANVAS_CONFIG.HEIGHT),
      width: convertPercentageToPixels(positions.line.w, CANVAS_CONFIG.WIDTH),
      height: convertPercentageToPixels(positions.line.h, CANVAS_CONFIG.HEIGHT),
      fill: enhancedTheme.primary_color,
      draggable: true,
    });
  }

  console.log("🎨 Backend: Generated canvasElements:", {
    elementCount: elements.length,
    elementTypes: elements.map((el) => el.type),
  });

  return elements;
}

export { generateCanvasElements };
