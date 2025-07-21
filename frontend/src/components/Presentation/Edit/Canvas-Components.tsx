"use client";

import React, { useRef, useState, useEffect, FC } from "react";
import { Text, Image as KonvaImage, Rect, Line, Circle, Ellipse, Star, Group, Path } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type Konva from 'konva';
import ReactDOM from 'react-dom';

// Assumed paths to other project files. Adjust if necessary.
import { CANVAS_CONFIG } from "./CanvaTypesConst";
import { constrainElementToBounds, getSelectionBounds } from './Canvas-utilities';

// --- TYPE DEFINITIONS ---

// Base interface for all canvas elements
interface ElementBase {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  draggable?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  cornerRadius?: number;
}

// Specific element types
export interface TextElement extends ElementBase {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
  padding?: number;
  align?: 'left' | 'center' | 'right';
}

export interface ImageElement extends ElementBase {
  type: 'image';
  src?: string;
  fallbackAttempted?: boolean;
}

// Shape elements as a discriminated union
type Shape = 
  | { shapeType: 'rectangle' }
  | { shapeType: 'circle' }
  | { shapeType: 'ellipse' }
  | { shapeType: 'star', innerRadius?: number }
  | { shapeType: 'line', points?: number[] };

export type ShapeElement = ElementBase & Shape & {
  type: 'shape';
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
};

// Union of all possible canvas elements
export type CanvasElement = TextElement | ImageElement | ShapeElement;

// Props for canvas components
interface CanvasElementProps<T extends CanvasElement> {
  element: T;
  isSelected: boolean;
  onUpdate: (id: string, newProps: Partial<T>, isTransient?: boolean) => void;
  onSelect: (id: string) => void;
  onDragMove: (element: T, newPos: { x: number; y: number }) => void;
  onDragEnd: () => void;
  canvasScale: number;
}

// --- HOOKS ---

/**
 * Custom hook to load an image asynchronously.
 * @param url The URL of the image to load.
 * @returns A tuple: [imageObject, isLoading, errorString].
 */
function useImage(url: string | undefined): [HTMLImageElement | null, boolean, string | null] {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    const image = new window.Image();
    image.crossOrigin = 'anonymous'; // Important for canvas security with external images
    
    image.onload = () => {
      setImg(image);
      setLoading(false);
      setError(null);
    };
    
    image.onerror = (e) => {
      console.error('❌ useImage: Failed to load image:', url, e);
      setError('Failed to load image');
      setLoading(false);
      setImg(null);
    };
    
    image.src = url;
    
    // Cleanup function
    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [url]);

  return [img, loading, error];
}

// --- Helper for handle positions ---
function getHandlePositions(bounds: { x: number; y: number; width: number; height: number }) {
  const { x, y, width, height } = bounds;
  return [
    { key: 'tl', x: x, y: y }, // top-left
    { key: 'tr', x: x + width, y: y }, // top-right
    { key: 'br', x: x + width, y: y + height }, // bottom-right
    { key: 'bl', x: x, y: y + height }, // bottom-left
  ];
}

