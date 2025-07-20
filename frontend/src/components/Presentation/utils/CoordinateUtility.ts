import { CANVAS_CONFIG } from "../Edit/CanvaTypesConst";
import type { Theme } from "../client-only/types";

export const PPTX_DIMENSIONS = { WIDTH: 10, HEIGHT: 5.625 };

export class CoordinateManager {
    webToPptx(webCoords) {
        if (!this.isValidWebCoordinate(webCoords)) return null;
        const { x, y, w, h } = webCoords;
        return { 
            x: x * PPTX_DIMENSIONS.WIDTH, 
            y: y * PPTX_DIMENSIONS.HEIGHT, 
      w: Math.min(
        w * PPTX_DIMENSIONS.WIDTH,
        PPTX_DIMENSIONS.WIDTH - x * PPTX_DIMENSIONS.WIDTH
      ),
      h: Math.min(
        h * PPTX_DIMENSIONS.HEIGHT,
        PPTX_DIMENSIONS.HEIGHT - y * PPTX_DIMENSIONS.HEIGHT
      ),
        };
    }

    isValidWebCoordinate(coords) {
    if (!coords || typeof coords !== "object") return false;
        const { x, y, w, h } = coords;
    return (
      [x, y, w, h].every((val) => typeof val === "number" && isFinite(val)) &&
      w >= 0 &&
      h >= 0 &&
      x >= 0 &&
      x <= 1 &&
      y >= 0 &&
      y <= 1
    );
    }

    validateAndNormalizeLayout(layout) {
    if (!layout || typeof layout !== "object") return null;
        const validatedLayout = {};
        for (const key in layout) {
      if (
        Object.prototype.hasOwnProperty.call(layout, key) &&
        layout[key] &&
        this.isValidWebCoordinate(layout[key])
      ) {
                validatedLayout[key] = layout[key];
            }
        }
        return Object.keys(validatedLayout).length > 0 ? validatedLayout : null;
    }

  validateSlideMeasurements(measurements) {
    if (!measurements) return false;
    if (!measurements.title) return false;

    for (const key in measurements) {
      if (!this.isValidWebCoordinate(measurements[key])) {
        return false;
      }
    }
    return true;
    }
}

export class PptxExportManager {
    constructor() {
        // Removed unused coordinateManager property
    }

  async exportSavedPresentation(data: any, theme: Theme) {
        // Ensure JSZip is loaded first
        if (typeof window !== "undefined" && !(window as any).JSZip) {
            await new Promise((resolve) => {
                const script = document.createElement("script");
                script.src = "/jszip.min.js";
                script.onload = resolve;
                document.body.appendChild(script);
            });
        }
        // Then load pptxgenjs
        if (typeof window !== "undefined" && !(window as any).PptxGenJS) {
            await new Promise((resolve) => {
                const script = document.createElement("script");
                script.src = "/pptxgen.min.js";
                script.onload = resolve;
                document.body.appendChild(script);
            });
        }
        const PptxGenJS = (window as any).PptxGenJS;
        const pptx = new PptxGenJS();
        pptx.layout = 'LAYOUT_16x9';
        pptx.title = data.slides?.[0]?.title || "Presentation";

    data.slides.forEach((slideData: any) => {
      this.addSlideFromCanvasElements(pptx, slideData, theme);
        });

        await pptx.writeFile({ fileName: `${pptx.title}.pptx` });
    }

