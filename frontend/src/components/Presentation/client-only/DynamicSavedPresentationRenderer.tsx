import dynamic from 'next/dynamic';

const DynamicSavedPresentationRenderer = dynamic(
  () => import('./SavedPresentationRenderer'),
  { ssr: false }
);

export default DynamicSavedPresentationRenderer;