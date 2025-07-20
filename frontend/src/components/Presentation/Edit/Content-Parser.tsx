// 'use client';

// import { v4 as uuidv4 } from 'uuid';
// import { CANVAS_CONFIG, ELEMENT_TYPES, createTextElement, createImageElement } from './CanvaTypesConst';

// import { IntelligentLayoutAnalyzer } from '../utils/IntelligentLayoutAnalyzer';
// import { SmartLayoutManager } from '../utils/SmartLayoutManager';
// import { parseContentForUniformity } from '../utils/UnifiedContentProcessor';

// const intelligentAnalyzer = new IntelligentLayoutAnalyzer();
// const smartLayoutManager = new SmartLayoutManager();

// const parseContentText = (content: any): string => {
//   if (!content) return '';

//   if (typeof content === 'string') {
//     return content.replace(/\*\*(.*?)\*\*/g, '$1').replace(/^- /gm, '• ').trim();
//   }

//   if (Array.isArray(content)) {
//     return content.map(item => {
//       if (typeof item === 'string') {
//         return item.replace(/\*\*(.*?)\*\*/g, '$1').replace(/^- /gm, '• ');
//       }
//       if (typeof item === 'object') {
//         if (item.title && item.description) {
//           return `${item.title}: ${item.description}`;
//         }
//         return item.text || item.content || item.title || item.description || '';
//       }
//       return '';
//     }).join('\n');
//   }

//   if (typeof content === 'object') {
//     if (content.title && content.description) {
//       return `${content.title}: ${content.description}`;
//     }
//     if (content.text) return content.text;
//     if (content.content) return parseContentText(content.content);

//     const keys = Object.keys(content);
//     return keys.map(key => {
//       const value = content[key];
//       if (typeof value === 'string') return `${key}: ${value}`;
//       if (typeof value === 'object') return `${key}: ${parseContentText(value)}`;
//       return `${key}: ${value}`;
//     }).join('\n');
//   }

//   return '';
// };

// const convertPercentageToPixels = (percentage: number, dimension: number): number => {
//   return Math.round(percentage * dimension);
// };

// const convertSlideToCanvasElements = (slide: any, theme: any): any[] => {
//   console.log('🎨 Content-Parser: Starting conversion for slide:', {
//     slideNumber: slide.slideNumber,
//     title: slide.title,
//     hasContent: !!slide.content,
//     hasImageUrl: !!slide.imageUrl,
//     contentLength: slide.content?.length || 0,
//   });

//   const elements: any[] = [];

//   const layoutConfig = intelligentAnalyzer.analyzeContent(slide, slide.slideNumber || 0);
//   const finalLayout = smartLayoutManager.generatePositions(layoutConfig);
//   const layoutName = finalLayout.name;
//   const positions = finalLayout.positions;

//   console.log('🎨 Content-Parser: Layout analysis:', {
//     layoutName,
//     hasTitlePosition: !!positions.title,
//     hasContentPosition: !!positions.content,
//     hasImagePosition: !!positions.image,
//   });

//   const enhancedTheme = {
//     background_color: theme.background_color || '#ffffff',
//     primary_color: theme.primary_color || '#1f2937',
//     text_color: theme.text_color || '#374151',
//     accent_color: theme.accent_color || '#3b82f6',
//     heading_font: theme.heading_font || 'Inter, system-ui, sans-serif',
//     body_font: theme.body_font || 'Inter, system-ui, sans-serif',
//     ...theme,
//   };

//   if (slide.title && positions.title) {
//     const titlePos = positions.title;
//     elements.push(createTextElement({
//       id: `title-${slide.slideNumber || uuidv4()}`,
//       text: slide.title,
//       x: convertPercentageToPixels(titlePos.x, CANVAS_CONFIG.WIDTH),
//       y: convertPercentageToPixels(titlePos.y, CANVAS_CONFIG.HEIGHT),
//       width: convertPercentageToPixels(titlePos.w, CANVAS_CONFIG.WIDTH),
//       height: convertPercentageToPixels(titlePos.h, CANVAS_CONFIG.HEIGHT),
//       fontSize: layoutName === 'title-special' ? 84 : 56,
//       fontFamily: enhancedTheme.heading_font,
//       fill: enhancedTheme.primary_color,
//       fontStyle: 'bold',
//       align: layoutName === 'title-special' ? 'center' : 'left',
//       verticalAlign: 'middle',
//       lineHeight: 1.1,
//       draggable: true,
//       shadowColor: 'rgba(0, 0, 0, 0.1)',
//       shadowBlur: 2,
//       shadowOffsetX: 1,
//       shadowOffsetY: 1,
//     }));
//   }