// --- Resize logic ---
interface Dims {
  x: number;
  y: number;
  width: number;
  height: number;
}
interface Pointer {
  x: number;
  y: number;
}
function getResizedDims(
  handle: string,
  startDims: Dims,
  pointer: Pointer,
  minSize: number = 48
) {
  const { x, y, width, height } = startDims;
  const { x: px, y: py } = pointer;
  let newX = x, newY = y, newWidth = width, newHeight = height;
  switch (handle) {
    case 'tl': {
      const w = width + (x - px);
      const h = height + (y - py);
      if (w > minSize && h > minSize) {
        newWidth = w;
        newHeight = h;
        newX = px;
        newY = py;
      } else if (w > minSize) {
        newWidth = w;
        newX = px;
        newHeight = minSize;
        newY = y + height - minSize;
      } else if (h > minSize) {
        newHeight = h;
        newY = py;
        newWidth = minSize;
        newX = x + width - minSize;
      } else {
        newWidth = minSize;
        newHeight = minSize;
        newX = x + width - minSize;
        newY = y + height - minSize;
      }
      break;
    }
    case 'tm': {
      const h = height + (y - py);
      if (h > minSize) {
        newHeight = h;
        newY = py;
      } else {
        newHeight = minSize;
        newY = y + height - minSize;
      }
      break;
    }
    case 'tr': {
      const w = px - x;
      const h = height + (y - py);
      if (w > minSize && h > minSize) {
        newWidth = w;
        newHeight = h;
        newY = py;
      } else if (w > minSize) {
        newWidth = w;
        newHeight = minSize;
        newY = y + height - minSize;
      } else if (h > minSize) {
        newHeight = h;
        newWidth = minSize;
        newY = py;
      } else {
        newWidth = minSize;
        newHeight = minSize;
        newY = y + height - minSize;
      }
      break;
    }
    case 'mr': {
      const w = px - x;
      if (w > minSize) {
        newWidth = w;
      } else {
        newWidth = minSize;
      }
      break;
    }
    case 'br': {
      const w = px - x;
      const h = py - y;
      newWidth = w > minSize ? w : minSize;
      newHeight = h > minSize ? h : minSize;
      break;
    }
    case 'bm': {
      const h = py - y;
      if (h > minSize) {
        newHeight = h;
      } else {
        newHeight = minSize;
      }
      break;
    }
    case 'bl': {
      const w = width + (x - px);
      const h = py - y;
      if (w > minSize && h > minSize) {
        newWidth = w;
        newHeight = h;
        newX = px;
      } else if (w > minSize) {
        newWidth = w;
        newX = px;
        newHeight = minSize;
      } else if (h > minSize) {
        newHeight = h;
        newWidth = minSize;
        newX = x + width - minSize;
      } else {
        newWidth = minSize;
        newHeight = minSize;
        newX = x + width - minSize;
      }
      break;
    }
    case 'ml': {
      const w = width + (x - px);
      if (w > minSize) {
        newWidth = w;
        newX = px;
      } else {
        newWidth = minSize;
        newX = x + width - minSize;
      }
      break;
    }
  }
  return { x: newX, y: newY, width: newWidth, height: newHeight };
}

// --- Stylized selection box and handles ---
function SelectionWithHandles({ bounds, onHandleDrag, onHandleDragEnd, isStylized, rotation = 0, ...props }) {
  const handleRadius = 18;
  const handleStroke = '#fff';
  const handleStrokeWidth = 0;
  const handles = getHandlePositions(bounds);
  const handleCursor = {
    tl: 'nwse-resize',
    tr: 'nesw-resize',
    br: 'nwse-resize',
    bl: 'nesw-resize',
  };
  // Center of the box for rotation
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;
  return (
    <Group rotation={rotation} x={cx} y={cy} offsetX={bounds.width / 2} offsetY={bounds.height / 2} {...props}>
      <Rect
        x={0}
        y={0}
        width={bounds.width}
        height={bounds.height}
        stroke="#3B82F6"
        strokeWidth={4}
        dash={undefined}
        shadowBlur={0}
        shadowColor={undefined}
        fill="transparent"
        listening={true}
        cornerRadius={16}
        // @ts-ignore
        perfectDrawEnabled={false}
        {...props}
      />
      {handles.map((h) => (
        <Circle
          key={h.key}
          x={h.x - bounds.x}
          y={h.y - bounds.y}
          radius={handleRadius}
          fill="#fff"
          stroke={handleStroke}
          strokeWidth={handleStrokeWidth}
          draggable
          dragOnTop
          onDragMove={e => onHandleDrag && onHandleDrag(h.key, e)}
          onDragEnd={e => onHandleDragEnd && onHandleDragEnd(h.key, e)}
          listening={!!onHandleDrag}
          shadowBlur={16}
          shadowColor={'rgba(0,0,0,0.45)'}
          onMouseEnter={e => { const stage = e.target.getStage(); if (stage) stage.container().style.cursor = handleCursor[h.key] || 'default'; }}
          onMouseLeave={e => { const stage = e.target.getStage(); if (stage) stage.container().style.cursor = 'default'; }}
          // @ts-ignore
          perfectDrawEnabled={false}
        />
      ))}
    </Group>
  );
}

// --- CANVAS COMPONENTS ---

interface CanvasTextElementProps extends CanvasElementProps<TextElement> {
  editingTextId: string | null;
  editingTextValue: string;
  setEditingTextId: (id: string | null) => void;
  setEditingTextValue: (value: string) => void;
  onTextEditStart: (id: string, value: string) => void;
  onTextEditCommit: (id: string) => void;
  onTextEditCancel: () => void;
  textRef?: React.RefObject<any>;
}

