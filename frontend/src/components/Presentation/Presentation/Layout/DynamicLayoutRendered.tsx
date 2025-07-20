'use client';

import React, { useRef, useLayoutEffect, useMemo, useCallback, ReactNode, useState, useEffect } from 'react';
import AdaptiveContentContainer from '../../utils/AdaptiveContentContainer';
import { parseContentForUniformity, generateUnifiedThemeStyles, FIXED_FONT_SIZES, IParsedContentItem } from '../../utils/UnifiedContentProcessor';
import SlideContent from '../SlideContent';

// --- Type Definitions ---
interface Coordinate {
  x: number; y: number; w: number; h: number;
}
interface LayoutPositions {
  [key: string]: Coordinate | undefined;
}
interface Layout {
  name: string;
  positions: LayoutPositions;
}
interface SlideData {
  content: any;
  title?: string;
  imageUrl?: string;
}
interface ThemeData {
  [key: string]: any;
}
interface DynamicLayoutRendererProps {
  slide: SlideData;
  theme: ThemeData;
  layout: Layout;
  slideIndex: number;
  onLayoutMeasure?: ((slideIndex: number, layout: any) => void) | null;
  onScaleReport?: ((index: number, scale: number) => void) | null;
}

// --- Helper Functions ---
const toCss = (coords: Coordinate): React.CSSProperties => ({ position: 'absolute', left: `${coords.x * 100}%`, top: `${coords.y * 100}%`, width: `${coords.w * 100}%`, height: `${coords.h * 100}%` });

// --- Component ---
function DynamicLayoutRenderer({ slide, theme, layout, slideIndex, onLayoutMeasure, onScaleReport }: DynamicLayoutRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const elementRefs = useRef<Record<string, HTMLElement>>({});
  
  const parsedContent = useMemo(() => parseContentForUniformity(slide.content), [slide.content]);
  const unifiedTheme = useMemo(() => generateUnifiedThemeStyles(theme), [theme]);
  const { name: layoutName, positions } = layout;

  useLayoutEffect(() => {
      if (!onLayoutMeasure) return;
      let animationFrameId: number;
      const measureLayout = () => {
          const container = containerRef.current;
          if (!container || container.clientWidth === 0) {
              animationFrameId = requestAnimationFrame(measureLayout);
              return;
          }
          const containerRect = container.getBoundingClientRect();
          const expectedKeys = Object.keys(positions).filter(k => positions[k]);
          const measuredLayout: Record<string, any> = {};

          for (const key of expectedKeys) {
              const el = elementRefs.current[key];
              if (el) {
                  const rect = el.getBoundingClientRect();
                  measuredLayout[key] = {
                      x: (rect.left - containerRect.left) / containerRect.width,
                      y: (rect.top - containerRect.top) / containerRect.height,
                      w: rect.width / containerRect.width,
                      h: rect.height / containerRect.height,
                  };
              }
          }
          if (Object.keys(measuredLayout).length >= expectedKeys.length) {
              onLayoutMeasure(slideIndex, measuredLayout);
          } else {
              animationFrameId = requestAnimationFrame(measureLayout);
          }
      };
      animationFrameId = requestAnimationFrame(measureLayout);
      return () => cancelAnimationFrame(animationFrameId);
  }, [slideIndex, onLayoutMeasure, positions]);

  const createRef = useCallback((key: string, el: HTMLElement | null) => { if (el) { elementRefs.current[key] = el; } }, []);
  
  const renderTitle = (): ReactNode => {
      if (!positions.title) return null;
      const isTitleOnly = layoutName === 'title-special';
      const titleFontSize = isTitleOnly ? FIXED_FONT_SIZES.TITLE_SLIDE : FIXED_FONT_SIZES.TITLE_NORMAL;
      
      return (
          <div ref={(el) => createRef('title', el)} style={{ ...toCss(positions.title), display: 'flex', alignItems: isTitleOnly ? 'center' : 'flex-start', justifyContent: 'center', padding: '0 0.5rem' }}>
              <h3 style={{ fontFamily: unifiedTheme.headingFont, color: unifiedTheme.primary, fontWeight: 900, fontSize: `${titleFontSize}px`, textAlign: isTitleOnly ? 'center' : 'left', width: '100%', margin: 0, lineHeight: 1.2, wordWrap: 'break-word' }}>{slide.title}</h3>
          </div>
      );
  };

  const renderImage = (): ReactNode => {
      if (!positions.image || !slide.imageUrl) return null;
      return (
          <div ref={(el) => createRef('image', el)} style={{ ...toCss(positions.image), display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}><img src={slide.imageUrl} alt={slide.title || ''} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /></div>
      );
  };

  const renderContentBlock = (items: IParsedContentItem[], key: string): ReactNode => (
      positions[key] ? (
          <div ref={(el) => createRef(key, el)} style={{ ...toCss(positions[key]!), overflow: 'hidden', padding: '0.5rem' }}>
              <AdaptiveContentContainer onMeasure={onScaleReport!} slideIndex={slideIndex} uniqueKey={key}>
                  <SlideContent formattedItems={items} theme={{
                      body_font: theme.body_font || 'Inter',
                      text_color: theme.text_color || '#374151',
                      primary_color: theme.primary_color || '#1f2937',
                  }} />
              </AdaptiveContentContainer>
          </div>
      ) : null
  );

  const renderTimelineItems = (): ReactNode[] => {
      const isTimeline = layoutName === 'zigzag-timeline' || layoutName === 'pyramid';
      if (!isTimeline) return [];
      
      return parsedContent.items.map((item, i) => (
          <React.Fragment key={`timeline-item-${i}`}>
              {positions[`item${i}C`] && (
                  <div ref={(el) => createRef(`item${i}C`, el)} style={{ ...toCss(positions[`item${i}C`]!), display: 'flex', alignItems: 'center', justifyContent: 'center', background: unifiedTheme.primary, color: unifiedTheme.background, borderRadius: '50%', zIndex: 2, fontSize: `${FIXED_FONT_SIZES.CONTENT_TIMELINE}px`, fontWeight: 'bold' }}>{i + 1}</div>
              )}
              {positions[`item${i}T`] && (
                  <div ref={(el) => createRef(`item${i}T`, el)} style={{ ...toCss(positions[`item${i}T`]!), display: 'flex', alignItems: 'center', zIndex: 1, padding: '0.5rem' }}>
                      <AdaptiveContentContainer onMeasure={onScaleReport!} slideIndex={slideIndex} uniqueKey={`timeline-${i}`}>
                          <SlideContent formattedItems={[item]} theme={theme} />
                      </AdaptiveContentContainer>
                  </div>
              )}
          </React.Fragment>
      ));
  };

  return (
      <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }} data-layout-name={layoutName}>
          {renderTitle()}
          {renderImage()}
          {positions.line && (<div ref={(el) => createRef('line', el)} style={{ ...toCss(positions.line), background: unifiedTheme.primary, zIndex: 1 }} />)}
          {positions.content && renderContentBlock(parsedContent.items, 'content')}
          {layoutName === 'multi-column' && parsedContent.items.map((item, i) => positions[`content${i}`] && renderContentBlock([item], `content${i}`))}
          {renderTimelineItems()}
      </div>
  );
}

export default DynamicLayoutRenderer;