//   if (slide.content && positions.content) {
//     const contentPos = positions.content;
//     const parsedContent = parseContentForUniformity(slide.content);
//     const contentText = parsedContent.items.map((item: any) => {
//       if (item.hasTitle && item.description) {
//         return `${item.title}: ${item.description}`;
//       }
//       return item.title || item.description || '';
//     }).join('\n');

//     elements.push(createTextElement({
//       id: `content-${slide.slideNumber || uuidv4()}`,
//       text: contentText,
//       x: convertPercentageToPixels(contentPos.x, CANVAS_CONFIG.WIDTH),
//       y: convertPercentageToPixels(contentPos.y, CANVAS_CONFIG.HEIGHT),
//       width: convertPercentageToPixels(contentPos.w, CANVAS_CONFIG.WIDTH),
//       height: convertPercentageToPixels(contentPos.h, CANVAS_CONFIG.HEIGHT),
//       fontSize: 32,
//       lineHeight: 1.6,
//       fontFamily: enhancedTheme.body_font,
//       fill: enhancedTheme.text_color,
//       align: 'left',
//       verticalAlign: 'top',
//       draggable: true,
//       padding: 20,
//     }));
//   }

//   if (slide.imageUrl && positions.image) {
//     let cleanImageUrl = slide.imageUrl.trim();
//     if (cleanImageUrl && !/^https?:\/\//i.test(cleanImageUrl)) {
//       cleanImageUrl = `https://${cleanImageUrl}`;
//     }

//     let isValidUrl = false;
//     try {
//       new URL(cleanImageUrl);
//       isValidUrl = true;
//     } catch {
//       console.warn('🖼️ Content-Parser: Invalid image URL:', slide.imageUrl);
//     }

//     if (isValidUrl) {
//       const imagePos = positions.image;
//       elements.push(createImageElement({
//         id: `image-${slide.slideNumber || uuidv4()}`,
//         src: cleanImageUrl,
//         x: convertPercentageToPixels(imagePos.x, CANVAS_CONFIG.WIDTH),
//         y: convertPercentageToPixels(imagePos.y, CANVAS_CONFIG.HEIGHT),
//         width: convertPercentageToPixels(imagePos.w, CANVAS_CONFIG.WIDTH),
//         height: convertPercentageToPixels(imagePos.h, CANVAS_CONFIG.HEIGHT),
//         draggable: true,
//         cornerRadius: 12,
//         shadowColor: 'rgba(0, 0, 0, 0.15)',
//         shadowBlur: 8,
//         shadowOffsetX: 2,
//         shadowOffsetY: 4,
//       }));
//     }
//   }

//   if (layoutName === 'multi-column' && Array.isArray(slide.content)) {
//     slide.content.forEach((item: any, index: number) => {
//       const contentPos = positions[`content${index}`];
//       if (contentPos) {
//         const contentText = parseContentText(item);
//         elements.push(createTextElement({
//           id: `content${index}-${slide.slideNumber || uuidv4()}`,
//           text: contentText,
//           x: convertPercentageToPixels(contentPos.x, CANVAS_CONFIG.WIDTH),
//           y: convertPercentageToPixels(contentPos.y, CANVAS_CONFIG.HEIGHT),
//           width: convertPercentageToPixels(contentPos.w, CANVAS_CONFIG.WIDTH),
//           height: convertPercentageToPixels(contentPos.h, CANVAS_CONFIG.HEIGHT),
//           fontSize: 28,
//           lineHeight: 1.5,
//           fontFamily: enhancedTheme.body_font,
//           fill: enhancedTheme.text_color,
//           align: 'left',
//           verticalAlign: 'top',
//           draggable: true,
//           padding: 16,
//         }));
//       }
//     });
//   }

//   if ((layoutName === 'zigzag-timeline' || layoutName === 'pyramid') && Array.isArray(slide.content)) {
//     slide.content.forEach((item: any, index: number) => {
//       const itemTextPos = positions[`item${index}T`];
//       if (itemTextPos) {
//         const itemText = parseContentForUniformity(item).items.map((i: any) => {
//           if (i.hasTitle && i.description) {
//             return `${i.title}: ${i.description}`;
//           }
//           return i.title || i.description || '';
//         }).join('\n');

