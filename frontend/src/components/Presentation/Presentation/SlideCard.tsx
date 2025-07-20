'use client';

import React, { useMemo, useState, useEffect } from 'react';
import DynamicLayoutRenderer from '../Presentation/Layout/DynamicLayoutRendered';
import { SmartLayoutManager } from '../utils/SmartLayoutManager';
import { IntelligentLayoutAnalyzer } from '../utils/IntelligentLayoutAnalyzer';

const smartLayoutManager = new SmartLayoutManager();
const intelligentAnalyzer = new IntelligentLayoutAnalyzer();

interface SlideData {
  [key: string]: any;
}

interface ThemeData {
  background_color: string;
  [key: string]: any;
}

interface SlideCardProps {
  slide: SlideData;
  theme: ThemeData;
  slideIndex: number;
  onScaleReport?: ((index: number, scale: number) => void) | null;
  onLayoutMeasure?: ((slideIndex: number, layout: any) => void) | null;
}

function SlideCard({ slide, theme, slideIndex, onScaleReport, onLayoutMeasure }: SlideCardProps) {
  // Remove hasMounted pattern from this component

    const finalLayout = useMemo(() => {
        const layoutConfig = intelligentAnalyzer.analyzeContent(slide, slideIndex);
        return smartLayoutManager.generatePositions(layoutConfig);
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