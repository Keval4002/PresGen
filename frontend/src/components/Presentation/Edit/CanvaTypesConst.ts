// --- Type Definitions ---
interface CanvasElementProps {
    id: string;
    type: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    [key: string]: any;
  }
  
  interface TextElementProps extends Partial<CanvasElementProps> {
    id: string;
    text: string;
    fontSize?: number;
    fontFamily?: string;
    fill?: string;
    align?: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'middle' | 'bottom';
    fontStyle?: string;
    lineHeight?: number;
  }
  
  interface ImageElementProps extends Partial<CanvasElementProps> {
    id: string;
    src: string;
  }
  
  interface ShapeElementProps extends Partial<CanvasElementProps> {
    id: string;
    shapeType?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  }
  
  // --- Constants ---
  const EDITOR_COLORS = {
    GUIDE: '#007BFF',
    SELECTION: '#007BFF',
  } as const;
  
  export const CANVAS_CONFIG = {
    WIDTH: 2560,
    HEIGHT: 1440,
    SNAP_THRESHOLD: 8,
    SELECTION_PADDING: 5,
    GUIDE_COLOR: EDITOR_COLORS.GUIDE,
    SELECTION_BOX_COLOR: EDITOR_COLORS.SELECTION,
    GUIDE_OPACITY: 0.9,
  } as const;
  
  export const ELEMENT_TYPES = {
    TEXT: 'text',
    IMAGE: 'image',
    SHAPE: 'shape'
  } as const;
  
  export const SHAPE_TYPES = {
    RECTANGLE: 'rectangle',
    CIRCLE: 'circle',
    ELLIPSE: 'ellipse',
    STAR: 'star',
    LINE: 'line',
    TRIANGLE: 'triangle'
  } as const;
  
  // --- Helper Functions ---
  export const createCanvasElement = ({
    id,
    type,
    x = 0,
    y = 0,
    width = 200,
    height = 50,
    ...props
  }: CanvasElementProps): CanvasElementProps => ({
    id,
    type,
    x,
    y,
    width,
    height,
    ...props
  });
  
  export const createTextElement = ({
    id,
    text,
    x,
    y,
    width,
    height,
    fontSize = 20,
    fontFamily = 'Arial',
    fill = '#000000',
    align = 'left',
    verticalAlign = 'top',
    fontStyle = 'normal',
    lineHeight = 1.2,
    ...props
  }: TextElementProps) => createCanvasElement({
    id,
    type: ELEMENT_TYPES.TEXT,
    text,
    x,
    y,
    width,
    height,
    fontSize,
    fontFamily,
    fill,
    align,
    verticalAlign,
    fontStyle,
    lineHeight,
    ...props
  });
  
  export const createImageElement = ({
    id,
    src,
    x,
    y,
    width,
    height,
    ...props
  }: ImageElementProps) => createCanvasElement({
    id,
    type: ELEMENT_TYPES.IMAGE,
    src,
    x,
    y,
    width,
    height,
    ...props
  });
  
  export const createShapeElement = ({
    id,
    shapeType = SHAPE_TYPES.RECTANGLE,
    x,
    y,
    width,
    height,
    fill = '#3B82F6',
    stroke = '#1E40AF',
    strokeWidth = 2,
    ...props
  }: ShapeElementProps) => createCanvasElement({
    id,
    type: ELEMENT_TYPES.SHAPE,
    shapeType,
    x,
    y,
    width,
    height,
    fill,
    stroke,
    strokeWidth,
    ...props
  });