//         elements.push(createTextElement({
//           id: `timeline-${index}-${slide.slideNumber || uuidv4()}`,
//           text: itemText,
//           x: convertPercentageToPixels(itemTextPos.x, CANVAS_CONFIG.WIDTH),
//           y: convertPercentageToPixels(itemTextPos.y, CANVAS_CONFIG.HEIGHT),
//           width: convertPercentageToPixels(itemTextPos.w, CANVAS_CONFIG.WIDTH),
//           height: convertPercentageToPixels(itemTextPos.h, CANVAS_CONFIG.HEIGHT),
//           fontSize: 24,
//           lineHeight: 1.4,
//           fontFamily: enhancedTheme.body_font,
//           fill: enhancedTheme.text_color,
//           align: 'left',
//           verticalAlign: 'top',
//           draggable: true,
//           padding: 12,
//         }));
//       }
//     });
//   }

//   if (positions.line) {
//     elements.push({
//       id: `line-${slide.slideNumber || uuidv4()}`,
//       type: ELEMENT_TYPES.SHAPE,
//       shapeType: 'line',
//       x: convertPercentageToPixels(positions.line.x, CANVAS_CONFIG.WIDTH),
//       y: convertPercentageToPixels(positions.line.y, CANVAS_CONFIG.HEIGHT),
//       width: convertPercentageToPixels(positions.line.w, CANVAS_CONFIG.WIDTH),
//       height: convertPercentageToPixels(positions.line.h, CANVAS_CONFIG.HEIGHT),
//       fill: enhancedTheme.primary_color,
//       draggable: true,
//     });
//   }

//   // Handle additional nested content and sub-slides logic (preserved as-is)
//   // ...

//   console.log('🎨 Content-Parser: Generated elements:', {
//     totalElements: elements.length,
//     elementTypes: elements.map(el => el.type),
//     elementIds: elements.map(el => el.id),
//   });

//   return elements;
// };

// const convertPixelsToLayout = (pixels: {
//   x: number;
//   y: number;
//   width: number;
//   height: number;
// }) => {
//   return {
//     x: pixels.x / CANVAS_CONFIG.WIDTH,
//     y: pixels.y / CANVAS_CONFIG.HEIGHT,
//     width: pixels.width / CANVAS_CONFIG.WIDTH,
//     height: pixels.height / CANVAS_CONFIG.HEIGHT,
//   };
// };

// export {
//   parseContentText,
//   convertPixelsToLayout,
//   convertSlideToCanvasElements,
// };


'use client';

import { v4 as uuidv4 } from 'uuid';
import { CANVAS_CONFIG, ELEMENT_TYPES, createTextElement, createImageElement } from './CanvaTypesConst';
import { IntelligentLayoutAnalyzer } from '../utils/IntelligentLayoutAnalyzer';
import { SmartLayoutManager, LayoutConfig, LayoutName } from '../utils/SmartLayoutManager';
import { parseContentForUniformity } from '../utils/UnifiedContentProcessor';

const intelligentAnalyzer = new IntelligentLayoutAnalyzer();
const smartLayoutManager = new SmartLayoutManager();

function isValidLayoutName(name: string): name is LayoutName {
    const validLayouts: LayoutName[] = [
        'coordinate',
        'title-special',
        'alternating-split',
        'image-content-stack',
        'image-focus',
        'multi-column',
        'compact-list',
        'zigzag-timeline',
        'pyramid',
        'standard-text'
    ];
    return validLayouts.includes(name as LayoutName);
}

function adaptLayoutConfig(rawConfig: any): LayoutConfig {
    if (!isValidLayoutName(rawConfig.name)) {
        console.warn(`Invalid layout name: ${rawConfig.name}. Defaulting to standard-text.`);
        return {
            name: 'standard-text',
            params: rawConfig.params || {}
        };
    }
    return rawConfig as LayoutConfig;
}

