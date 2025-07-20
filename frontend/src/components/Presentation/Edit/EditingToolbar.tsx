"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import Draggable from 'react-draggable';
import ColorPicker from 'react-best-gradient-color-picker';

// --- Type Definitions ---
interface CanvasElement {
  id: string;
  type: string;
  fontStyle?: string;
  fontFamily?: string;
  fontSize?: number;
  align?: string;
  opacity?: number;
  rotation?: number;
  scaleX?: number;
  [key: string]: any;
}

interface EditingToolbarProps {
  selectedElement: CanvasElement | null;
  onUpdateElement: (id: string, props: Partial<CanvasElement>) => void;
  onDeleteElement: (element: CanvasElement) => void;
  onDuplicateElement: (element: CanvasElement) => void;
  onBringToFront: (element: CanvasElement) => void;
  onSendToBack: (element: CanvasElement) => void;
  onAddText: () => void;
  onAddImage: () => void;
  onAddShape: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  orientation?: 'row' | 'column';
  iconOnly?: boolean;
  showColorPicker?: boolean;
  setShowColorPicker?: (v: boolean) => void;
  showRgbPicker?: boolean;
  setShowRgbPicker?: (v: boolean) => void;
}

// --- Component ---
export default function EditingToolbar({
  selectedElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onBringToFront,
  onSendToBack,
  onAddText,
  onAddImage,
  onAddShape,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  orientation = 'row',
  iconOnly = false,
  showColorPicker: showColorPickerProp,
  setShowColorPicker: setShowColorPickerProp,
  showRgbPicker: showRgbPickerProp,
  setShowRgbPicker: setShowRgbPickerProp,
}: EditingToolbarProps) {
  const [showColorPickerState, setShowColorPickerState] = useState(false);
  const [showRgbPickerState, setShowRgbPickerState] = useState(false);
  const showColorPicker = showColorPickerProp !== undefined ? showColorPickerProp : showColorPickerState;
  const setShowColorPicker = setShowColorPickerProp ? setShowColorPickerProp : setShowColorPickerState;
  const showRgbPicker = showRgbPickerProp !== undefined ? showRgbPickerProp : showRgbPickerState;
  const setShowRgbPicker = setShowRgbPickerProp ? setShowRgbPickerProp : setShowRgbPickerState;
  const colorButtonRef = useRef<HTMLButtonElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [colorPickerPos, setColorPickerPos] = useState<{top: number, left: number} | null>(null);

  useEffect(() => {
    if (showColorPicker && toolbarRef.current) {
      const rect = toolbarRef.current.getBoundingClientRect();
      const popupWidth = 224; // w-56 in px
      const popupHeight = 112; // estimate
      let top = rect.bottom + 16; // 16px below the toolbar
      let left = rect.left + rect.width / 2 - popupWidth / 2; // center horizontally to toolbar
      // Adjust if off bottom
      if (top + popupHeight > window.innerHeight) {
        top = window.innerHeight - popupHeight - 16;
      }
      // Adjust if off right
      if (left + popupWidth > window.innerWidth) {
        left = window.innerWidth - popupWidth - 16;
      }
      // Adjust if off left
      if (left < 0) {
        left = 16;
      }
      setColorPickerPos({ top, left });
    }
  }, [showColorPicker]);

  // --- Color Picker Popup Fix ---
  useEffect(() => {
    if (!showColorPicker) return;
    if (!colorButtonRef.current) return;
    const buttonRect = colorButtonRef.current.getBoundingClientRect();
    const popupWidth = 224; // w-56 in px
    const popupHeight = 220; // larger estimate for many colors
    let top = buttonRect.bottom + 8;
    let left = buttonRect.left;
    // Clamp to viewport
    if (top + popupHeight > window.innerHeight) {
      top = Math.max(8, window.innerHeight - popupHeight - 8);
    }
    if (left + popupWidth > window.innerWidth) {
      left = window.innerWidth - popupWidth - 8;
    }
    if (left < 8) left = 8;
    setColorPickerPos({ top, left });
  }, [showColorPicker]);

  const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72, 96];
  const fontFamilies = [
    "Arial",
    "Helvetica",
    "Times New Roman",
    "Georgia",
    "Verdana",
    "Trebuchet MS",
    "Impact",
    "Comic Sans MS",
    "Courier New",
    "Lucida Console",
  ];
  const colors = [
    "#000000",
    "#FFFFFF",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
    "#800080",
    "#008000",
    "#FFC0CB",
    "#A52A2A",
    "#808080",
    "#000080",
    "#800000",
  ];

  const handleUpdate = (props: Partial<CanvasElement>) => {
    if (selectedElement) {
      onUpdateElement(selectedElement.id, props);
    }
  };

  // --- Bold/Italic Simultaneous Fix ---
  const getFontStyle = () => selectedElement?.fontStyle || '';
  const isBold = getFontStyle().includes('bold');
  const isItalic = getFontStyle().includes('italic');
  const handleBoldToggle = () => {
    let style = getFontStyle().split(' ').filter(Boolean);
    if (isBold) style = style.filter(s => s !== 'bold');
    else style.push('bold');
    handleUpdate({ fontStyle: style.join(' ') || 'normal' });
  };
  const handleItalicToggle = () => {
    let style = getFontStyle().split(' ').filter(Boolean);
    if (isItalic) style = style.filter(s => s !== 'italic');
    else style.push('italic');
    handleUpdate({ fontStyle: style.join(' ') || 'normal' });
  };

  return (
    <div className="editing-toolbar w-full flex flex-row items-center gap-3 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border border-blue-200 rounded-xl shadow-lg p-3 overflow-x-auto whitespace-nowrap">
      <div
        className="flex flex-row items-center gap-3"
      >
        {/* Removed Add Text, Add Image, and Add Shape buttons */}
        {/* The rest of the toolbar remains unchanged */}
        {selectedElement && (
          <div className="flex items-center space-x-2 pl-4">
            <button
              onClick={() => onDuplicateElement(selectedElement)}
              className="p-2 bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200 focus:ring-2 focus:ring-yellow-300 transition"
              title="Duplicate"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" /><rect x="3" y="3" width="13" height="13" rx="2" /></svg>
              {!iconOnly && <span className="text-[11px] font-medium leading-tight">Dup</span>}
            </button>
            <button
              onClick={() => onBringToFront(selectedElement)}
              className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200 focus:ring-2 focus:ring-green-300 transition"
              title="Bring to Front"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 8h8v8H8z" /></svg>
              {!iconOnly && <span className="text-[11px] font-medium leading-tight">Front</span>}
            </button>
            <button
              onClick={() => onSendToBack(selectedElement)}
              className="p-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 focus:ring-2 focus:ring-gray-300 transition"
              title="Send to Back"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M16 16H8V8h8z" /></svg>
              {!iconOnly && <span className="text-[11px] font-medium leading-tight">Back</span>}
            </button>
            <button
              onClick={() => onDeleteElement(selectedElement)}
              className="p-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 focus:ring-2 focus:ring-red-300 transition"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              {!iconOnly && <span className="text-[11px] font-medium leading-tight">Del</span>}
            </button>
          </div>
        )}
        <div className="flex items-center space-x-2 pl-4">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-2 bg-white text-blue-700 rounded-full hover:bg-blue-100 focus:ring-2 focus:ring-blue-300 transition disabled:opacity-50"
            title="Undo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 14l-4-4 4-4" /><path d="M5 10h11a4 4 0 1 1 0 8h-1" /></svg>
            {!iconOnly && <span className="text-[11px] font-medium leading-tight">Undo</span>}
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-2 bg-white text-blue-700 rounded-full hover:bg-blue-100 focus:ring-2 focus:ring-blue-300 transition disabled:opacity-50"
            title="Redo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 10l4 4-4 4" /><path d="M19 14H8a4 4 0 1 1 0-8h1" /></svg>
            {!iconOnly && <span className="text-[11px] font-medium leading-tight">Redo</span>}
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 justify-center items-center w-full">
        <select
          value={selectedElement?.fontFamily || "Arial"}
          onChange={(e) => handleUpdate({ fontFamily: e.target.value })}
          className="px-2 py-1 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-300 transition"
          title="Font Family"
          disabled={selectedElement?.type !== "text"}
        >
          {fontFamilies.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={Math.round((selectedElement?.fontSize || 20) * (window.__canvasScale || 1))}
          onChange={(e) => {
            const scale = window.__canvasScale || 1;
            const newVisualSize = parseInt(e.target.value) || 0;
            const newFontSize = Math.round(newVisualSize / scale);
            onUpdateElement(selectedElement.id, { fontSize: newFontSize });
          }}
          className="px-2 py-1 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-300 transition"
          title="Font Size"
          disabled={selectedElement?.type !== "text"}
        />
        <button
          onClick={handleBoldToggle}
          className={`p-2 rounded-full text-blue-700 hover:bg-blue-100 focus:ring-2 focus:ring-blue-300 transition ${isBold ? "bg-blue-200" : "bg-white"}`}
          title="Bold"
          disabled={selectedElement?.type !== "text"}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M15.6 11.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 7.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" /></svg>
          {!iconOnly && <span className="text-[11px] font-medium leading-tight">Font</span>}
        </button>
        <button
          onClick={handleItalicToggle}
          className={`p-2 rounded-full text-blue-700 hover:bg-blue-100 focus:ring-2 focus:ring-blue-300 transition ${isItalic ? "bg-blue-200" : "bg-white"}`}
          title="Italic"
          disabled={selectedElement?.type !== "text"}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M10 4v3h2.21l-3.42 10H6v3h8v-3h-2.21l3.42-10H18V4z" /></svg>
          {!iconOnly && <span className="text-[11px] font-medium leading-tight">Size</span>}
        </button>
        {/* Color Picker Button */}
        <div className="relative">
          <button
            ref={colorButtonRef}
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-2 rounded-full text-pink-700 hover:bg-pink-100 focus:ring-2 focus:ring-pink-300 transition bg-white"
            title="Text Color"
            disabled={selectedElement?.type !== "text" && selectedElement?.type !== "shape"}
          >
            {/* Highly relatable palette icon with color dots */}
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 3.87 3.13 7 7 7h1v1c0 1.1.9 2 2 2s2-.9 2-2v-1h1c3.87 0 7-3.13 7-7 0-5.52-4.48-10-10-10zm-4 8c-.83 0-1.5-.67-1.5-1.5S7.17 7 8 7s1.5.67 1.5 1.5S8.83 10 8 10zm8 0c-.83 0-1.5-.67-1.5-1.5S15.17 7 16 7s1.5.67 1.5 1.5S16.83 10 16 10zm-4 4c-.83 0-1.5-.67-1.5-1.5S11.17 11 12 11s1.5.67 1.5 1.5S12.83 14 12 14zm0-8c-.83 0-1.5-.67-1.5-1.5S11.17 3 12 3s1.5.67 1.5 1.5S12.83 6 12 6z" fill="#F3F4F6"/>
              <circle cx="8" cy="8.5" r="1.2" fill="#F87171"/>
              <circle cx="16" cy="8.5" r="1.2" fill="#60A5FA"/>
              <circle cx="12" cy="13.5" r="1.2" fill="#34D399"/>
              <circle cx="12" cy="4.5" r="1" fill="#FBBF24"/>
            </svg>
            {!iconOnly && <span className="text-[11px] font-medium leading-tight">Color</span>}
          </button>
          {showColorPicker && colorPickerPos && typeof window !== 'undefined' && ReactDOM.createPortal(
            <div
              id="color-picker-popup"
              className="z-[9999] bg-white border border-gray-200 rounded-xl shadow-2xl p-2 w-56 flex flex-col gap-2 min-h-[48px] items-center justify-center fixed"
              style={{
                top: colorPickerPos.top,
                left: colorPickerPos.left,
                zIndex: 9999,
              }}
            >
              {/* Preset colors */}
              <div className="flex flex-wrap gap-2 justify-center w-full">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      if (selectedElement && (selectedElement.type === 'text' || selectedElement.type === 'shape')) {
                        handleUpdate({ fill: c });
                      }
                      setShowColorPicker(false);
                    }}
                    className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-sm hover:scale-110 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-transform"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
              {/* Custom color picker button */}
              <button
                id="color-picker-custom"
                className="w-full flex items-center justify-center gap-2 mt-3 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-100 to-blue-200 border border-blue-300 shadow hover:bg-blue-300 focus:ring-2 focus:ring-blue-400 transition font-semibold text-blue-800 text-sm"
                onClick={() => setShowRgbPicker(true)}
                type="button"
                tabIndex={0}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" fill="#fff" stroke="#3b82f6" strokeWidth="2"/><circle cx="12" cy="12" r="6" fill="#3b82f6"/></svg>
                Custom Color
              </button>
              {/* Draggable RGB color picker modal */}
              {showRgbPicker && ReactDOM.createPortal(
                <div id="rgb-picker-modal" className="fixed left-1/2 top-1/2 z-[10000] bg-white border border-blue-300 rounded-xl shadow-2xl p-4 min-w-[320px] min-h-[220px] flex flex-col items-center justify-center" style={{ transform: 'translate(-50%, -50%)' }}>
                  <div className="w-full flex items-center justify-between mb-2">
                    <span className="font-semibold text-blue-700">Custom Color Picker</span>
                    <button onClick={() => setShowRgbPicker(false)} className="text-blue-700 hover:text-red-500 text-lg font-bold px-2">×</button>
                  </div>
                  <ColorPicker
                    value={selectedElement?.fill || '#000000'}
                    onChange={color => {
                      if (selectedElement && (selectedElement.type === 'text' || selectedElement.type === 'shape')) {
                        handleUpdate({ fill: color });
                      }
                    }}
                    hidePresets={true}
                    hideControls={false}
                    width={280}
                    height={220}
                  />
                </div>,
                document.body
              )}
            </div>,
            document.body
          )}
        </div>
      </div>
    </div>
  );
}
