'use client';

import React, { useLayoutEffect, useRef, useState, useCallback, useId, ReactNode, useEffect } from 'react';

interface AdaptiveContentContainerProps {
  children: ReactNode;
  slideIndex: number;
  onMeasure: (index: number, scale: number) => void;
  uniqueKey: any;
}

function AdaptiveContentContainer({ children, slideIndex, onMeasure, uniqueKey }: AdaptiveContentContainerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [actualScale, setActualScale] = useState(1);
    const internalId = useId();
    const [hasMounted, setHasMounted] = useState(false);
    useEffect(() => { setHasMounted(true); }, []);

    const measureAndReport = useCallback(() => {
        const container = containerRef.current;
        const contentEl = contentRef.current;
        if (!container || !contentEl || container.clientHeight === 0) return;

        contentEl.style.transform = 'scale(1)';

        requestAnimationFrame(() => {
            if (!container || !contentEl) return;
            const { clientHeight: containerHeight, clientWidth: containerWidth } = container;
            const { scrollHeight: contentHeight, scrollWidth: contentWidth } = contentEl;

            let scale = 1;
            if (contentHeight > containerHeight || contentWidth > containerWidth) {
                const scaleY = containerHeight / contentHeight;
                const scaleX = containerWidth / contentWidth;
                scale = Math.min(scaleX, scaleY);
            }
            
            const finalScale = Math.max(scale, 0.4);
            setActualScale(finalScale);
            
            if (typeof onMeasure === 'function') {
                onMeasure(slideIndex, finalScale);
            }
        });
    }, [slideIndex, onMeasure]);

    useLayoutEffect(() => {
        const timeoutId = setTimeout(measureAndReport, 150);
        const resizeObserver = new ResizeObserver(measureAndReport);
        const currentContainer = containerRef.current;
        
        if (currentContainer) {
            resizeObserver.observe(currentContainer);
        }
        
        return () => {
            clearTimeout(timeoutId);
            resizeObserver.disconnect();
        };
    }, [measureAndReport, uniqueKey, internalId]);

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <div ref={contentRef} style={{ transform: `scale(${actualScale})`, transformOrigin: 'top left', transition: 'transform 0.2s ease-out', width: '100%' }}>
                {children}
            </div>
        </div>
    );
}

export default AdaptiveContentContainer;