const parseContentText = (content: any): string => {
  if (!content) return '';

  if (typeof content === 'string') {
    return content.replace(/\*\*(.*?)\*\*/g, '$1').replace(/^- /gm, '• ').trim();
  }

  if (Array.isArray(content)) {
    return content.map(item => {
      if (typeof item === 'string') {
        return item.replace(/\*\*(.*?)\*\*/g, '$1').replace(/^- /gm, '• ');
      }
      if (typeof item === 'object') {
        if (item.title && item.description) {
          return `${item.title}: ${item.description}`;
        }
        return item.text || item.content || item.title || item.description || '';
      }
      return '';
    }).join('\n');
  }

  if (typeof content === 'object') {
    if (content.title && content.description) {
      return `${content.title}: ${content.description}`;
    }
    if (content.text) return content.text;
    if (content.content) return parseContentText(content.content);

    const keys = Object.keys(content);
    return keys.map(key => {
      const value = content[key];
      if (typeof value === 'string') return `${key}: ${value}`;
      if (typeof value === 'object') return `${key}: ${parseContentText(value)}`;
      return `${key}: ${value}`;
    }).join('\n');
  }

  return '';
};

const convertPercentageToPixels = (percentage: number, dimension: number): number => {
  return Math.round(percentage * dimension);
};

