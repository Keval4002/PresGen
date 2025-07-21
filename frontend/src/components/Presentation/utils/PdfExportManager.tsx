'use client';

import jsPDF from 'jspdf';
import { CANVAS_CONFIG } from '../Edit/CanvaTypesConst';

let isDownloading = false;

async function svgDataUrlToPngDataUrl(svgDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = function () {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Could not get canvas context');
      ctx.fillStyle = '#ffffff'; // Prevent transparency issues
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = svgDataUrl;
  });
}

export async function getImageUrlAsDataUrl(imageUrl: string): Promise<string | null> {
  // Try proxy first
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/image-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
    });
    if (response.ok) {
      const json = await response.json();
      if (json.dataUrl) return json.dataUrl;
    }
  } catch (err) {
    // Ignore and try direct method
  }
  // Fallback: try direct browser conversion (CORS must be allowed)
  try {
    return await convertToPngDataUrl(imageUrl);
  } catch (err) {
    console.error('❌ Direct image conversion failed:', err);
    return null;
  }
}

function getImageFormat(dataUrl: string): 'PNG' | 'JPEG' {
  if (typeof dataUrl !== 'string') return 'PNG';
  const match = dataUrl.match(/^data:image\/(\w+);/);
  if (!match) return 'PNG';
  const format = match[1].toUpperCase();
  return format === 'JPEG' ? 'JPEG' : 'PNG';
}

type ElementType = {
  type: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  fill?: string;
  align?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle';
  text?: string;
  shapeType?: string;
  stroke?: string;
  strokeWidth?: number;
  src?: string;
};

type SlideType = {
  canvasElements?: ElementType[];
};

// Utility: Convert any image data URL to PNG using a canvas
async function convertToPngDataUrl(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Could not get canvas context');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export class PdfExportManager {
  private page: { width?: number; height?: number };
  private canvas: { width?: number; height?: number };
  private scale: { x?: number; y?: number };
  private fontScale: number;

  constructor() {
    this.page = {};
    this.canvas = {};
    this.scale = {};
    this.fontScale = 1;
  }

  private _initialize(doc: jsPDF) {
    this.page = {
      width: doc.internal.pageSize.getWidth(),
      height: doc.internal.pageSize.getHeight(),
    };
    this.canvas = {
      width: CANVAS_CONFIG.WIDTH,
      height: CANVAS_CONFIG.HEIGHT,
    };
    this.scale = {
      x: (this.page.width || 1) / (this.canvas.width || 1),
      y: (this.page.height || 1) / (this.canvas.height || 1),
    };
    const pageHeightInPoints = (this.page.height || 1) * 2.83465;
    this.fontScale = pageHeightInPoints / (this.canvas.height || 1);
  }

  private _getCoords(element: ElementType) {
    return {
      x: (element.x || 0) * (this.scale.x || 1),
      y: (element.y || 0) * (this.scale.y || 1),
      w: (element.width || 0) * (this.scale.x || 1),
      h: (element.height || 0) * (this.scale.y || 1),
    };
  }

  private _getFontSize(px?: number) {
    return (px || 18) * this.fontScale;
  }

  async export(
    data: { title?: string; slides?: SlideType[] },
    theme: { background_color?: string },
    onProgress: (info: { message: string }) => void
  ) {
    if (isDownloading) {
      console.log('❌ Export already in progress');
      return;
    }
    isDownloading = true;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    this._initialize(doc);

    const slides = data.slides || [];
    for (let i = 0; i < slides.length; i++) {
      if (i > 0) doc.addPage();
      onProgress({ message: `Generating Slide ${i + 1} of ${slides.length}...` });
      await this.addSlide(doc, slides[i], theme);
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    doc.save(`${data.title || 'presentation'}.pdf`);
    isDownloading = false;
  }

  async addSlide(doc: jsPDF, slideData: SlideType, theme: { background_color?: string }) {
    const bgColor = theme.background_color || '#FFFFFF';
    doc.setFillColor(bgColor);
    doc.rect(0, 0, this.page.width!, this.page.height!, 'F');

    for (const element of slideData.canvasElements || []) {
      const coords = this._getCoords(element);

      switch (element.type) {
        case 'text':
          const fontSizePt = this._getFontSize(element.fontSize);
          const supportedFonts = ['helvetica', 'times', 'courier'];
          const safeFont = supportedFonts.includes((element.fontFamily || '').toLowerCase())
            ? element.fontFamily!.toLowerCase()
            : 'helvetica';
          doc.setFont(safeFont);
          doc.setFontSize(fontSizePt);
          doc.setTextColor(element.fill || '#000000');

          const isBold = element.fontStyle?.includes('bold');
          const isItalic = element.fontStyle?.includes('italic');
          let style: 'normal' | 'bold' | 'italic' | 'bolditalic' = 'normal';
          if (isBold && isItalic) style = 'bolditalic';
          else if (isBold) style = 'bold';
          else if (isItalic) style = 'italic';

          doc.setFont(undefined, style);

          let textX = coords.x;
          if (element.align === 'center') {
            textX = coords.x + coords.w / 2;
          } else if (element.align === 'right') {
            textX = coords.x + coords.w;
          }

          let textY = coords.y;
          if (element.verticalAlign === 'middle') {
            const textDimensions = doc.getTextDimensions(element.text || '');
            textY = coords.y + coords.h / 2 - textDimensions.h / 2;
          }

          doc.text(element.text || '', textX, textY, {
            align: element.align || 'left',
            baseline: 'top',
            maxWidth: coords.w > 0 ? coords.w : undefined,
          });
          break;

        case 'image':
          const originalUrl = element.src!;
          console.log('[PDF Export] Original image URL:', originalUrl);
          let dataUrl = await getImageUrlAsDataUrl(originalUrl);
          console.log('[PDF Export] Data URL from proxy:', dataUrl && dataUrl.substring(0, 100));

          if (!dataUrl) {
            console.warn(`[PDF Export] Skipping image due to missing data URL for: ${originalUrl}`);
            break;
          }

          try {
            // Always convert to PNG for jsPDF reliability
            if (!dataUrl.startsWith('data:image/png')) {
              dataUrl = await convertToPngDataUrl(dataUrl);
            }
            console.log('[PDF Export] Final PNG data URL length:', dataUrl.length);
            doc.addImage(dataUrl, 'PNG', coords.x, coords.y, coords.w, coords.h, '', 'FAST');
          } catch (e) {
            console.error(`[PDF Export] jsPDF failed to add image "${originalUrl}":`, e);
          }
          break;

        case 'shape':
          doc.setFillColor(element.fill || '#000000');
          doc.setDrawColor(element.stroke || '#000000');
          doc.setLineWidth((element.strokeWidth || 0) * (this.scale.x || 1));

          if (element.shapeType === 'rectangle') {
            doc.rect(coords.x, coords.y, coords.w, coords.h, 'FD');
          } else if (element.shapeType === 'ellipse' || element.shapeType === 'circle') {
            doc.ellipse(coords.x + coords.w / 2, coords.y + coords.h / 2, coords.w / 2, coords.h / 2, 'FD');
          }
          break;

        default:
          break;
      }
    }
  }
}
