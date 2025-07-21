'use client';

import React, { useMemo } from 'react';
import DynamicLayoutRenderer from '../Presentation/Layout/DynamicLayoutRendered';
import { SmartLayoutManager, GeneratedLayout, LayoutConfig } from '../utils/SmartLayoutManager';
import { IntelligentLayoutAnalyzer } from '../utils/IntelligentLayoutAnalyzer';

const smartLayoutManager = new SmartLayoutManager();
const intelligentAnalyzer = new IntelligentLayoutAnalyzer();

// --- Type Definitions (copied from DynamicLayoutRendered) ---
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
  type: string;
  content: any;
  title?: string;
  imageUrl?: string;
}
interface ThemeData {
  [key: string]: any;
}

interface SlideCardProps {
  slide: SlideData;
  theme: ThemeData;
  slideIndex: number;
  onScaleReport?: ((index: number, scale: number) => void) | null;
  onLayoutMeasure?: ((slideIndex: number, layout: Layout) => void) | null;
}

// @ts-ignore
function SlideCard({ slide, theme, slideIndex, onScaleReport, onLayoutMeasure }: SlideCardProps): JSX.Element {
  const finalLayout: Layout = useMemo(() => {
    const layoutConfig: LayoutConfig = intelligentAnalyzer.analyzeContent(slide, slideIndex);
    const generated = smartLayoutManager.generatePositions(layoutConfig);
    // Remove nulls from positions to match type
    const filteredPositions: LayoutPositions = {};
    Object.entries(generated.positions).forEach(([k, v]) => {
      if (v !== null && v !== undefined) filteredPositions[k] = v;
    });
    return { name: generated.name, positions: filteredPositions };
  }, [slide, slideIndex]);

  return (
    <div
      className="w-full border-0 shadow-2xl relative overflow-hidden bg-white aspect-[16/9]"
      style={{ backgroundColor: theme.background_color }}
      data-layout-name={finalLayout.name}
    >
      <DynamicLayoutRenderer
        slide={slide}
        theme={theme}
        layout={finalLayout}
        slideIndex={slideIndex}
        onLayoutMeasure={onLayoutMeasure}
        onScaleReport={onScaleReport}
      />
    </div>
  );
}

export default SlideCard;