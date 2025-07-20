'use client';

// import React, { useState } from 'react';
// import CollapsibleSection from './CollapsibleSection';

// --- Type Definitions ---
interface CanvasElement {
  id: string;
  type: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  text?: string;
  src?: string;
  bulleted?: boolean;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  opacity?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  [key: string]: any;
}

interface SlideData {
  title?: string;
  content?: string;
  canvasElements?: CanvasElement[];
  [key: string]: any;
}

interface PropertyPanelProps {
  selectedElement: CanvasElement | null;
  slide: SlideData;
  onUpdateElement: (id: string, newProps: Partial<CanvasElement>) => void;
  onUpdateSlide: (newSlide: SlideData) => void;
  iconOnly?: boolean;
}

// export default function PropertyPanel({
//   selectedElement,
//   slide,
//   onUpdateElement,
//   onUpdateSlide,
//   iconOnly = false,
// }: PropertyPanelProps) {
//   // const [openSection, setOpenSection] = useState<string | null>('Position');

//   // const handleUpdate = (props: Partial<CanvasElement>) => {
//   //   if (selectedElement) {
//   //     onUpdateElement(selectedElement.id, props);
//   //   }
//   // };

//   // const handlePositionChange = (axis: 'x' | 'y', value: string) =>
//   //   handleUpdate({ [axis]: parseInt(value) || 0 });

//   // const handleSizeChange = (dimension: 'width' | 'height', value: string) =>
//   //   handleUpdate({ [dimension]: parseInt(value) || 0 });

//   // const handleTextChange = (value: string) => handleUpdate({ text: value });

//   // const handleImageUrlChange = (value: string) =>
//   //   handleUpdate({ src: value });

//   // const handleBulletToggle = (checked: boolean) =>
//   //   handleUpdate({ bulleted: checked });

//   // const fontFamilies = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Impact'];

