export interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  [key: string]: any;
}

export interface Slide {
  slideNumber: number;
  canvasElements: CanvasElement[];
  title?: string;
  content?: string;
  imageUrl?: string;
}

export interface Theme {
  background_color?: string;
  primary_color?: string;
  text_color?: string;
  accent_color?: string;
  [key: string]: any;
}

export interface SavedPresentationRendererProps {
  slide: Slide;
  theme: Theme;
} 