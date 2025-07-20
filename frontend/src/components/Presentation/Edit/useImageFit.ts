'use client';

import { useState, useEffect } from 'react';
import useImage from 'use-image';

// --- Type Definitions ---
interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CalculatedImageProps {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UseImageFitReturn {
  image: HTMLImageElement | undefined;
  props: CalculatedImageProps | null;
}

// --- Custom Hook ---
const useImageFit = (src: string, boundingBox: BoundingBox): UseImageFitReturn => {
  const [image] = useImage(src, 'anonymous');
  const [calculatedProps, setCalculatedProps] = useState<CalculatedImageProps | null>(null);

  useEffect(() => {
    if (image && boundingBox) {
      const { width: boxWidth, height: boxHeight } = boundingBox;
      const { width: imgWidth, height: imgHeight } = image;

      const boxAspect = boxWidth / boxHeight;
      const imgAspect = imgWidth / imgHeight;

      let finalWidth: number, finalHeight: number, finalX: number, finalY: number;

      if (imgAspect > boxAspect) {
        finalHeight = boxHeight;
        finalWidth = finalHeight * imgAspect;
        finalX = boundingBox.x - (finalWidth - boxWidth) / 2;
        finalY = boundingBox.y;
      } else {
        finalWidth = boxWidth;
        finalHeight = finalWidth / imgAspect;
        finalY = boundingBox.y - (finalHeight - boxHeight) / 2;
        finalX = boundingBox.x;
      }

      setCalculatedProps({
        x: finalX,
        y: finalY,
        width: finalWidth,
        height: finalHeight,
      });
    }
  }, [image, boundingBox]);

  return { image, props: calculatedProps };
};

export default useImageFit;