"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import DynamicEditableCanvasSlide from '../../../../components/Presentation/Edit/DynamicEditableCanvasSlide';
import { v4 as uuidv4 } from 'uuid';
import { TemplatePicker } from '../../../../components/Presentation/EditableCanvasSlide';
import { convertSlideToCanvasElements } from '../../../../components/Presentation/Edit/Content-Parser';
import { CANVAS_CONFIG } from '../../../../components/Presentation/Edit/CanvaTypesConst';

// Utility: Convert SVG element to PNG data URL
// async function svgElementToPngDataUrl(svgElement, width, height) {
//   return new Promise((resolve, reject) => {
//     const svgData = new XMLSerializer().serializeToString(svgElement);
//     const svgBlob = new Blob([svgData], {
//       type: "image/svg+xml;charset=utf-8",
//     });
//     const url = URL.createObjectURL(svgBlob);
//     const img = new window.Image();
//     img.onload = function () {
//       const canvas = document.createElement("canvas");
//       canvas.width = width;
//       canvas.height = height;
//       const ctx = canvas.getContext("2d");
//       ctx.fillStyle = "#fff";
//       ctx.fillRect(0, 0, width, height);
//       ctx.drawImage(img, 0, 0, width, height);
//       URL.revokeObjectURL(url);
//       resolve(canvas.toDataURL("image/png"));
//     };
//     img.onerror = reject;
//     img.src = url;
//   });
// }

// Remove all mxgraph imports, svgElementToPngDataUrl, ChartPreviewImage, and any chart-related useState/useEffect
// Remove any chart-related asset sidebar UI and logic

// --- Type Definitions ---
interface CanvasElement {
  [key: string]: any;
}
// Use SlideData type for compatibility with EditableCanvasSlide
interface SlideData {
  title?: string;
  content?: string;
  canvasElements?: CanvasElement[];
  [key: string]: any;
}
interface Slide extends SlideData {
  title: string;
  content: string;
  canvasElements: CanvasElement[];
  canvasWidth?: number;
  canvasHeight?: number;
}
interface Theme {
  [key: string]: any;
}

// --- Helper Functions ---
const defaultSlide = (): Slide => ({
  title: "New Slide",
  content: "",
  canvasElements: [],
});