  addSlideFromCanvasElements(pptx: any, slideData: any, theme: Theme) {
        const slide = pptx.addSlide();
    const backgroundHex = theme?.background_color || '#FFFFFF';
        if (backgroundHex) {
            slide.background = { color: backgroundHex.replace("#", "") };
        }
    const hasTitleElement = slideData.canvasElements?.some((el: any) =>
      el.type === 'text' && (el.text === slideData.title || el.isTitle)
    );
    if (slideData.title && !hasTitleElement) {
      slide.addText(slideData.title, {
        x: 0.5, y: 0.25, w: 9, h: 0.75,
        fontFace: theme?.heading_font || 'Arial',
        fontSize: 24,
        color: (theme?.primary_color || '000000').replace("#", ""),
        bold: true, align: 'center', valign: 'middle',
      });
    }
    const canvasWidth = slideData.canvasWidth || CANVAS_CONFIG.WIDTH;
    const canvasHeight = slideData.canvasHeight || CANVAS_CONFIG.HEIGHT;
    (slideData.canvasElements || []).forEach((el: any) => {
      this.addCanvasElementToSlide(slide, el, theme, canvasWidth, canvasHeight);
    });
  }

  addCanvasElementToSlide(slide: any, element: any, theme: Theme, canvasWidth: number, canvasHeight: number) {
    const pptxCoords = this.canvasToPptxCoordinates(element, canvasWidth, canvasHeight);
    switch (element.type) {
      case 'text':
        this.addTextElementToSlide(slide, element, pptxCoords, theme, canvasWidth);
        break;
      case 'image':
        this.addImageElementToSlide(slide, element, pptxCoords);
        break;
      case 'shape':
        this.addShapeElementToSlide(slide, element, pptxCoords, theme);
        break;
      default:
        break;
    }
  }

  canvasToPptxCoordinates(element: any, canvasWidth: number, canvasHeight: number) {
    const PPTX_WIDTH = 10;
    const PPTX_HEIGHT = 5.625;
    const scaleX = PPTX_WIDTH / canvasWidth;
    const scaleY = PPTX_HEIGHT / canvasHeight;
    const x = element.x * scaleX;
    const y = element.y * scaleY;
    const w = (element.width || 200) * scaleX;
    const h = (element.height || 50) * scaleY;
    return { x, y, w, h };
  }

  addTextElementToSlide(slide: any, element: any, pptxCoords: any, theme: Theme, canvasWidth: number) {
    const scale = 720 / canvasWidth;
    const scaledFontSize = (element.fontSize || 18) * scale;
    const color = (element.fill || theme?.text_color || '#000000').replace('#', '');
    
    slide.addText(element.text || '', {
      ...pptxCoords,
      fontFace: element.fontFamily || theme?.body_font || 'Arial',
      fontSize: scaledFontSize,
      color: color,
      bold: element.fontStyle === 'bold',
      italic: element.fontStyle === 'italic',
      align: element.align || 'left',
      valign: element.verticalAlign || 'top',
      bullet: !!element.bulleted,
      transparency: typeof element.opacity === 'number' ? (1 - element.opacity) * 100 : 0,
      rotate: element.rotation || 0,
    });
  }

  addImageElementToSlide(slide: any, element: any, pptxCoords: any) {
    const imageOptions = {
        x: pptxCoords.x,
        y: pptxCoords.y,
        sizing: {
            type: 'cover',
            w: pptxCoords.w,
            h: pptxCoords.h,
        },
        rotate: element.rotation || 0,
    };

    if (
      typeof element.src === "string" &&
      (element.src.startsWith("data:image/png") || element.src.startsWith("data:image/jpeg"))
    ) {
        (imageOptions as any).data = element.src;
        slide.addImage(imageOptions);
    } else if (
      typeof element.src === "string" &&
      (element.src.startsWith("http://") || element.src.startsWith("https://"))
    ) {
        (imageOptions as any).path = element.src;
        slide.addImage(imageOptions);
    }
  }

  addShapeElementToSlide(slide: any, element: any, pptxCoords: any, theme: Theme) {
    slide.addShape(element.shapeType || 'rect', {
      ...pptxCoords,
      fill: { color: (element.fill || theme?.primary_color || '#000000').replace("#", "") },
      line: { color: (element.stroke || '#000000').replace("#", ""), width: element.strokeWidth || 0 },
      rotate: element.rotation || 0,
    });
  }
}