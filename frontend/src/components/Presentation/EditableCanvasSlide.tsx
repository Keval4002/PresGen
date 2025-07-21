"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Stage, Layer, Text } from "react-konva";
import {
  CANVAS_CONFIG,
  ELEMENT_TYPES,
  SHAPE_TYPES,
} from "./Edit/CanvaTypesConst";
import { generateSnapGuides } from "./Edit/Canvas-utilities";
import {
  CanvasTextElement,
  CanvasImageElement,
  CanvasShapeElement,
} from "./Edit/Canvas-Components";
import EditingToolbar from "./Edit/EditingToolbar";
// import PropertyPanel from "./Edit/PropertyPanel";
import { Archive } from "lucide-react";
import { TemplatePicker as TemplatePickerModal } from "./EditableCanvasSlide";

// --- Type Definitions ---
interface CanvasElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  [key: string]: any;
}
interface SlideData {
  canvasElements?: CanvasElement[];
  slideNumber?: number;
  [key: string]: any;
}
interface ThemeData {
  background_color?: string;
  primary_color?: string;
  text_color?: string;
  accent_color?: string;
  [key: string]: any;
}
interface EditableCanvasSlideProps {
  slide: SlideData;
  theme: ThemeData;
  onUpdate: (slide: SlideData) => void;
  memes: any[]; // or a more specific type
  infographs: any[];
  insertImageToSlide: (url: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}
interface SnapGuideLines {
  vertical: number[];
  horizontal: number[];
}

// --- TemplatePicker Modal Component ---
interface TemplatePickerProps {
  onClose: () => void;
  onSelect: (template: any) => void;
}
function TemplatePicker({ onClose, onSelect }: TemplatePickerProps) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Track which template is being hovered and its slideshow index
  const [hoveredTemplateId, setHoveredTemplateId] = useState<string | null>(null);
  const [slideshowIndex, setSlideshowIndex] = useState<Record<string, number>>({});
  const slideshowIntervalRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/templates/active`)
      .then((res) => res.json())
      .then((data) => {
        setTemplates(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to fetch templates');
        setLoading(false);
      });
  }, []);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(slideshowIntervalRef.current).forEach(clearInterval);
    };
  }, []);

  const handleMouseEnter = (template: any) => {
    setHoveredTemplateId(template._id);
    // Start slideshow for this template
    if (template.content?.slide_images?.length > 1) {
      let idx = 0;
      setSlideshowIndex((prev) => ({ ...prev, [template._id]: 0 }));
      slideshowIntervalRef.current[template._id] = setInterval(() => {
        idx = (idx + 1) % template.content.slide_images.length;
        setSlideshowIndex((prev) => ({ ...prev, [template._id]: idx }));
      }, 900); // Change slide every 900ms
    }
  };

  const handleMouseLeave = (template: any) => {
    setHoveredTemplateId(null);
    setSlideshowIndex((prev) => ({ ...prev, [template._id]: 0 }));
    if (slideshowIntervalRef.current[template._id]) {
      clearInterval(slideshowIntervalRef.current[template._id]);
      delete slideshowIntervalRef.current[template._id];
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative bg-gradient-to-br from-white via-blue-50 to-purple-50 rounded-2xl shadow-2xl p-8 w-full max-w-4xl max-h-[85vh] overflow-y-auto border border-blue-200 animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-indigo-500 bg-white/70 rounded-full p-2 shadow transition focus:outline-none focus:ring-2 focus:ring-indigo-300"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-indigo-700 mb-6 text-center drop-shadow-sm">Select a Template</h2>
        {loading && <div className="text-center text-lg text-gray-500 py-8">Loading templates...</div>}
        {error && <div className="text-center text-red-500 py-4">{error}</div>}
        <div className="flex flex-wrap justify-center gap-8">
          {templates.map((template) => {
            const slideImages = template.content?.slide_images || [];
            const showSlideshow = hoveredTemplateId === template._id && slideImages.length > 1;
            const currentIdx = showSlideshow ? (slideshowIndex[template._id] || 0) : 0;
            const displayImage = slideImages[currentIdx]?.imageUrl || template.cover_image_url || 'https://via.placeholder.com/400x300?text=No+Image';
            return (
              <div key={template._id} className="flex flex-col items-center">
                <img
                  src={displayImage}
                  alt={template.title}
                  className="max-w-xs max-h-72 rounded-xl shadow-lg cursor-pointer transition-transform duration-200 hover:scale-105 hover:shadow-2xl border-2 border-transparent hover:border-indigo-300 bg-white"
                  onClick={() => { onSelect(template); onClose(); }}
                  onMouseEnter={() => handleMouseEnter(template)}
                  onMouseLeave={() => handleMouseLeave(template)}
                />
                {/* Dots for slideshow navigation */}
                {slideImages.length > 1 && (
                  <div className="flex justify-center mt-3 gap-2">
                    {(() => {
                      const dotCount = 6;
                      const total = slideImages.length;
                      const current = currentIdx;
                      // Map current slide index to one of the 6 dots
                      let activeDot = 0;
                      if (total <= dotCount) {
                        activeDot = current;
                      } else {
                        activeDot = Math.round((current / (total - 1)) * (dotCount - 1));
                      }
                      return Array.from({ length: dotCount }).map((_, idx) => (
                        <span
                          key={idx}
                          className={`inline-block w-2.5 h-2.5 rounded-full transition-all duration-200 border ${
                            showSlideshow && activeDot === idx
                              ? 'bg-gray-500 border-gray-500 shadow-[0_0_4px_0_rgba(100,100,100,0.10)]'
                              : 'bg-gray-300 border-gray-300'
                          }`}
                          style={{ opacity: showSlideshow ? 1 : 0.7 }}
                        />
                      ));
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {(!loading && templates.length === 0) && <div className="text-gray-400 mt-8 text-center text-lg">No templates available.</div>}
      </div>
    </div>
  );
}

export { TemplatePicker };

// --- Slideshow Modal for Template Preview ---
interface TemplateSlideshowModalProps {
  template: any;
  onClose: () => void;
}
function TemplateSlideshowModal({ template, onClose }: TemplateSlideshowModalProps) {
  const [current, setCurrent] = useState(0);
  const images = template?.content?.slide_images || [];

  if (!images.length) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60">
      <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-3xl w-full flex flex-col items-center">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-indigo-500 text-2xl">✕</button>
        <h3 className="text-lg font-bold mb-4">{template.title}</h3>
        <img
          src={images[current].imageUrl}
          alt={`Slide ${current + 1}`}
          className="max-h-[60vh] rounded-lg shadow mb-4"
        />
        <div className="flex justify-between items-center w-full mt-2">
          <button
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span>
            Slide {current + 1} / {images.length}
          </span>
          <button
            onClick={() => setCurrent((c) => Math.min(images.length - 1, c + 1))}
            disabled={current === images.length - 1}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Component ---
export default function EditableCanvasSlide({
  slide,
  theme,
  onUpdate,
  memes,
  infographs,
  insertImageToSlide,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onApplyTemplate, // <-- new prop
}: EditableCanvasSlideProps & { onApplyTemplate?: (template: any, mode: string) => void }) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasElements, setCanvasElements] = useState<CanvasElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null
  );
  const [snapGuides, setSnapGuides] = useState<SnapGuideLines>({
    vertical: [],
    horizontal: [],
  });
  const [showPropertyPanel, setShowPropertyPanel] = useState(true);
  const [canvasScale, setCanvasScale] = useState(1);
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAssetMenu, setShowAssetMenu] = useState(false);
  const [selectedAssetCategory, setSelectedAssetCategory] = useState<
    string | null
  >(null);
  const [showAssetOptions, setShowAssetOptions] = useState(false);
  const [activeAssetType, setActiveAssetType] = useState<
    "memes" | "infographs" | null
  >(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showRgbPicker, setShowRgbPicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [slideshowTemplate, setSlideshowTemplate] = useState(null);
  const [pendingTemplate, setPendingTemplate] = useState(null);
  const [showTemplateActionModal, setShowTemplateActionModal] = useState(false);

  // --- Floating Drag/Rotate Button Logic ---
  const [isRotating, setIsRotating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const rotateStart = useRef<{ angle: number; mouseAngle: number } | null>(null);
  // Track the latest drag/rotate values
  const latestDrag = useRef<{ x: number; y: number } | null>(null);
  const latestRotate = useRef<number | null>(null);

  // Add a deterministic counter for element IDs
  const elementIdCounter = useRef(0);

  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState<string>("");
  const editingTextRef = useRef<any>(null); // Will hold the Konva.Text node
  const [editingTextRect, setEditingTextRect] = useState<any>(null);

  const handleTextEditStart = (id: string, value: string) => {
    console.log('Double-click: start editing text', id, value);
    setEditingTextId(id);
    setEditingTextValue(value);
  };
  const handleTextEditCommit = (id: string) => {
    handleElementUpdate(id, { text: editingTextValue }); // propagate to parent and save
    setEditingTextId(null);
    setEditingTextValue("");
  };
  const handleTextEditCancel = () => {
    setEditingTextId(null);
    setEditingTextValue("");
  };

  // --- Local Storage Draft Logic ---
  // (No localStorage, draft, or clearDraft code here)

  // Only keep state and update logic for the current slide
  useEffect(() => {
    if (Array.isArray(slide.canvasElements)) {
      setCanvasElements(slide.canvasElements);
    }
  }, [slide.canvasElements]);

  useEffect(() => {
    const calculateScale = () => {
      // Get the actual canvas container
      const canvasContainer = document.querySelector('[data-canvas-container]') || document.body;
      const containerRect = canvasContainer.getBoundingClientRect();
      
      // Calculate available space with dynamic margins based on viewport size
      let leftToolbarWidth, bottomToolbarHeight, topPadding, bottomPadding, sideMargins;
      
      if (window.innerWidth < 768) {
        // Mobile: No left toolbar, minimal padding
        leftToolbarWidth = 0;
        bottomToolbarHeight = 0; // No editing toolbar on mobile
        topPadding = 40;
        bottomPadding = 60; // Account for mobile bottom bar
        sideMargins = 2;
      } else if (window.innerWidth < 1024) {
        // Tablet: Collapsible left toolbar, standard padding
        leftToolbarWidth = 80;
        bottomToolbarHeight = 80;
        topPadding = 100;
        bottomPadding = 16;
        sideMargins = 20;
      } else {
        // Desktop: Full left toolbar, standard padding
        leftToolbarWidth = 80;
        bottomToolbarHeight = 80;
        topPadding = 120;
        bottomPadding = 16;
        sideMargins = 40;
      }
      
      // Calculate available space
      const availableWidth = window.innerWidth - leftToolbarWidth - (sideMargins * 2);
      const availableHeight = window.innerHeight - topPadding - bottomToolbarHeight - bottomPadding;
      
      // Ensure minimum available height for proper scaling
      const minAvailableHeight = window.innerWidth < 768 ? 300 : 400;
      const effectiveAvailableHeight = Math.max(availableHeight, minAvailableHeight);
      
      // Calculate scale based on available space
      const scaleX = availableWidth / CANVAS_CONFIG.WIDTH;
      const scaleY = effectiveAvailableHeight / CANVAS_CONFIG.HEIGHT;
      
      // Unified scaling logic for consistent behavior across all viewport sizes
      let scale;
      
      // Calculate base scale using available space
      const widthScale = availableWidth / CANVAS_CONFIG.WIDTH;
      const heightScale = effectiveAvailableHeight / CANVAS_CONFIG.HEIGHT;
      
      // Use the smaller scale to ensure canvas fits completely
      scale = Math.min(widthScale, heightScale, 1);
      
      // Apply viewport-specific adjustments for optimal fit
      if (window.innerWidth < 768) {
        // Mobile: More aggressive scaling for complete visibility
        scale = Math.max(scale, 0.1);
        
        // Additional scaling for better mobile fit
        if (scale > 0.3) {
          scale = scale * 0.8;
        }
      } else if (window.innerWidth < 1024) {
        // Tablet: Moderate scaling
        scale = Math.max(scale, 0.2);
      } else {
        // Desktop: Standard scaling
        scale = Math.max(scale, 0.3);
      }
      
      // Ensure scale doesn't exceed maximum for usability
      const maxScale = window.innerWidth < 768 ? 0.4 : 1;
      scale = Math.min(scale, maxScale);
      
      // Debug logging for viewport heights above 768px
      if (window.innerHeight > 768) {
        console.log('Canvas scaling debug:', {
          viewportHeight: window.innerHeight,
          availableHeight,
          effectiveAvailableHeight,
          scaleY,
          finalScale: scale,
          canvasHeight: CANVAS_CONFIG.HEIGHT * scale
        });
      }
      
      setCanvasScale(scale);
    };
    
    calculateScale();
    window.addEventListener("resize", calculateScale);
    window.addEventListener("orientationchange", calculateScale);
    
    return () => {
      window.removeEventListener("resize", calculateScale);
      window.removeEventListener("orientationchange", calculateScale);
    };
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    function handleGlobalClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      // Prevent closing if click is inside toolbar, property panel, color picker popup, custom, rgb picker modal, or floating button
      if (
        target.closest('.editing-toolbar') ||
        target.closest('.property-panel') ||
        target.closest('#color-picker-popup') ||
        target.closest('#color-picker-custom') ||
        target.closest('#rgb-picker-modal') ||
        target.closest('button[data-ignore-blur]')
      ) {
        return;
      }
      // If click is outside, close color pickers
      setShowColorPicker(false);
      setShowRgbPicker(false);
      // Check if click is inside any selected element (by Konva id or React id)
      if (
        !target.closest('.konvajs-content') &&
        !target.closest('.canvas-element-selected')
      ) {
        setShowPropertyPanel(false);
        setSelectedElementId(null);
      }
    }
    document.addEventListener('mousedown', handleGlobalClick);
    return () => document.removeEventListener('mousedown', handleGlobalClick);
  }, []);

  const handleElementUpdate = (
    elementId: string,
    newProps: Partial<CanvasElement>,
    isInternalUpdate: boolean = false
  ) => {
    const updatedElements = canvasElements.map((el) =>
      el.id === elementId ? { ...el, ...newProps } : el
    );
    setCanvasElements(updatedElements);
    onUpdate({ ...slide, canvasElements: updatedElements });
    // Keep editing toolbar and property panel visible on edit
    setShowEditingToolbar(true);
    setShowPropertyPanel(true);
  };

  const handleElementSelect = (elementId: string | null) => {
    setSelectedElementId(elementId);
    setSnapGuides({ vertical: [], horizontal: [] });
    // Show editing toolbar when element is selected, but don't hide it when deselected
    // (let the manual toggle control hiding)
    if (elementId) {
      setShowEditingToolbar(true);
    }
    setShowPropertyPanel(!!elementId);
  };

  const handleStageClick = (e: any) => {
    if (e.target === e.target.getStage()) {
      handleElementSelect(null);
      setShowPropertyPanel(false);
    }
  };

  const handleDragMove = (
    draggedElement: CanvasElement,
    newPosition: { x: number; y: number }
  ) => {
    // Update the element's position in local state immediately for real-time movement
    setCanvasElements(prevElements =>
      prevElements.map(el =>
        el.id === draggedElement.id ? { ...el, ...newPosition } : el
      )
    );
    const elementWithNewPos = { ...draggedElement, ...newPosition };
    const guides = generateSnapGuides(elementWithNewPos, canvasElements);
    setSnapGuides(guides);
  };

  const handleDragEnd = () => {
    setSnapGuides({ vertical: [], horizontal: [] });
  };

  const addElement = (
    elementType: string,
    elementData: Partial<CanvasElement> = {}
  ) => {
    elementIdCounter.current += 1;
    const newElement: CanvasElement = {
      id: `element_${elementIdCounter.current}`,
      type: elementType,
      x: 100,
      y: 100,
      width: elementType === ELEMENT_TYPES.TEXT ? 200 : 150,
      height: elementType === ELEMENT_TYPES.TEXT ? 50 : 150,
      ...elementData,
    };
    const updatedElements = [...canvasElements, newElement];
    setCanvasElements(updatedElements);
    onUpdate({ ...slide, canvasElements: updatedElements });
    handleElementSelect(newElement.id);
  };

  const deleteSelectedElement = () => {
    if (selectedElementId) {
      const updatedElements = canvasElements.filter(
        (el) => el.id !== selectedElementId
      );
      setCanvasElements(updatedElements);
      onUpdate({ ...slide, canvasElements: updatedElements });
      if (updatedElements.length > 0) {
        // Select the next element (try next, else previous, else first)
        const idx = canvasElements.findIndex(el => el.id === selectedElementId);
        const nextIdx = idx < updatedElements.length ? idx : updatedElements.length - 1;
        setSelectedElementId(updatedElements[nextIdx]?.id || updatedElements[0]?.id || null);
        setShowEditingToolbar(true);
        setShowPropertyPanel(true);
      } else {
        setSelectedElementId(null);
        setShowPropertyPanel(false);
      }
    }
  };

  const duplicateElement = (element: CanvasElement) => {
    elementIdCounter.current += 1;
    const duplicatedElement = {
      ...element,
      id: `element_${elementIdCounter.current}`,
      x: element.x + 20,
      y: element.y + 20,
    };
    const updatedElements = [...canvasElements, duplicatedElement];
    setCanvasElements(updatedElements);
    onUpdate({ ...slide, canvasElements: updatedElements });
    handleElementSelect(duplicatedElement.id);
  };

  const bringToFront = (element: CanvasElement) => {
    const updatedElements = [
      ...canvasElements.filter((el) => el.id !== element.id),
      element,
    ];
    setCanvasElements(updatedElements);
    onUpdate({ ...slide, canvasElements: updatedElements });
  };

  const sendToBack = (element: CanvasElement) => {
    const updatedElements = [
      element,
      ...canvasElements.filter((el) => el.id !== element.id),
    ];
    setCanvasElements(updatedElements);
    onUpdate({ ...slide, canvasElements: updatedElements });
  };

  const addText = () => {
    addElement(ELEMENT_TYPES.TEXT, {
      text: "New Text",
      fontSize: 20,
      fontFamily: "Arial",
      fill: "#000000",
      draggable: true,
    });
  };
  const addImage = () => {
    setShowImageUrlInput(true);
  };
  const addShape = () => {
    addElement(ELEMENT_TYPES.SHAPE, {
      shapeType: SHAPE_TYPES.RECTANGLE,
      fill: "#3B82F6",
      stroke: "#1E40AF",
      strokeWidth: 2,
      draggable: true,
    });
  };
  const addBulletPoint = () => {
    addElement(ELEMENT_TYPES.TEXT, {
      text: "• New bullet point",
      y: 150 + canvasElements.length * 30,
      width: 300,
      height: 30,
      fontSize: 18,
      fontFamily: "Arial",
      fill: theme.text_color || "#374151",
      bulleted: true,
      draggable: true,
    });
  };
  const handleUploadImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      addElement(ELEMENT_TYPES.IMAGE, {
        src: dataUrl,
        draggable: true,
        cornerRadius: 8,
        shadowColor: "rgba(0,0,0,0.1)",
        shadowBlur: 4,
        shadowOffsetX: 1,
        shadowOffsetY: 2,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const renderCanvasElement = (element: CanvasElement) => {
    const isSelected = selectedElementId === element.id;
    // Use live values for selected element during drag/rotate
    let liveElement = element;
    if (isSelected) {
      let liveX = element.x;
      let liveY = element.y;
      let liveRotation = element.rotation || 0;
      if (isDragging && latestDrag.current) {
        liveX = latestDrag.current.x;
        liveY = latestDrag.current.y;
      }
      if (isRotating && latestRotate.current !== null) {
        liveRotation = latestRotate.current;
      }
      liveElement = { ...element, x: liveX, y: liveY, rotation: liveRotation };
    }
    const commonProps = {
      isSelected,
      onUpdate: handleElementUpdate,
      onSelect: handleElementSelect,
      onDragMove: handleDragMove,
      onDragEnd: handleDragEnd,
      canvasScale,
    };
    if (element.type === ELEMENT_TYPES.TEXT) {
      return <CanvasTextElement
        key={element.id}
        {...commonProps}
        element={liveElement as import("./Edit/Canvas-Components").TextElement}
        editingTextId={editingTextId}
        editingTextValue={editingTextValue}
        setEditingTextId={setEditingTextId}
        setEditingTextValue={setEditingTextValue}
        onTextEditStart={(id, value) => {
          setEditingTextId(id);
          setEditingTextValue(value);
        }}
        onTextEditCommit={handleTextEditCommit}
        onTextEditCancel={handleTextEditCancel}
        textRef={editingTextId === element.id ? editingTextRef : undefined}
      />;
    }
    switch (element.type) {
      case ELEMENT_TYPES.IMAGE:
        return <CanvasImageElement key={element.id} {...commonProps} element={liveElement as import("./Edit/Canvas-Components").ImageElement} />;
      case ELEMENT_TYPES.SHAPE:
        return <CanvasShapeElement key={element.id} {...commonProps} element={liveElement as import("./Edit/Canvas-Components").ShapeElement} />;
      default:
        return null;
    }
  };

  const selectedElement = (canvasElements.find((el) => el.id === selectedElementId) ?? null) as CanvasElement | null;
  const enhancedTheme = {
    background_color: theme.background_color || "#ffffff",
    primary_color: theme.primary_color || "#1f2937",
    text_color: theme.text_color || "#374151",
    accent_color: theme.accent_color || "#3b82f6",
    ...theme,
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest(".asset-popup") &&
        !target.closest(".asset-trigger")
      ) {
        setShowAssetOptions(false);
        setActiveAssetType(null);
      }
    };
    if (showAssetOptions || activeAssetType) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAssetOptions, activeAssetType]);

  // Helper to get the selected element's DOM position for floating buttons
  const getSelectedElementScreenRect = useCallback(() => {
    if (!selectedElement) return null;
    const { x, y, width, height } = selectedElement;
    // Scale to canvas
    const left = x * canvasScale;
    const top = y * canvasScale;
    const w = width * canvasScale;
    const h = height * canvasScale;
    return { left, top, w, h };
  }, [selectedElement, canvasScale]);

  // --- Rotation Logic ---
  const handleRotateMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRotating(true);
    document.body.style.cursor = 'grabbing';
    if (!selectedElement) return;
    // Get the center of the selected element in screen coordinates
    const canvasRect = document.querySelector('.konvajs-content')?.getBoundingClientRect();
    if (!canvasRect) return;
    const { x, y, width, height } = selectedElement;
    const center = {
      x: canvasRect.left + (x + width / 2) * canvasScale,
      y: canvasRect.top + (y + height / 2) * canvasScale,
    };
    const mouseAngle = Math.atan2(e.clientY - center.y, e.clientX - center.x);
    rotateStart.current = {
      angle: selectedElement.rotation || 0,
      mouseAngle,
    };
    latestRotate.current = selectedElement.rotation || 0;
    window.addEventListener("mousemove", handleRotateMouseMove);
    window.addEventListener("mouseup", handleRotateMouseUp);
  };
  const handleRotateMouseMove = (e: MouseEvent) => {
    if (!selectedElement || !rotateStart.current) return;
    const canvasRect = document.querySelector('.konvajs-content')?.getBoundingClientRect();
    if (!canvasRect) return;
    const { x, y, width, height } = selectedElement;
    const center = {
      x: canvasRect.left + (x + width / 2) * canvasScale,
      y: canvasRect.top + (y + height / 2) * canvasScale,
    };
    const mouseAngle = Math.atan2(e.clientY - center.y, e.clientX - center.x);
    const delta = mouseAngle - rotateStart.current.mouseAngle;
    const newAngle = ((rotateStart.current.angle + (delta * 180) / Math.PI) % 360 + 360) % 360;
    handleElementUpdate(selectedElement.id, { rotation: newAngle }, true);
    latestRotate.current = newAngle;
    document.body.style.cursor = 'grabbing';
  };
  const handleRotateMouseUp = () => {
    setIsRotating(false);
    document.body.style.cursor = '';
    rotateStart.current = null;
    window.removeEventListener("mousemove", handleRotateMouseMove);
    window.removeEventListener("mouseup", handleRotateMouseUp);
    // Commit rotation for undo/redo (final save)
    if (selectedElement && latestRotate.current !== null) {
      handleElementUpdate(selectedElement.id, { rotation: latestRotate.current }, false);
    }
    latestRotate.current = null;
  };

  // --- Drag Logic ---
  const handleDragMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    document.body.style.cursor = 'grabbing';
    // Store the offset from the center of the element to the mouse
    const canvasRect = document.querySelector('.konvajs-content')?.getBoundingClientRect();
    if (!canvasRect || !selectedElement) return;
    const { x, y, width, height } = selectedElement;
    const center = {
      x: canvasRect.left + (x + width / 2) * canvasScale,
      y: canvasRect.top + (y + height / 2) * canvasScale,
    };
    dragStart.current = {
      x: e.clientX - center.x,
      y: e.clientY - center.y,
    };
    latestDrag.current = { x: selectedElement.x, y: selectedElement.y };
    window.addEventListener("mousemove", handleDragMouseMove);
    window.addEventListener("mouseup", handleDragMouseUp);
  };
  const handleDragMouseMove = (e: MouseEvent) => {
    if (!selectedElement || !dragStart.current) return;
    const canvasRect = document.querySelector('.konvajs-content')?.getBoundingClientRect();
    if (!canvasRect) return;
    const { width, height } = selectedElement;
    // Calculate new center position
    const newCenterX = e.clientX - dragStart.current.x;
    const newCenterY = e.clientY - dragStart.current.y;
    // Convert back to canvas coordinates
    const newX = (newCenterX - canvasRect.left) / canvasScale - width / 2;
    const newY = (newCenterY - canvasRect.top) / canvasScale - height / 2;
    handleElementUpdate(selectedElement.id, { x: newX, y: newY }, true);
    latestDrag.current = { x: newX, y: newY };
    document.body.style.cursor = 'grabbing';
  };
  const handleDragMouseUp = () => {
    setIsDragging(false);
    document.body.style.cursor = '';
    dragStart.current = null;
    window.removeEventListener("mousemove", handleDragMouseMove);
    window.removeEventListener("mouseup", handleDragMouseUp);
    // Commit drag for undo/redo (final save)
    if (selectedElement && latestDrag.current) {
      handleElementUpdate(selectedElement.id, { x: latestDrag.current.x, y: latestDrag.current.y }, false);
    }
    latestDrag.current = null;
  };

  // --- Floating Button Render ---
  // Use the latest drag/rotate position for selection box and button placement
  let liveX = selectedElement?.x ?? 0;
  let liveY = selectedElement?.y ?? 0;
  let liveRotation = selectedElement?.rotation ?? 0;
  if (isDragging && latestDrag.current) {
    liveX = latestDrag.current.x;
    liveY = latestDrag.current.y;
  }
  if (isRotating && latestRotate.current !== null) {
    liveRotation = latestRotate.current;
  }
  const liveRect = selectedElement
    ? {
        left: liveX * canvasScale,
        top: liveY * canvasScale,
        w: (selectedElement.width ?? 0) * canvasScale,
        h: (selectedElement.height ?? 0) * canvasScale,
      }
    : null;
  const showFloatingButtons = !!selectedElement;

  // Helper to get rotated bounding box bottom center (for button placement)
  function getRotatedBottomCenter(x: number, y: number, w: number, h: number, rotationDeg: number) {
    const rad = (rotationDeg * Math.PI) / 180;
    // Bottom center before rotation
    const bx = x + w / 2;
    const by = y + h;
    // Center of box
    const cx = x + w / 2;
    const cy = y + h / 2;
    // Translate to origin, rotate, translate back
    const dx = bx - cx;
    const dy = by - cy;
    const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
    const ry = dx * Math.sin(rad) + dy * Math.cos(rad);
    return { x: cx + rx, y: cy + ry };
  }

  // When editingTextId changes, update editingTextRect
  useEffect(() => {
    if (editingTextId && editingTextRef.current && canvasContainerRef.current) {
      const stage = editingTextRef.current.getStage();
      const box = editingTextRef.current.getClientRect({ relativeTo: stage });
      const stageBox = stage.container().getBoundingClientRect();
      const containerBox = canvasContainerRef.current.getBoundingClientRect();
      const rect = {
        left: stageBox.left + box.x - containerBox.left,
        top: stageBox.top + box.y - containerBox.top,
        width: box.width,
        height: box.height,
        rotation: editingTextRef.current.rotation() || 0,
        fontSize: editingTextRef.current.fontSize(),
        fontFamily: editingTextRef.current.fontFamily(),
        color: editingTextRef.current.fill(),
      };
      console.log('Set editingTextRect', rect);
      setEditingTextRect(rect);
    } else {
      setEditingTextRect(null);
    }
  }, [editingTextId, canvasElements, canvasScale]);

  // Keyboard event handler for in-canvas text editing
  useEffect(() => {
    if (!editingTextId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editingTextId) return;
      if (e.key === 'Escape') {
        handleTextEditCancel();
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleTextEditCommit(editingTextId);
        return;
      }
      // Only handle printable characters and backspace
      if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
        setEditingTextValue(prev => {
          let newValue = prev;
          if (e.key === 'Backspace') {
            newValue = prev.slice(0, -1);
          } else if (e.key === 'Delete') {
            newValue = '';
          } else {
            newValue = prev + e.key;
          }
          // Update the text element in real time
          handleElementUpdate(editingTextId, { text: newValue }, true);
          return newValue;
        });
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingTextId]);

  const [showEditingToolbar, setShowEditingToolbar] = useState(true);

  useEffect(() => {
    // Expose canvasScale globally for EditingToolbar font size scaling
    (window as any).__canvasScale = canvasScale;
  }, [canvasScale]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div
        className="flex flex-col items-center justify-center w-full h-full"
        style={{ 
          minHeight: 'calc(100vh - 120px)', 
          paddingTop: '120px', 
          paddingBottom: '16px',
          height: '100vh'
        }}
      >
        {/* Add Elements Bar (left sidebar) - hidden on mobile */}
        <div className="fixed left-0 top-1/2 -translate-y-1/2 flex flex-col gap-4 items-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border border-blue-200 rounded-2xl shadow-lg py-5 px-3 w-2 md:w-16 lg:w-20 h-auto z-50 md:mr-8 group hover:w-16 md:hover:w-16 transition-all duration-300 ease-in-out hidden md:flex">
          {/* Templates Button (only one, opens modal) */}
          {/* <button
            onClick={() => setShowTemplatePicker(true)}
            className="flex flex-col items-center text-gray-700 hover:text-indigo-600 focus:outline-none rounded-lg transition"
            title="Browse Templates"
          >
            <svg
              className="w-5 h-5 mb-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v1m0 14v1m8-9h-1M5 12H4m15.364-7.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M9 12a3 3 0 116 0 3 3 0 01-6 0z"
              />
            </svg>
            <span className="text-[10px] leading-tight hidden md:group-hover:block lg:block">
              Templates
            </span>
          </button> */}
          {/* Editing Toolbar Toggle Button (first, styled exactly like others, but unique hover color and no bold) */}

          {/* Add Text */}
          <button
            onClick={addText}
            className="flex flex-col items-center text-gray-700 hover:text-blue-600"
            title="Add Text"
          >
            <svg
              className="w-5 h-5 mb-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 10h16M4 14h10"
              />
            </svg>
            <span className="text-[10px] leading-tight hidden md:group-hover:block lg:block">Text</span>
          </button>
          {/* Add Image */}
          <button
            onClick={addImage}
            className="flex flex-col items-center text-gray-700 hover:text-green-600"
            title="Add Image by URL"
          >
            <svg
              className="w-5 h-5 mb-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16l4-4 4 4 4-4 4 4"
              />
            </svg>
            <span className="text-[10px] leading-tight hidden md:group-hover:block lg:block">Image</span>
          </button>
          {/* Upload Image */}
          <button
            onClick={handleUploadImageClick}
            className="flex flex-col items-center text-gray-700 hover:text-yellow-600"
            title="Upload Image"
          >
            <svg
              className="w-5 h-5 mb-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 16v4h10v-4M12 12v8m-6-8h12"
              />
            </svg>
            <span className="text-[10px] leading-tight hidden md:group-hover:block lg:block">Upload</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
            title="Upload image file"
            placeholder="Choose an image file"
          />
          {/* Add Shape */}
          <button
            onClick={addShape}
            className="flex flex-col items-center text-gray-700 hover:text-purple-600"
            title="Add Shape"
          >
            <svg
              className="w-5 h-5 mb-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
            </svg>
            <span className="text-[10px] leading-tight hidden md:group-hover:block lg:block">Shape</span>
          </button>
          {/* Add Bullet Point */}
          <button
            onClick={addBulletPoint}
            className="flex flex-col items-center text-gray-700 hover:text-orange-600"
            title="Add Bullet"
          >
            <svg
              className="w-5 h-5 mb-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h2M4 12h2M8 6h12M8 12h12M8 18h12"
              />
            </svg>
            <span className="text-[10px] leading-tight hidden md:group-hover:block lg:block">Bullet</span>
          </button>
          {/* Assets Button with Mini-Popup */}
          <div className="relative w-full flex flex-col items-center">
            {/* <button
              onClick={() => setShowAssetOptions((prev) => !prev)}
              className="flex flex-col items-center text-gray-700 hover:text-pink-600 asset-trigger"
              title="Assets"
            >
              <svg
                className="w-5 h-5 mb-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="text-[10px] leading-tight hidden md:group-hover:block lg:block">Assets</span>
            </button> */}
            <div className="relative w-full flex flex-col items-center asset-trigger">
              {showAssetOptions && (
                <div className="absolute left-12 top-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-32">
                  <button
                    onClick={() => {setActiveAssetType("memes")
                      setShowAssetOptions(false);
                    }}
                    className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                  >
                    Memes
                  </button>
                  <button
                    onClick={() => {setActiveAssetType("infographs")
                      setShowAssetOptions(false);}
                    }
                    className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                  >
                    Infographs
                  </button>
                </div>
              )}
              {/* Mini Emoji-style Grid */}
              {activeAssetType && (
                <div className="fixed -top-10 left-20 transform -translate-x-5 bg-white border border-gray-300 rounded-xl shadow-2xl z-[100] w-[250px] max-h-[60vh] p-4 overflow-y-auto asset-popup transition-all scrollbar-hide">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-gray-800">
                      {activeAssetType === "memes" ? "Choose Meme" : "Choose Infographic"}
                    </h3>
                    <button
                      className="text-gray-400 hover:text-red-500 text-lg font-bold"
                      onClick={() => {
                        setActiveAssetType(null);
                        setShowAssetOptions(false);
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {(activeAssetType === "memes" ? memes : infographs).map((asset, index) => {
                      const imageUrl =
                        activeAssetType === "memes"
                          ? asset.response?.templateImage ||
                            asset.response?.memes?.[0]?.templateImage
                          : asset.response?.infographics?.[0]?.sections?.[0]?.icon?.url;
                      return imageUrl ? (
                        <img
                          key={index}
                          src={imageUrl}
                          alt={`Asset ${index}`}
                          className="w-28 h-20 object-cover rounded-md cursor-pointer border hover:border-blue-400 hover:scale-105 transition-transform duration-200"
                          onClick={() => {
                            insertImageToSlide(imageUrl);
                            setActiveAssetType(null);
                            setShowAssetOptions(false);
                          }}
                        />
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Editing Toolbar (fixed bottom toolbar, toggleable) - hidden on mobile */}
        {showEditingToolbar && (
          <div className="fixed bottom-0 left-0 w-full hidden md:block">
            <div className="w-full max-w-4xl mx-auto">
              <EditingToolbar
                selectedElement={selectedElement}
                onUpdateElement={handleElementUpdate}
                onDeleteElement={deleteSelectedElement}
                onDuplicateElement={() => duplicateElement(selectedElement)}
                onBringToFront={() => bringToFront(selectedElement)}
                onSendToBack={() => sendToBack(selectedElement)}
                onAddText={addText}
                onAddImage={addImage}
                onAddShape={addShape}
                onUndo={onUndo || (() => {})}
                onRedo={onRedo || (() => {})}
                canUndo={!!canUndo && !!selectedElement}
                canRedo={!!canRedo && !!selectedElement}
                orientation="row"
                iconOnly={isMobile}
                showColorPicker={showColorPicker}
                setShowColorPicker={setShowColorPicker}
                showRgbPicker={showRgbPicker}
                setShowRgbPicker={setShowRgbPicker}
              />
            </div>
          </div>
        )}
        {/* Mobile Bottom Editing Bar (only visible on mobile) */}
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="flex items-center justify-center py-3 px-4">
            <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
              {/* Text Button */}
              <button
                onClick={addText}
                className="flex-shrink-0 p-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition"
                title="Add Text"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h10" />
                </svg>
              </button>
              
              {/* Image Button */}
              <button
                onClick={addImage}
                className="flex-shrink-0 p-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-green-50 transition"
                title="Add Image by URL"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4-4 4 4 4-4 4 4" />
                </svg>
              </button>
              
              {/* Upload Button */}
              <button
                onClick={handleUploadImageClick}
                className="flex-shrink-0 p-2 rounded-lg text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 transition"
                title="Upload Image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16v4h10v-4M12 12v8m-6-8h12" />
                </svg>
              </button>
              
              {/* Shape Button */}
              <button
                onClick={addShape}
                className="flex-shrink-0 p-2 rounded-lg text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition"
                title="Add Shape"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
                </svg>
              </button>
              
              {/* Bullet Button */}
              <button
                onClick={addBulletPoint}
                className="flex-shrink-0 p-2 rounded-lg text-gray-700 hover:text-orange-600 hover:bg-orange-50 transition"
                title="Add Bullet"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h2M4 12h2M8 6h12M8 12h12M8 18h12" />
                </svg>
              </button>
              
              {/* Assets Button */}
              <button
                onClick={() => setShowAssetOptions((prev) => !prev)}
                className="flex-shrink-0 p-2 rounded-lg text-gray-700 hover:text-pink-600 hover:bg-pink-50 transition"
                title="Assets"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        {/* Canvas Slide (always visible, perfectly centered) */}
        <div className="flex flex-col items-center justify-center w-full min-w-0 flex-1" data-canvas-container>
          <div
            className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white flex items-center justify-center"
            style={{
              width: `${CANVAS_CONFIG.WIDTH * canvasScale}px`,
              height: `${CANVAS_CONFIG.HEIGHT * canvasScale}px`,
              minWidth: window.innerWidth < 768 ? "200px" : "320px",
              maxWidth: window.innerWidth < 768 ? "99vw" : window.innerWidth < 1024 ? "98vw" : "95vw",
              maxHeight: window.innerWidth < 768 ? "calc(100vh - 100px)" : window.innerWidth < 1024 ? "calc(100vh - 180px)" : "calc(100vh - 200px)",
              backgroundColor: enhancedTheme.background_color,
            }}
          >
            <Stage
              width={CANVAS_CONFIG.WIDTH}
              height={CANVAS_CONFIG.HEIGHT}
              scaleX={canvasScale}
              scaleY={canvasScale}
              style={{
                backgroundColor: enhancedTheme.background_color,
                width: "100%",
                height: "100%",
              }}
              onClick={handleStageClick}
            >
              <Layer>
                {canvasElements.map(renderCanvasElement)}
                {canvasElements.length === 0 && (
                  <Text
                    x={CANVAS_CONFIG.WIDTH / 2 - 200}
                    y={CANVAS_CONFIG.HEIGHT / 2 - 50}
                    width={400}
                    height={100}
                    text="Click the buttons on the left to add text, images, shapes, bullet points, or upload images from your device."
                    fontSize={16}
                    fill="#6B7280"
                    align="center"
                    verticalAlign="middle"
                    listening={false}
                  />
                )}
              </Layer>
            </Stage>
            {/* Floating Drag/Rotate Buttons (side by side, just below the element) */}
            {showFloatingButtons && liveRect && (
              (() => {
                const btns = { width: 104, height: 48 };
                const bottom = getRotatedBottomCenter(
                  liveX * canvasScale,
                  liveY * canvasScale,
                  (selectedElement?.width ?? 0) * canvasScale,
                  (selectedElement?.height ?? 0) * canvasScale,
                  liveRotation
                );
                return (
                  <div style={{
                    position: 'absolute',
                    left: bottom.x - btns.width / 2,
                    top: bottom.y + 8,
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 8,
                    pointerEvents: isDragging || isRotating ? 'none' : 'auto',
                  }}>
                    <button
                      onMouseDown={handleRotateMouseDown}
                      onClick={e => { e.stopPropagation(); }}
                      onMouseUp={e => { e.stopPropagation(); }}
                      onMouseMove={e => { e.stopPropagation(); }}
                      tabIndex={0}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: '#fff',
                        border: '1.5px solid #D1D5DB',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isRotating ? 'grabbing' : 'grab',
                      }}
                      title="Rotate element"
                      data-ignore-blur
                    >
                      {/* Rotate SVG */}
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 13a9 9 0 0 1 14.5-7.5L21 8"/></svg>
                    </button>
                    <button
                      onMouseDown={handleDragMouseDown}
                      onClick={e => { e.stopPropagation(); }}
                      onMouseUp={e => { e.stopPropagation(); }}
                      onMouseMove={e => { e.stopPropagation(); }}
                      tabIndex={0}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: '#fff',
                        border: '1.5px solid #D1D5DB',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isDragging ? 'grabbing' : 'move',
                      }}
                      title="Move element"
                      data-ignore-blur
                    >
                      {/* Move SVG */}
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="5 9 2 12 5 15"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>
                    </button>
                  </div>
                );
              })()
            )}
          </div>
        </div>
        {/* Property Panel (always rendered, invisible if not selected) */}
        <div className="flex flex-row md:flex-col w-full md:w-[300px] h-[80px] md:h-[500px] justify-center items-center mx-0 md:mx-2 min-w-0">
          <div className={`${selectedElement ? '' : 'opacity-0 pointer-events-none'} w-full h-full p-2`} style={{ width: '100%' }}>
            {/* <PropertyPanel
              selectedElement={selectedElement}
              slide={slide}
              onUpdateElement={handleElementUpdate}
              onUpdateSlide={onUpdate}
              iconOnly={isMobile}
            /> */}
          </div>
        </div>
      </div>
      {showImageUrlInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Image</h3>
            <input
              type="text"
              placeholder="Enter image URL..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (imageUrl.trim()) {
                    addElement(ELEMENT_TYPES.IMAGE, {
                      src: imageUrl.trim(),
                      draggable: true,
                      cornerRadius: 8,
                      shadowColor: "rgba(0,0,0,0.1)",
                      shadowBlur: 4,
                      shadowOffsetX: 1,
                      shadowOffsetY: 2,
                    });
                    setImageUrl("");
                    setShowImageUrlInput(false);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Image
              </button>
              <button
                onClick={() => {
                  setImageUrl("");
                  setShowImageUrlInput(false);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {editingTextId && editingTextRect && (
        <textarea
          autoFocus
          value={editingTextValue}
          onChange={e => setEditingTextValue(e.target.value)}
          onBlur={() => handleTextEditCommit(editingTextId)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleTextEditCommit(editingTextId);
            } else if (e.key === 'Escape') {
              handleTextEditCancel();
            }
          }}
          title="Edit text"
          placeholder="Edit text"
          style={{
            position: 'absolute',
            left: editingTextRect.left,
            top: editingTextRect.top,
            width: editingTextRect.width,
            height: editingTextRect.height,
            fontSize: editingTextRect.fontSize * canvasScale,
            fontFamily: editingTextRect.fontFamily,
            color: editingTextRect.color,
            background: 'linear-gradient(90deg, #f9fafb 60%, #e0e7ff 100%)', // distinct editing color
            border: '2px solid #6366f1', // accent border
            borderRadius: 10,
            padding: 6,
            zIndex: 200,
            resize: 'none',
            outline: 'none',
            boxShadow: '0 2px 12px rgba(99,102,241,0.12)',
            transform: editingTextRect.rotation ? `rotate(${editingTextRect.rotation}deg)` : undefined,
            transition: 'background 0.2s, border 0.2s',
          }}
        />
      )}
      {showTemplatePicker && (
        <TemplatePickerModal
          onClose={() => setShowTemplatePicker(false)}
          onSelect={template => {
            setPendingTemplate(template);
            setShowTemplatePicker(false);
            setShowTemplateActionModal(true);
          }}
        />
      )}
      {showTemplateActionModal && pendingTemplate && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center">
            <h3 className="text-lg font-bold mb-4">How do you want to apply this template?</h3>
            <div className="flex flex-col gap-4 w-full">
              <button
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                onClick={() => { onApplyTemplate?.(pendingTemplate, "replace"); setShowTemplateActionModal(false); }}
              >
                Apply to current page
              </button>
              <button
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                onClick={() => { onApplyTemplate?.(pendingTemplate, "add-next"); setShowTemplateActionModal(false); }}
              >
                Add to next page
              </button>
              <button
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
                onClick={() => { onApplyTemplate?.(pendingTemplate, "add-all"); setShowTemplateActionModal(false); }}
              >
                Add the whole template
              </button>
              <button
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold mt-2"
                onClick={() => setShowTemplateActionModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