// --- Main Component Logic ---
function PresentationEditComponent() {
  const params = useParams();
  const projectId = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;
  const router = useRouter();

  const DRAFT_KEY = `draft_presentation_${projectId}`;

  const [slides, setSlides] = useState<Slide[]>([]);
  const [theme, setTheme] = useState<Theme>({});
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [isAlreadySaved, setIsAlreadySaved] = useState(false);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [memes, setMemes] = useState([]);
  const [infographs, setInfographs] = useState([]);
  const [showAssetSidebar, setShowAssetSidebar] = useState(false);
  const [undoStack, setUndoStack] = useState<Slide[][]>([]);
  const [redoStack, setRedoStack] = useState<Slide[][]>([]);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [showBackConfirmation, setShowBackConfirmation] = useState(false);
  const [allProjectTitles, setAllProjectTitles] = useState<string[]>([]);
  const [allProjectIds, setAllProjectIds] = useState<string[]>([]);
  const [titleError, setTitleError] = useState<string>("");

  // Sync editTitleValue with projectTitle on load
  useEffect(() => {
    setEditTitleValue(projectTitle);
  }, [projectTitle]);

  // On mount, load draft if exists, else fetch from backend
  useEffect(() => {
    if (!projectId) return;
    if (initialized) return;
    setInitialized(true);
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed && Array.isArray(parsed.slides) && parsed.theme) {
          setSlides(parsed.slides);
          setTheme(parsed.theme);
          setProjectTitle(parsed.projectTitle || "");
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn('Failed to parse draft:', e);
      }
    }
    // If no draft, fetch from backend
    setLoading(true);
    const fetchPresentation = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}api/projects/edit/${projectId}`
        );
        if (res.status === 404) {
          router.push("/presentation");
          return;
        }
        if (!res.ok) {
          throw new Error(
            `Failed to fetch presentation: ${res.status} ${res.statusText}`
          );
        }
        const result = await res.json();
        let projectSlides: Slide[] = [];
        let projectTheme: Theme = {};
        let title = "";
        if (result.content && result.content.slides) {
          projectSlides = result.content.slides;
          projectTheme = result.content.theme || {};
          title = result.title || "Untitled Presentation";
        } else if (result.slides) {
          projectSlides = result.slides;
          projectTheme = result.theme || {};
          title = result.title || "Untitled Presentation";
        } else {
          projectSlides = [defaultSlide()];
          projectTheme = {};
          title = "New Presentation";
        }
        const processedSlides = projectSlides.map((slide) => ({
          ...slide,
          canvasElements: slide.canvasElements || [],
        }));
        setSlides(processedSlides);
        setTheme(projectTheme);
        setProjectTitle(title);
        setLoading(false);
      } catch (e) {
        setError("Failed to load project");
        setLoading(false);
        router.push("/presentation");
      }
    };
    fetchPresentation();
  }, [projectId, router]);

  // Only auto-save draft if not losing progress
  const isLosingProgressRef = useRef(false);
  useEffect(() => {
    if (isLosingProgressRef.current) return;
    if (slides.length > 0) {
      const draftData = JSON.stringify({ slides, theme, projectTitle });
      localStorage.setItem(DRAFT_KEY, draftData);
    }
  }, [slides, theme, projectTitle]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/memes/all`)
      .then((res) => res.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : data.memes || [];
        setMemes(arr);
      })
      .catch(() => setMemes([]));
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/infograph/all`)
      .then((res) => res.json())
      .then((data) =>
        setInfographs(Array.isArray(data) ? data : data.infographs || [])
      )
      .catch(() => setInfographs([]));
  }, []);

  function insertImageToSlide(imageUrl: string) {
    const newElement = {
      id: uuidv4(),
      type: "image",
      src: imageUrl,
      x: 100,
      y: 100,
      width: 400,
      height: 300, // default position/size
    };
    const updatedSlides = slides.map((slide, idx) =>
      idx === current
        ? { ...slide, canvasElements: [...slide.canvasElements, newElement] }
        : slide
    );
    setSlides(updatedSlides);
    setShowAssetSidebar(false);
  }

  // Ensure all canvasElements have a unique id before rendering or saving
  function ensureElementIds(slides: Slide[]): Slide[] {
    return slides.map((slide: Slide) => ({
      ...slide,
      canvasElements: (slide.canvasElements || []).map((el: CanvasElement) => ({
        ...el,
        id: el.id || uuidv4(),
      })),
    }));
  }

  // Central update function for all slide changes
  const handleUpdateSlideWithHistory = (updatedSlide: SlideData) => {
    setUndoStack((prev) => [...prev, slides]);
    setRedoStack([]);
    setSlides((prevSlides) => prevSlides.map((s, i) =>
      i === current ? { ...s, ...updatedSlide } : s
    ));
  };

  const handleUndo = () => {
    setUndoStack((prevUndo) => {
      if (prevUndo.length === 0) return prevUndo;
      setRedoStack((prevRedo) => [slides, ...prevRedo]);
      const prev = prevUndo[prevUndo.length - 1];
      setSlides(prev);
      return prevUndo.slice(0, -1);
    });
  };
  const handleRedo = () => {
    setRedoStack((prevRedo) => {
      if (prevRedo.length === 0) return prevRedo;
      setUndoStack((prevUndo) => [...prevUndo, slides]);
      const next = prevRedo[0];
      setSlides(next);
      return prevRedo.slice(1);
    });
  };

  const handleAddSlide = () => {
    setSlides((prevSlides) => [
      ...prevSlides.slice(0, current + 1),
      defaultSlide(),
      ...prevSlides.slice(current + 1),
    ]);
    setCurrent((c) => c + 1);
  };

  const handleDeleteSlide = () => {
    if (slides.length <= 1) return;
    setSlides((prevSlides) => prevSlides.filter((_, i) => i !== current));
    setCurrent((c) => (c > 0 ? c - 1 : 0));
  };

  const handlePrev = () => setCurrent((c) => (c > 0 ? c - 1 : 0));
  const handleNext = () =>
    setCurrent((c) => (c < slides.length - 1 ? c + 1 : c));

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    // Prevent saving if title is empty or 'Untitled Presentation'
    const trimmedTitle = editTitleValue.trim();
    if (trimmedTitle === '' || trimmedTitle.toLowerCase() === 'untitled presentation') {
      setTitleError('Please enter a project name before saving.');
      setIsSaving(false);
      setEditingTitle(true); // Open the title input for renaming
      setTimeout(() => {
        const input = document.querySelector('input[title="Edit project title"]') as HTMLInputElement;
        if (input) input.focus();
      }, 100);
      return;
    }
    // Prevent saving if duplicate project name exists (different projectId)
    const newTitle = trimmedTitle.toLowerCase();
    const duplicate = allProjectTitles.some((t, idx) => t === newTitle && allProjectIds[idx] !== projectId);
    if (duplicate) {
      setTitleError('A project with this name already exists. Please edit the name.');
      setIsSaving(false);
      setEditingTitle(true);
      setTimeout(() => {
        const input = document.querySelector('input[title="Edit project title"]') as HTMLInputElement;
        if (input) input.focus();
      }, 100);
      return;
    }
    // Only allow backend save if user explicitly clicks save and title is valid
    try {
      const slidesWithIds = ensureElementIds(slides);
      const updatedSlides = slidesWithIds.map((s: Slide) => ({
        ...s,
        canvasWidth: s.canvasWidth || 2560,
        canvasHeight: s.canvasHeight || 1440,
      }));
      const payload = {
        slides: updatedSlides,
        theme,
        projectId,
        title:
          projectTitle || updatedSlides[0]?.title || "Untitled Presentation",
        user_id: "000000000000000000000000",
      };

      let response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}api/projects/edit/${projectId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (response.status === 404) {
        // Try to create if not found
        response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}api/projects/save`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      }
      if (!response.ok) {
        let errorMsg = `Failed to save presentation: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (
            response.status === 409 &&
            (errorData.error?.includes("already exists") ||
              errorData.error?.includes("already saved"))
          ) {
            errorMsg =
              "A project with this ID already exists. Please refresh or return to the project list.";
            setIsAlreadySaved(true);
          } else {
            errorMsg = errorData.error || errorMsg;
          }
        } catch {}
        setError(errorMsg);
        setTimeout(() => setError(null), 8000);
        return;
      }
      setSlides(updatedSlides);
      setSuccess(true);
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = setTimeout(() => {
        setSuccess(false);
        // Redirect to home after save
        router.push('/presentation');
      }, 2000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Unknown error occurred while saving.");
      } else {
        setError("Unknown error occurred while saving.");
      }
      setTimeout(() => setError(null), 8000);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  function handleApplyTemplate(template: any, mode: string = "replace") {
    if (!template?.content?.slides?.length) return;
    const templateSlides = template.content.slides.map((s: Slide) => ({
      ...s,
      canvasElements: s.canvasElements && s.canvasElements.length > 0
        ? s.canvasElements
        : convertSlideToCanvasElements(s, theme),
    }));
    setSlides(prevSlides => {
      if (mode === "replace") {
        return [
          ...prevSlides.slice(0, current),
          templateSlides[0],
          ...prevSlides.slice(current + 1),
        ];
      } else if (mode === "add-next") {
        return [
          ...prevSlides.slice(0, current + 1),
          templateSlides[0],
          ...prevSlides.slice(current + 1),
        ];
      } else if (mode === "add-all") {
        return [
          ...prevSlides.slice(0, current + 1),
          ...templateSlides,
          ...prevSlides.slice(current + 1),
        ];
      }
      return prevSlides;
    });
  }

  if (loading) return <div className="p-10 text-center">Loading Editor...</div>;
  if (error)
    return <div className="p-10 text-center text-red-500">Error: {error}</div>;

  const saveButtonDisabled = isSaving || isAlreadySaved || editTitleValue.trim().toLowerCase() === 'untitled presentation';

  const handleTitleDblClick = () => setEditingTitle(true);
  const handleTitleBlur = async () => {
    setEditingTitle(false);
    if (isLosingProgressRef.current) return;
    // Prevent backend save on blur for drafts (untitled or empty)
    const trimmedTitle = editTitleValue.trim();
    if (trimmedTitle === '' || trimmedTitle.toLowerCase() === 'untitled presentation') {
      setTitleError('Please enter a project name before saving.');
      return;
    }
    if (editTitleValue !== projectTitle) {
      setProjectTitle(editTitleValue);
      // Do NOT save to backend on blur, only update local state
    }
  };
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleBlur();
    }
  };

  const handleBackClick = () => {
    // If project title is empty, guide user to input field instead of showing dialog
    if (editTitleValue.trim() === '') {
      setTitleError('Please enter a project name before leaving.');
      setEditingTitle(true);
      setTimeout(() => {
        const input = document.querySelector('input[title="Edit project title"]') as HTMLInputElement;
        if (input) input.focus();
      }, 100);
      return;
    }
    // Prevent back if duplicate project name exists (different projectId)
    const trimmedTitle = editTitleValue.trim();
    const newTitle = trimmedTitle.toLowerCase();
    const duplicate = allProjectTitles.some((t, idx) => t === newTitle && allProjectIds[idx] !== projectId);
    if (duplicate) {
      setTitleError('A project with this name already exists. Please edit the name.');
      setEditingTitle(true);
      setTimeout(() => {
        const input = document.querySelector('input[title="Edit project title"]') as HTMLInputElement;
        if (input) input.focus();
      }, 100);
      return;
    }
    setShowBackConfirmation(true);
  };

  const handleBackConfirm = () => {
    setShowBackConfirmation(false);
    isLosingProgressRef.current = true;
    // Remove draft from localStorage to avoid copy on home
    localStorage.removeItem(DRAFT_KEY);
    // Prevent any save or update to backend on lose progress
    // (No save logic here)
    router.push('/presentation');
  };

  const handleBackSave = async () => {
    setShowBackConfirmation(false);
    await handleSave();
    // After save, redirect to home
    router.push('/presentation');
  };

  return (
    <div className="bg-[#f1f5f9] min-h-screen">
      <div className="w-full fixed top-0 z-50">
        {/* Success message always at the top */}
        {success && (
          <div className="w-full bg-green-500 text-white text-center py-3 shadow-lg z-50">
            <span className="font-medium">
              Presentation saved successfully!
            </span>
          </div>
        )}

<header className="sticky top-8 z-20 flex items-center justify-between px-6 py-3 mx-4 mt-3 rounded-xl shadow-md border border-blue-100 bg-gradient-to-r from-blue-200 via-white to-cyan-100">
  {/* Left: Title & Back (hidden on mobile) */}
  <div className="hidden sm:flex items-center gap-3">
    <button
      onClick={handleBackClick}
      className="text-gray-600 hover:text-black"
      title="Back"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    </button>
    <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]" onDoubleClick={handleTitleDblClick} style={{cursor:'pointer'}}>
      {editingTitle ? (
        <input
          autoFocus
          value={editTitleValue}
          onChange={e => setEditTitleValue(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={handleTitleKeyDown}
          className="px-1 py-0.5 border border-blue-300 rounded bg-white text-gray-900 text-sm font-medium max-w-[200px]"
          style={{minWidth:80}}
          title="Edit project title"
          placeholder="Edit project title"
        />
      ) : (
        projectTitle || "Untitled Presentation"
      )}
    </span>
  </div>

  {/* Center: Slide Counter (always visible) */}
  <div className="flex items-center gap-2">
    <button onClick={handlePrev} disabled={current === 0} className="text-lg px-2 py-1 rounded hover:bg-blue-100 disabled:text-gray-300" title="Previous Slide">{'<'}</button>
    <span className="text-sm font-medium text-gray-700">
      Slide {current + 1} of {slides.length}
    </span>
    <button onClick={handleNext} disabled={current === slides.length - 1} className="text-lg px-2 py-1 rounded hover:bg-blue-100 disabled:text-gray-300" title="Next Slide">{'>'}</button>
  </div>

  {/* Right: Full actions for desktop */}
  <div className="hidden sm:flex items-center gap-4 text-sm text-gray-700">
    <button onClick={handleAddSlide} className="flex items-center gap-1 hover:text-green-600">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      <span>Add</span>
    </button>

    <button
      onClick={handleDeleteSlide}
      disabled={slides.length <= 1}
      className="flex items-center gap-1 hover:text-red-600 disabled:opacity-30"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      <span>Delete</span>
    </button>

    <button
      onClick={handleSave}
      disabled={saveButtonDisabled}
      className="flex items-center gap-1 hover:text-blue-600 disabled:opacity-30"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
      </svg>
      <span>Save</span>
    </button>
  </div>

  {/* Right: Mobile Dropdown */}
  <div className="sm:hidden relative">
  <MobileDropdownMenu
    onAddSlide={handleAddSlide}
    onDeleteSlide={handleDeleteSlide}
    onSave={handleSave}
    canDelete={slides.length > 1}
    canSave={!saveButtonDisabled}
  />
</div>
</header>

      </div>

      {/* {showAssetSidebar && (
        <div className="fixed top-0 right-0 w-80 h-full bg-white shadow-lg z-50 overflow-y-auto border-l border-gray-200 p-4">
          <button
            className="mb-4 text-gray-500 hover:text-gray-800"
            onClick={() => setShowAssetSidebar(false)}
          >
            Close
          </button>
          <h3 className="font-bold mb-2">Memes (Photo Only)</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {memes.length === 0 && (
              <span className="text-gray-400">No memes available</span>
            )}
            {memes.map((meme) => {
              let imageUrl = null;
              if (meme.response && meme.response.templateImage) {
                imageUrl = meme.response.templateImage;
              } else if (
                meme.response &&
                Array.isArray(meme.response.memes) &&
                meme.response.memes.length > 0 &&
                meme.response.memes[0].templateImage
              ) {
                imageUrl = meme.response.memes[0].templateImage;
              }
              return imageUrl ? (
                <img
                  key={meme._id || meme.id}
                  src={imageUrl}
                  alt="meme"
                  className="w-24 h-24 object-contain border border-green-400 bg-white"
                  style={{ background: "#f0fff4" }}
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://via.placeholder.com/96x96?text=Meme";
                  }}
                  onClick={() => insertImageToSlide(imageUrl)}
                />
              ) : (
                <div
                  key={meme._id || meme.id}
                  className="w-24 h-24 flex items-center justify-center border border-green-200 bg-gray-50 text-gray-400"
                >
                  No meme image found
                </div>
              );
            })}
          </div>
          <h3 className="font-bold mb-2">Infographics</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {infographs.length === 0 && (
              <span className="text-gray-400">No infographics available</span>
            )}
            {infographs.map((info) => {
              let imageUrl = null;
              if (
                info.response &&
                info.response.infographics &&
                Array.isArray(info.response.infographics) &&
                info.response.infographics.length > 0
              ) {
                const firstSection =
                  info.response.infographics[0].sections &&
                  info.response.infographics[0].sections[0];
                if (
                  firstSection &&
                  firstSection.icon &&
                  firstSection.icon.url
                ) {
                  imageUrl = firstSection.icon.url;
                }
              }
              return imageUrl ? (
                <img
                  key={info._id}
                  src={imageUrl}
                  alt="infograph"
                  className="w-24 h-24 object-contain border cursor-pointer"
                  onClick={() => insertImageToSlide(imageUrl)}
                />
              ) : null;
            })}
          </div>
        </div>
      )} */}

      <div className="max-w-8xl mx-auto">
        {error && (
          <div className="mb-4 text-red-700 text-center bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-medium">Save Failed</span>
            </div>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        )}
        {isAlreadySaved && (
          <div className="mb-4 text-yellow-700 text-center bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span className="font-medium">Project Already Exists</span>
            </div>
            <p className="text-sm text-yellow-600 mt-1">
              A project with this ID already exists. Please refresh or return to
              the project list.
            </p>
          </div>
        )}
        <main className="flex justify-center items-center min-h-screen">
          {slides.length === 0 ? (
            <div className="text-center text-gray-500 bg-white rounded-lg p-8 shadow-sm">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-lg">No slides found for this project.</p>
              <p className="text-sm">Click "Add Slide" to get started.</p>
            </div>
          ) : (
            <div
              className="w-full max-w-8xl mx-auto flex flex-col items-center justify-center flex-grow"
              id="slide-export-pdf"
            >
              <div className="bg-[#f1f5f9] rounded-xl p-8 pt-0 flex items-center justify-center w-full max-w-[100%] max-h-[80vh]">
                <DynamicEditableCanvasSlide
                  slide={slides[current] as any}
                  theme={theme}
                  onUpdate={handleUpdateSlideWithHistory}
                  memes={memes}
                  infographs={infographs}
                  insertImageToSlide={insertImageToSlide}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  canUndo={undoStack.length > 0}
                  canRedo={redoStack.length > 0}
                  onApplyTemplate={handleApplyTemplate}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Back Confirmation Dialog */}
      {showBackConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Save Changes?
            </h3>
            <p className="text-gray-600 mb-6">
              Do you want to save your changes before going back, or lose your progress?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBackConfirmation(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBackConfirm}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Lose Progress
              </button>
              <button
                onClick={handleBackSave}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save & Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileDropdownMenu({
  onAddSlide,
  onDeleteSlide,
  onSave,
  canDelete,
  canSave,
}: {
  onAddSlide: () => void;
  onDeleteSlide: () => void;
  onSave: () => void;
  canDelete: boolean;
  canSave: boolean;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="p-2 text-gray-700 hover:text-black rounded-full transition hover:bg-gray-100"
        aria-label="More actions"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 12h.01M12 12h.01M18 12h.01"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-fade-in">
          <button
            onClick={() => {
              onAddSlide();
              setOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
          >
            ➕ Add Slide
          </button>
          <button
            onClick={() => {
              onDeleteSlide();
              setOpen(false);
            }}
            disabled={!canDelete}
            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
              !canDelete ? "text-gray-300 cursor-not-allowed" : ""
            }`}
          >
            🗑 Delete Slide
          </button>
          <button
            onClick={() => {
              onSave();
              setOpen(false);
            }}
            disabled={!canSave}
            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
              !canSave ? "text-gray-300 cursor-not-allowed" : ""
            }`}
          >
            💾 Save
          </button>
        </div>
      )}
    </div>
  );
}


// Wrapper to use hooks that need Suspense
export default function PresentationEditPage() {
  return (
    <Suspense
      fallback={<div className="p-10 text-center">Loading Editor...</div>}
    >
      <PresentationEditComponent />
    </Suspense>
  );
}