export const CanvasTextElement: FC<CanvasTextElementProps> = ({ element, isSelected, onUpdate, onSelect, onDragMove, onDragEnd, canvasScale, editingTextId, editingTextValue, setEditingTextId, setEditingTextValue, onTextEditStart, onTextEditCommit, onTextEditCancel, textRef }) => {
  const localTextRef = useRef<Konva.Text | null>(null);
  const textNodeRef = textRef || localTextRef;
  const [resizing, setResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState(null);
  const [resizeHandle, setResizeHandle] = useState(null);
  const editing = editingTextId === element.id;

  // Helper to get absolute position of the text element on the page
  const getTextAbsolutePosition = () => {
    if (!textNodeRef.current) return { left: 0, top: 0 };
    const stage = textNodeRef.current.getStage();
    const box = textNodeRef.current.getClientRect({ relativeTo: stage });
    const stageBox = stage.container().getBoundingClientRect();
    return {
      left: stageBox.left + box.x,
      top: stageBox.top + box.y,
      width: box.width,
      height: box.height,
      rotation: element.rotation || 0,
      fontSize: element.fontSize,
      fontFamily: element.fontFamily,
      color: element.fill,
    };
  };

  const handleDblClick = (e) => {
    if (isSelected) {
      console.log('Double-click detected for text element', element.id);
      onTextEditStart(element.id, element.text);
    }
  };

  const handleEditBlur = () => {
    onTextEditCommit(element.id);
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onTextEditCommit(element.id);
    } else if (e.key === 'Escape') {
      onTextEditCancel();
    }
  };

  useEffect(() => {
    if (textNodeRef.current) {
      const newWidth = textNodeRef.current.width();
      const newHeight = textNodeRef.current.height();
      if (newWidth !== element.width || newHeight !== element.height) {
        onUpdate(element.id, { width: newWidth, height: newHeight } as Partial<TextElement>, true);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [element.text, element.fontSize, element.width]);

  // Always use element directly for selection box
  const selectionBounds = getSelectionBounds(element);

  const handleHandleDrag = (handle, e) => {
    if (!resizeStart) {
      setResizeStart({ ...element });
      setResizeHandle(handle);
      setResizing(true);
      return;
    }
    let pointer = e.target.getStage().getPointerPosition();
    if (canvasScale && canvasScale !== 1) {
      pointer = { x: pointer.x / canvasScale, y: pointer.y / canvasScale };
    }
    const newDims = getResizedDims(handle, resizeStart, pointer);
    onUpdate(element.id, newDims, true); // transient update
  };
  const handleHandleDragEnd = (handle, e) => {
    setResizing(false);
    setResizeStart(null);
    setResizeHandle(null);
    let pointer = e.target.getStage().getPointerPosition();
    if (canvasScale && canvasScale !== 1) {
      pointer = { x: pointer.x / canvasScale, y: pointer.y / canvasScale };
    }
    const newDims = getResizedDims(handle, resizeStart || element, pointer);
    onUpdate(element.id, newDims, false); // commit for undo/redo
  };

  const { id, type, draggable, ...konvaProps } = element;

  return (
    <>
      <Text
        ref={textNodeRef}
        {...konvaProps}
        x={element.x + element.width / 2}
        y={element.y + element.height / 2}
        offsetX={element.width / 2}
        offsetY={element.height / 2}
        draggable={draggable !== false && !resizing}
        onClick={() => onSelect(id)}
        onTap={() => onSelect(id)}
        onDblClick={handleDblClick}
        text={editing ? editingTextValue : element.text}
        onDragMove={(e: KonvaEventObject<DragEvent>) => {
          if (!resizing) {
            if (!isSelected) onSelect(id);
            const newPos = {
              x: e.target.x() - element.width / 2,
              y: e.target.y() - element.height / 2
            };
            onDragMove(element, newPos);
          }
        }}
        onDragEnd={(e: KonvaEventObject<DragEvent>) => {
          if (!resizing) {
            const constrained = constrainElementToBounds(
              element,
              e.target.x() - element.width / 2,
              e.target.y() - element.height / 2
            );
            onUpdate(id, { ...constrained, width: element.width, height: element.height } as Partial<TextElement>);
            onDragEnd();
          }
        }}
      />
      {isSelected && (
        <SelectionWithHandles
          bounds={selectionBounds}
          onHandleDrag={handleHandleDrag}
          onHandleDragEnd={handleHandleDragEnd}
          isStylized
          rotation={element.rotation || 0}
          onDblClick={() => onTextEditStart(element.id, element.text)}
        />
      )}
    </>
  );
};

export const CanvasImageElement: FC<CanvasElementProps<ImageElement>> = ({ element, isSelected, onUpdate, onSelect, onDragMove, onDragEnd, canvasScale }) => {
  const [img, loading, error] = useImage(element.src);
  const selectionBounds = getSelectionBounds(element);
  const [resizing, setResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState(null);
  const [resizeHandle, setResizeHandle] = useState(null);

  const { id, type, src, draggable, fallbackAttempted, ...konvaProps } = element;

  const getFallbackImageUrl = () => {
    const colors = ['FF6B6B', '4ECDC4', '45B7D1', '96CEB4', 'FFEAA7', 'DDA0DD', '98D8C8', 'F7DC6F'];
    const colorIndex = (id?.length || 0) % colors.length;
    const bgColor = colors[colorIndex];
    const width = Math.round(element.width || 400);
    const height = Math.round(element.height || 300);
    return `https://via.placeholder.com/${width}x${height}/${bgColor}/ffffff?text=Image+Error`;
  };

  if (loading || error || !img) {
    const shouldTryFallback = error && !img && !fallbackAttempted;
    if (shouldTryFallback) {
      onUpdate(id, { 
        src: getFallbackImageUrl(), 
        fallbackAttempted: true 
      } as Partial<ImageElement>);
    }
    return (
      <>
        <Rect
          {...konvaProps}
          x={element.x + element.width / 2}
          y={element.y + element.height / 2}
          offsetX={element.width / 2}
          offsetY={element.height / 2}
          fill={loading ? '#f3f4f6' : '#fee2e2'}
          stroke={loading ? '#d1d5db' : '#fca5a5'}
          strokeWidth={2}
          dash={loading ? [5, 5] : undefined}
          draggable={draggable !== false}
          onClick={() => onSelect(id)}
          onTap={() => onSelect(id)}
          onDragMove={(e) => {
            if (!resizing) {
              if (!isSelected) onSelect(id);
              const newPos = {
                x: e.target.x() - element.width / 2,
                y: e.target.y() - element.height / 2
              };
              onDragMove(element, newPos);
            }
          }}
          onDragEnd={(e) => { if (!resizing) {
            const constrained = constrainElementToBounds(
              element,
              e.target.x() - element.width / 2,
              e.target.y() - element.height / 2
            );
            onUpdate(id, { ...constrained, width: element.width, height: element.height } as Partial<ImageElement>);
            onDragEnd();
          }}}
        />
        {isSelected && <Rect {...selectionBounds} stroke={CANVAS_CONFIG.SELECTION_BOX_COLOR} strokeWidth={2} listening={false} cornerRadius={element.cornerRadius} />}
      </>
    );
  }

  // For drag/move, render image at element.x, element.y with element.width/element.height
  // Only use object-fit/contain logic for resizing (not for movement)
  const handleHandleDrag = (handle, e) => {
    if (!resizeStart) {
      setResizeStart({ ...element });
      setResizeHandle(handle);
      setResizing(true);
      return;
    }
    let pointer = e.target.getStage().getPointerPosition();
    if (canvasScale && canvasScale !== 1) {
      pointer = { x: pointer.x / canvasScale, y: pointer.y / canvasScale };
    }
    const newDims = getResizedDims(handle, resizeStart, pointer);
    onUpdate(element.id, newDims, true);
  };
  const handleHandleDragEnd = (handle, e) => {
    setResizing(false);
    setResizeStart(null);
    setResizeHandle(null);
    let pointer = e.target.getStage().getPointerPosition();
    if (canvasScale && canvasScale !== 1) {
      pointer = { x: pointer.x / canvasScale, y: pointer.y / canvasScale };
    }
    const newDims = getResizedDims(handle, resizeStart || element, pointer);
    onUpdate(element.id, newDims, false);
  };

  const renderImage = () => {
    return (
      <KonvaImage
        {...konvaProps}
        x={element.x + element.width / 2}
        y={element.y + element.height / 2}
        offsetX={element.width / 2}
        offsetY={element.height / 2}
        image={img}
        draggable={draggable !== false && !resizing}
        onClick={() => onSelect(id)}
        onTap={() => onSelect(id)}
        onDragMove={(e) => {
          if (!resizing) {
            if (!isSelected) onSelect(id);
            const newPos = {
              x: e.target.x() - element.width / 2,
              y: e.target.y() - element.height / 2
            };
            onDragMove(element, newPos);
          }
        }}
        onDragEnd={(e) => { if (!resizing) { 
          const constrained = constrainElementToBounds(
            element,
            e.target.x() - element.width / 2,
            e.target.y() - element.height / 2
          );
          onUpdate(id, { ...constrained, width: element.width, height: element.height } as Partial<ImageElement>); 
          onDragEnd(); 
        }}}
      />
    );
  };

  return (
    <>
      {renderImage()}
      {isSelected && (
        <SelectionWithHandles
          bounds={selectionBounds}
          onHandleDrag={handleHandleDrag}
          onHandleDragEnd={handleHandleDragEnd}
          isStylized
          rotation={element.rotation || 0}
        />
      )}
    </>
  );
};

export const CanvasShapeElement: FC<CanvasElementProps<ShapeElement>> = ({ element, isSelected, onUpdate, onSelect, onDragMove, onDragEnd, canvasScale }) => {
  const selectionBounds = getSelectionBounds(element);
  const { id, type, shapeType, draggable, ...commonProps } = element;
  const [resizing, setResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState(null);
  const [resizeHandle, setResizeHandle] = useState(null);

  const handleHandleDrag = (handle, e) => {
    if (!resizeStart) {
      setResizeStart({ ...element });
      setResizeHandle(handle);
      setResizing(true);
      return;
    }
    let pointer = e.target.getStage().getPointerPosition();
    if (canvasScale && canvasScale !== 1) {
      pointer = { x: pointer.x / canvasScale, y: pointer.y / canvasScale };
    }
    const newDims = getResizedDims(handle, resizeStart, pointer);
    onUpdate(element.id, newDims, true);
  };
  const handleHandleDragEnd = (handle, e) => {
    setResizing(false);
    setResizeStart(null);
    setResizeHandle(null);
    let pointer = e.target.getStage().getPointerPosition();
    if (canvasScale && canvasScale !== 1) {
      pointer = { x: pointer.x / canvasScale, y: pointer.y / canvasScale };
    }
    const newDims = getResizedDims(handle, resizeStart || element, pointer);
    onUpdate(element.id, newDims, false);
  };
  
  const eventHandlers = {
    onClick: () => onSelect(id),
    onTap: () => onSelect(id),
    onDragMove: (e: KonvaEventObject<DragEvent>) => {
      if (!resizing) {
        if (!isSelected) onSelect(id);
        const newPos = {
          x: e.target.x() - element.width / 2,
          y: e.target.y() - element.height / 2
        };
        onDragMove(element, newPos);
      }
    },
    onDragEnd: (e: KonvaEventObject<DragEvent>) => {
      if (!resizing) {
        const constrained = constrainElementToBounds(
          element,
          e.target.x() - element.width / 2,
          e.target.y() - element.height / 2
        );
        onUpdate(id, { ...constrained, width: element.width, height: element.height } as Partial<ShapeElement>);
        onDragEnd();
      }
    },
  };

  const renderShape = () => {
    switch (element.shapeType) {
      case 'rectangle': return <Rect {...commonProps} {...eventHandlers} />;
      case 'circle': return <Circle {...commonProps} {...eventHandlers} />;
      case 'ellipse': return <Ellipse {...commonProps} radiusX={element.width / 2} radiusY={element.height / 2} x={element.x + (element.width / 2)} y={element.y + (element.height / 2)} {...eventHandlers} />;
      case 'star': return <Star {...commonProps} numPoints={5} innerRadius={element.innerRadius || 20} outerRadius={Math.max(element.width, element.height) / 2} x={element.x + (element.width / 2)} y={element.y + (element.height / 2)} {...eventHandlers} />;
      case 'line': return <Line {...commonProps} points={element.points || [0, 0, element.width || 100, 0]} {...eventHandlers} />;
      default: return <Rect {...commonProps} {...eventHandlers} />;
    }
  };

  return (
    <>
      {renderShape()}
      {isSelected && (
        <SelectionWithHandles
          bounds={selectionBounds}
          onHandleDrag={handleHandleDrag}
          onHandleDragEnd={handleHandleDragEnd}
          isStylized
          rotation={element.rotation || 0}
        />
      )}
    </>
  );
};

interface SnapGuidesProps {
  guides: {
    vertical: number[];
    horizontal: number[];
  };
}

export const SnapGuides: FC<SnapGuidesProps> = ({ guides }) => {
  const { WIDTH, HEIGHT, GUIDE_COLOR, GUIDE_OPACITY } = CANVAS_CONFIG;
  return (
    <>
      {guides.vertical.map((x, i) => (
        <Line
          key={`v-${i}`}
          points={[x, 0, x, HEIGHT]}
          stroke={GUIDE_COLOR}
          strokeWidth={1.5}
          opacity={GUIDE_OPACITY}
          listening={false}
        />
      ))}
      {guides.horizontal.map((y, i) => (
        <Line
          key={`h-${i}`}
          points={[0, y, WIDTH, y]}
          stroke={GUIDE_COLOR}
          strokeWidth={1.5}
          opacity={GUIDE_OPACITY}
          listening={false}
        />
      ))}
    </>
  );
};