//   return (
//     <div className="property-panel w-full h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border border-blue-200 rounded-2xl shadow-lg flex flex-col animate-fadeIn overflow-y-auto">
//       <div className="bg-gradient-to-r from-blue-400 to-purple-400 text-white px-5 py-4 rounded-t-2xl flex items-center gap-3 border-b border-blue-200">
//         <svg className="w-7 h-7 text-white opacity-90" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4" /></svg>
//         <h2 className="text-lg font-bold tracking-wide drop-shadow">{selectedElement ? 'Element Properties' : 'No Selection'}</h2>
//       </div>
//       <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-sm text-gray-800 scrollbar-hide">
//         {selectedElement ? (
//           <div className="space-y-3">
//             {/* <CollapsibleSection
//               title={<span className="flex items-center gap-2"><svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 12h4" /><path d="M12 8v8" /></svg>Position</span>}
//               iconColor=""
//               isOpen={openSection === 'Position'}
//               onToggle={() => setOpenSection(openSection === 'Position' ? null : 'Position')}
//             >
//               <div className="grid grid-cols-2 gap-2">
//                 <div className="flex items-center gap-2">
//                   <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 12h16" /><polyline points="12,8 16,12 12,16" /></svg>
//                   <div className="flex-1">
//                     {!iconOnly && <label className="text-xs text-gray-500 mb-1 block">X</label>}
//                     <input
//                       type="number"
//                       value={selectedElement.x || 0}
//                       onChange={(e) => handlePositionChange('x', e.target.value)}
//                       className="w-full px-2 py-1 text-sm border border-blue-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
//                       placeholder="X position"
//                       title="X position"
//                     />
//                   </div>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16" /><polyline points="8,12 12,16 16,12" /></svg>
//                   <div className="flex-1">
//                     {!iconOnly && <label className="text-xs text-gray-500 mb-1 block">Y</label>}
//                     <input
//                       type="number"
//                       value={selectedElement.y || 0}
//                       onChange={(e) => handlePositionChange('y', e.target.value)}
//                       className="w-full px-2 py-1 text-sm border border-pink-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-pink-300"
//                       placeholder="Y position"
//                       title="Y position"
//                     />
//                   </div>
//                 </div>
//               </div>
//             </CollapsibleSection> */}
//             {/* <CollapsibleSection
//               title={<span className="flex items-center gap-2"><svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="18" height="10" x="3" y="7" rx="2" /><path d="M3 7V5a2 2 0 012-2h14a2 2 0 012 2v2" /></svg>Size</span>}
//               iconColor=""
//               isOpen={openSection === 'Size'}
//               onToggle={() => setOpenSection(openSection === 'Size' ? null : 'Size')}
//             >
//               <div className="grid grid-cols-2 gap-2">
//                 <div className="flex items-center gap-2">
//                   <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 12h16" /><rect x="4" y="10" width="16" height="4" rx="2" /></svg>
//                   <div className="flex-1">
//                     {!iconOnly && <label className="text-xs text-gray-500 mb-1 block">Width</label>}
//                     <input
//                       type="number"
//                       value={selectedElement.width || 0}
//                       onChange={(e) => handleSizeChange('width', e.target.value)}
//                       className="w-full px-2 py-1 text-sm border border-indigo-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
//                       placeholder="Width"
//                       title="Width"
//                     />
//                   </div>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16" /><rect x="10" y="6" width="4" height="12" rx="2" /></svg>
//                   <div className="flex-1">
//                     {!iconOnly && <label className="text-xs text-gray-500 mb-1 block">Height</label>}
//                     <input
//                       type="number"
//                       value={selectedElement.height || 0}
//                       onChange={(e) => handleSizeChange('height', e.target.value)}
//                       className="w-full px-2 py-1 text-sm border border-yellow-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-yellow-300"
//                       placeholder="Height"
//                       title="Height"
//                     />
//                   </div>
//                 </div>
//               </div>
//             </CollapsibleSection> */}
//             {/* <CollapsibleSection
//               title={<span className="flex items-center gap-2">{selectedElement.type === 'text' ? (<svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><text x="4" y="16" fontSize="16">T</text></svg>) : (<svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="18" height="14" x="3" y="5" rx="2" /></svg>)}{selectedElement.type === 'text' ? 'Text' : selectedElement.type === 'image' ? 'Image' : 'Content'}</span>}
//               iconColor=""
//               isOpen={openSection === 'Content'}
//               onToggle={() => setOpenSection(openSection === 'Content' ? null : 'Content')}
//             >
//               {selectedElement.type === 'text' && (
//                 <>
//                   <div className="flex items-center gap-2">
//                     <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><text x="4" y="16" fontSize="16">T</text></svg>
//                     <div className="flex-1">
//                       {!iconOnly && <label className="block text-xs text-gray-500 mb-1">Text Content</label>}
//                       <textarea
//                         value={selectedElement.text || ''}
//                         onChange={(e) => handleTextChange(e.target.value)}
//                         className="w-full px-2 py-1 text-sm border rounded bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
//                         rows={3}
//                         placeholder="Enter text content"
//                         title="Text Content"
//                       />
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><text x="4" y="16" fontSize="16">A</text></svg>
//                     <div className="flex-1">
//                       {!iconOnly && <label className="text-xs text-gray-500 mb-1 block">Font Size</label>}
//                       <input
//                         type="number"
//                         value={selectedElement.fontSize || 20}
//                         onChange={(e) => handleUpdate({ fontSize: parseInt(e.target.value) || 0 })}
//                         className="w-full px-2 py-1 text-sm border rounded bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
//                         placeholder="Font size"
//                         title="Font size"
//                       />
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><text x="4" y="16" fontSize="16">F</text></svg>
//                     <div className="flex-1">
//                       {!iconOnly && <label className="text-xs text-gray-500 mb-1 block">Font Family</label>}
//                       <select
//                         value={selectedElement.fontFamily || 'Arial'}
//                         onChange={(e) => handleUpdate({ fontFamily: e.target.value })}
//                         className="w-full px-2 py-1 text-sm border rounded bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
//                         title="Font family"
//                       >
//                         {/* {fontFamilies.map((font) => (
//                           <option key={font} value={font}>
//                             {font}
//                           </option>
//                         ))} */}
//                       </select>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><rect x="8" y="8" width="8" height="8" rx="2" fill="currentColor" /></svg>
//                     <div className="flex-1">
//                       {!iconOnly && <label className="text-xs text-gray-500 mb-1 block">Text Color</label>}
//                       <input
//                         type="color"
//                         value={selectedElement.fill || '#000000'}
//                         onChange={(e) => handleUpdate({ fill: e.target.value })}
//                         className="w-full h-8 border rounded bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
//                         title="Text color"
//                       />
//                     </div>
//                   </div>
//                 </>
//               )}
//               {selectedElement.type === 'image' && (
//                 <div className="flex items-center gap-2">
//                   <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="18" height="14" x="3" y="5" rx="2" /></svg>
//                   <div className="flex-1">
//                     {!iconOnly && <label className="text-xs text-gray-500 mb-1 block">Image URL</label>}
//                     <input
//                       type="url"
//                       value={selectedElement.src || ''}
//                       onChange={(e) => handleUpdate({ src: e.target.value })}
//                       className="w-full px-2 py-1 text-sm border rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
//                       placeholder="Image URL"
//                       title="Image URL"
//                     />
//                   </div>
//                 </div>
//               )}
//             </CollapsibleSection> */}
//             {/* <CollapsibleSection
//               title={<span className="flex items-center gap-2"><svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Transform</span>}
//               iconColor=""
//               isOpen={openSection === 'Transform'}
//               onToggle={() => setOpenSection(openSection === 'Transform' ? null : 'Transform')}
//             >
//               <div className="space-y-2">
//                 <div className="flex items-center gap-2">
//                   <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 12m-8,0a8,8 0 1,0 16,0a8,8 0 1,0 -16,0" /><path d="M12 8v4l3 3" /></svg>
//                   <div className="flex-1">
//                     {!iconOnly && <label className="text-xs text-gray-500 mb-1 block">Opacity</label>}
//                     <input
//                       type="range"
//                       min="0"
//                       max="100"
//                       value={Math.round((selectedElement.opacity || 1) * 100)}
//                       onChange={(e) => handleUpdate({ opacity: parseFloat(e.target.value) / 100 })}
//                       className="w-full accent-indigo-500"
//                       placeholder="Opacity"
//                       title="Opacity"
//                     />
//                   </div>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v20M2 12h20" /><path d="M8 12a4 4 0 0 1 8 0" /></svg>
//                   <div className="flex-1">
//                     {!iconOnly && <label className="text-xs text-gray-500 mb-1 block">Rotation</label>}
//                     <input
//                       type="range"
//                       min="0"
//                       max="360"
//                       value={selectedElement.rotation || 0}
//                       onChange={(e) => handleUpdate({ rotation: parseInt(e.target.value) || 0 })}
//                       className="w-full accent-amber-400"
//                       placeholder="Rotation"
//                       title="Rotation"
//                     />
//                   </div>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <svg className="w-4 h-4 text-lime-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 12h16" /><path d="M12 4v16" /></svg>
//                   <div className="flex-1">
//                     {!iconOnly && <label className="text-xs text-gray-500 mb-1 block">Scale</label>}
//                     <input
//                       type="range"
//                       min="10"
//                       max="200"
//                       value={Math.round((selectedElement.scaleX || 1) * 100)}
//                       onChange={(e) => {
//                         const scale = parseFloat(e.target.value) / 100;
//                         handleUpdate({ scaleX: scale, scaleY: scale });
//                       }}
//                       className="w-full accent-lime-400"
//                       placeholder="Scale"
//                       title="Scale"
//                     />
//                   </div>
//                 </div>
//               </div>
//             </CollapsibleSection> */}
//           </div>
//         ) : (
//           <div className="text-center text-gray-400 text-xs py-8">Select an element to edit its properties.</div>
//         )}
//       </div>
//     </div>
//   );
// }
