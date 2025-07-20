"use client";

import React, { useState, useEffect, forwardRef, useLayoutEffect } from 'react';
import { Stage, Layer } from 'react-konva';
import type Konva from 'konva'; // For type-only import of Konva namespace
import type { SavedPresentationRendererProps } from './types';

// Assumed paths to your other project files. Adjust if necessary.
import { CANVAS_CONFIG } from '../Edit/CanvaTypesConst';
import { CanvasTextElement, CanvasImageElement, CanvasShapeElement } from '../Edit/Canvas-Components';

// --- COMPONENT ---

const SavedPresentationRenderer = forwardRef<Konva.Stage, SavedPresentationRendererProps>(({ slide, theme }, ref) => {
  // Remove hasMounted pattern from this component
  const [canvasElements, setCanvasElements] = useState<CanvasElement[]>([]);
  const [canvasScale, setCanvasScale] = useState<number | null>(null);

  useEffect(() => {
    if (slide.canvasElements && slide.canvasElements.length > 0) {
      setCanvasElements(slide.canvasElements);
    } else {
      setCanvasElements([]);
    }
  }, [slide.canvasElements, slide.slideNumber, slide.title]);

  useLayoutEffect(() => {
    const calculateScale = () => {
      // Note: Relying on a generic class name can be fragile.
      // Passing a ref to the container element would be a more robust solution.
      const container = document.querySelector('.max-w-7xl');
      if (!container) return;

      const containerWidth = container.clientWidth - 128; // Accounting for horizontal padding
      const containerHeight = window.innerHeight * 0.7;
      
      const scaleX = containerWidth / CANVAS_CONFIG.WIDTH;
      const scaleY = containerHeight / CANVAS_CONFIG.HEIGHT;
      
      // Use the smaller scale to fit within bounds, with a max cap.
      const scale = Math.min(scaleX, scaleY, 1.2);
      setCanvasScale(scale);
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

  const renderCanvasElement = (element: CanvasElement) => {
    const viewModeElement = {
      ...element,
      draggable: false, // Ensure elements are not draggable in view mode
    };
    
    // Props passed to each canvas element component.
    const commonProps = {
      element: viewModeElement,
      isSelected: false,
      onUpdate: () => {}, // No-op in view mode
      onSelect: () => {}, // No-op in view mode
      onDragMove: () => {}, // No-op in view mode
      onDragEnd: () => {}, // No-op in view mode
    };

    switch (element.type) {
      case 'text':
        return <CanvasTextElement key={element.id} {...commonProps} />;
      case 'image':
        return <CanvasImageElement key={element.id} {...commonProps} />;
      case 'shape':
        return <CanvasShapeElement key={element.id} {...commonProps} />;
      default:
        return null;
    }
  };

  // Provide default values for theme colors to prevent rendering errors
  const enhancedTheme = {
    background_color: theme.background_color || '#ffffff',
    primary_color: theme.primary_color || '#1f2937',
    text_color: theme.text_color || '#374151',
    accent_color: theme.accent_color || '#3b82f6',
    ...theme
  };

  return (
    <div className="relative w-full">
      <div className="flex justify-center items-center w-full py-8">
        <div className="relative flex flex-col items-center">
          {canvasScale !== null && (
            <div 
              className="border-2 border-gray-300 rounded-lg overflow-hidden shadow-2xl"
              style={{
                width: `${CANVAS_CONFIG.WIDTH * canvasScale}px`,
                height: `${CANVAS_CONFIG.HEIGHT * canvasScale}px`,
                minWidth: '320px',
                maxWidth: '100%',
                maxHeight: '80vh',
                backgroundColor: enhancedTheme.background_color,
              }}
            >
              {canvasElements.length > 0 ? (
                <Stage
                  ref={ref}
                  width={CANVAS_CONFIG.WIDTH}
                  height={CANVAS_CONFIG.HEIGHT}
                  scaleX={canvasScale}
                  scaleY={canvasScale}
                  style={{ 
                    backgroundColor: enhancedTheme.background_color,
                    width: '100%',
                    height: '100%',
                  }}
                >
                  <Layer>
                    {canvasElements.map(renderCanvasElement)}
                  </Layer>
                </Stage>
              ) : (
                <div 
                  className="w-full h-full flex flex-col justify-center items-center p-8"
                  style={{ backgroundColor: enhancedTheme.background_color }}
                >
                  <div className="text-center max-w-5xl w-full mx-auto">
                    <h2 
                      className="text-3xl font-bold mb-4"
                      style={{ color: enhancedTheme.primary_color }}
                    >
                      {slide.title || 'Untitled Slide'}
                    </h2>
                    {slide.content && (
                      <div 
                        className="text-lg leading-relaxed max-w-5xl w-full mx-auto"
                        style={{ color: enhancedTheme.text_color }}
                      >
                        {slide.content}
                      </div>
                    )}
                    {slide.imageUrl && (
                      <div className="mt-6 flex justify-center">
                        <img 
                          src={slide.imageUrl} 
                          alt={slide.title || 'Slide image'}
                          className="max-w-4xl w-full max-h-64 object-contain rounded-lg shadow-lg"
                        />
                      </div>
                    )}
                    {/* Only show this message if there's no other content */}
                    {!slide.content && !slide.imageUrl && (
                        <div className="mt-4 text-sm text-gray-500">
                           No canvas elements to display for this slide.
                        </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// Setting a display name for better debugging in React DevTools
SavedPresentationRenderer.displayName = 'SavedPresentationRenderer';

export default SavedPresentationRenderer;