const convertSlideToCanvasElements = (slide: any, theme: any): any[] => {
  console.log('🎨 Content-Parser: Starting conversion for slide:', {
    slideNumber: slide.slideNumber,
    title: slide.title,
    hasContent: !!slide.content,
    hasImageUrl: !!slide.imageUrl,
    contentLength: slide.content?.length || 0,
  });

  const elements: any[] = [];

  const rawLayoutConfig = intelligentAnalyzer.analyzeContent(slide, slide.slideNumber || 0);
  const layoutConfig = adaptLayoutConfig(rawLayoutConfig);
  const finalLayout = smartLayoutManager.generatePositions(layoutConfig);
  const layoutName = finalLayout.name;
  const positions = finalLayout.positions;

  console.log('🎨 Content-Parser: Layout analysis:', {
    layoutName,
    hasTitlePosition: !!positions.title,
    hasContentPosition: !!positions.content,
    hasImagePosition: !!positions.image,
  });

  const enhancedTheme = {
    background_color: theme.background_color || '#ffffff',
    primary_color: theme.primary_color || '#1f2937',
    text_color: theme.text_color || '#374151',
    accent_color: theme.accent_color || '#3b82f6',
    heading_font: theme.heading_font || 'Inter, system-ui, sans-serif',
    body_font: theme.body_font || 'Inter, system-ui, sans-serif',
    ...theme,
  };

  if (slide.title && positions.title) {
    const titlePos = positions.title;
    elements.push(createTextElement({
      id: `title-${slide.slideNumber || uuidv4()}`,
      text: slide.title,
      x: convertPercentageToPixels(titlePos.x, CANVAS_CONFIG.WIDTH),
      y: convertPercentageToPixels(titlePos.y, CANVAS_CONFIG.HEIGHT),
      width: convertPercentageToPixels(titlePos.w, CANVAS_CONFIG.WIDTH),
      height: convertPercentageToPixels(titlePos.h, CANVAS_CONFIG.HEIGHT),
      fontSize: layoutName === 'title-special' ? 84 : 56,
      fontFamily: enhancedTheme.heading_font,
      fill: enhancedTheme.primary_color,
      fontStyle: 'bold',
      align: layoutName === 'title-special' ? 'center' : 'left',
      verticalAlign: 'middle',
      lineHeight: 1.1,
      draggable: true,
      shadowColor: 'rgba(0, 0, 0, 0.1)',
      shadowBlur: 2,
      shadowOffsetX: 1,
      shadowOffsetY: 1,
    }));
  }

  if (slide.content && positions.content) {
    const contentPos = positions.content;
    const parsedContent = parseContentForUniformity(slide.content);
    const contentText = parsedContent.items.map((item: any) => {
      if (item.hasTitle && item.description) {
        return `${item.title}: ${item.description}`;
      }
      return item.title || item.description || '';
    }).join('\n');

    elements.push(createTextElement({
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
      align: 'left',
      verticalAlign: 'top',
      draggable: true,
      padding: 20,
    }));
  }

  if (slide.imageUrl && positions.image) {
    let cleanImageUrl = slide.imageUrl.trim();
    if (cleanImageUrl && !/^https?:\/\//i.test(cleanImageUrl)) {
      cleanImageUrl = `https://${cleanImageUrl}`;
    }

    let isValidUrl = false;
    try {
      new URL(cleanImageUrl);
      isValidUrl = true;
    } catch {
      console.warn('🖼️ Content-Parser: Invalid image URL:', slide.imageUrl);
    }

    if (isValidUrl) {
      const imagePos = positions.image;
      elements.push(createImageElement({
        id: `image-${slide.slideNumber || uuidv4()}`,
        src: cleanImageUrl,
        x: convertPercentageToPixels(imagePos.x, CANVAS_CONFIG.WIDTH),
        y: convertPercentageToPixels(imagePos.y, CANVAS_CONFIG.HEIGHT),
        width: convertPercentageToPixels(imagePos.w, CANVAS_CONFIG.WIDTH),
        height: convertPercentageToPixels(imagePos.h, CANVAS_CONFIG.HEIGHT),
        draggable: true,
        cornerRadius: 12,
        shadowColor: 'rgba(0, 0, 0, 0.15)',
        shadowBlur: 8,
        shadowOffsetX: 2,
        shadowOffsetY: 4,
      }));
    }
  }

  if (layoutName === 'multi-column' && Array.isArray(slide.content)) {
    slide.content.forEach((item: any, index: number) => {
      const contentPos = positions[`content${index}`];
      if (contentPos) {
        const contentText = parseContentText(item);
        elements.push(createTextElement({
          id: `content${index}-${slide.slideNumber || uuidv4()}`,
          text: contentText,
          x: convertPercentageToPixels(contentPos.x, CANVAS_CONFIG.WIDTH),
          y: convertPercentageToPixels(contentPos.y, CANVAS_CONFIG.HEIGHT),
          width: convertPercentageToPixels(contentPos.w, CANVAS_CONFIG.WIDTH),
          height: convertPercentageToPixels(contentPos.h, CANVAS_CONFIG.HEIGHT),
          fontSize: 28,
          lineHeight: 1.5,
          fontFamily: enhancedTheme.body_font,
          fill: enhancedTheme.text_color,
          align: 'left',
          verticalAlign: 'top',
          draggable: true,
          padding: 16,
        }));
      }
    });
  }

  if ((layoutName === 'zigzag-timeline' || layoutName === 'pyramid') && Array.isArray(slide.content)) {
    slide.content.forEach((item: any, index: number) => {
      const itemTextPos = positions[`item${index}T`];
      if (itemTextPos) {
        const itemText = parseContentForUniformity(item).items.map((i: any) => {
          if (i.hasTitle && i.description) {
            return `${i.title}: ${i.description}`;
          }
          return i.title || i.description || '';
        }).join('\n');

        elements.push(createTextElement({
          id: `timeline-${index}-${slide.slideNumber || uuidv4()}`,
          text: itemText,
          x: convertPercentageToPixels(itemTextPos.x, CANVAS_CONFIG.WIDTH),
          y: convertPercentageToPixels(itemTextPos.y, CANVAS_CONFIG.HEIGHT),
          width: convertPercentageToPixels(itemTextPos.w, CANVAS_CONFIG.WIDTH),
          height: convertPercentageToPixels(itemTextPos.h, CANVAS_CONFIG.HEIGHT),
          fontSize: 24,
          lineHeight: 1.4,
          fontFamily: enhancedTheme.body_font,
          fill: enhancedTheme.text_color,
          align: 'left',
          verticalAlign: 'top',
          draggable: true,
          padding: 12,
        }));
      }
    });
  }

  if (positions.line) {
    elements.push({
      id: `line-${slide.slideNumber || uuidv4()}`,
      type: ELEMENT_TYPES.SHAPE,
      shapeType: 'line',
      x: convertPercentageToPixels(positions.line.x, CANVAS_CONFIG.WIDTH),
      y: convertPercentageToPixels(positions.line.y, CANVAS_CONFIG.HEIGHT),
      width: convertPercentageToPixels(positions.line.w, CANVAS_CONFIG.WIDTH),
      height: convertPercentageToPixels(positions.line.h, CANVAS_CONFIG.HEIGHT),
      fill: enhancedTheme.primary_color,
      draggable: true,
    });
  }

  console.log('🎨 Content-Parser: Generated elements:', {
    totalElements: elements.length,
    elementTypes: elements.map(el => el.type),
    elementIds: elements.map(el => el.id),
  });

  return elements;
};

const convertPixelsToLayout = (pixels: {
  x: number;
  y: number;
  width: number;
  height: number;
}) => {
  return {
    x: pixels.x / CANVAS_CONFIG.WIDTH,
    y: pixels.y / CANVAS_CONFIG.HEIGHT,
    width: pixels.width / CANVAS_CONFIG.WIDTH,
    height: pixels.height / CANVAS_CONFIG.HEIGHT,
  };
};

export {
  parseContentText,
  convertPixelsToLayout,
  convertSlideToCanvasElements,
};