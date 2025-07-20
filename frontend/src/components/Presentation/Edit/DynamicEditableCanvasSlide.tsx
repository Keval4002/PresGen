import dynamic from 'next/dynamic';

const DynamicEditableCanvasSlide = dynamic(
  () => import('../EditableCanvasSlide'),
  { ssr: false }
);

export default DynamicEditableCanvasSlide;