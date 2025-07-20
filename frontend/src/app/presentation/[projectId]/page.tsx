"use client";


import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  FC, // Functional Component type
} from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

// Assumed paths to your components and utilities. Adjust if necessary.
import SlideCard from '../../../components/Presentation/Presentation/SlideCard';
import dynamic from 'next/dynamic';
import { PdfExportManager } from '../../../components/Presentation/utils/PdfExportManager';
import { convertSlideToCanvasElements } from '../../../components/Presentation/Edit/Content-Parser';
import type { Slide, Theme, CanvasElement } from '../../../components/Presentation/client-only/types';

// --- TYPE DEFINITIONS ---

// Describes a single element on a slide's canvas
// interface CanvasElement {
//   type: 'text' | 'image' | 'shape';
//   id: string;
//   x: number;
//   y: number;
//   width: number;
//   height: number;
//   src?: string;
//   content?: string;
//   // Add other properties as needed
// }

// Describes a single slide in the presentation
// interface Slide {
//   id: string;
//   slideNumber: number;
//   title?: string;
//   content?: string; // Original content before parsing
//   canvasElements: CanvasElement[];
// }

// Describes the visual theme of the presentation
// interface Theme {
//   background_color: string;
//   primary_color: string;
//   text_color: string;
//   heading_font: string;
//   body_font: string;
// }

// Describes the main data structure for the presentation
interface PresentationData {
  _id: string;
  projectId: string;
  title: string;
  status: 'pending' | 'processing' | 'image creation' | 'completed' | 'failed';
  slides: Slide[];
  theme: Theme;
  _forceReady?: boolean; // Internal state helper
}

// Props for the main page component
interface PresentationViewerPageProps {
  params: {
    projectId: string;
  };
}

// Status types for different UI feedback components
interface SaveStatus {
  saving?: boolean;
  success?: boolean;
  error?: string | null;
}

interface DownloadStatus {
  downloading?: boolean;
  success?: boolean;
  error?: string | null;
  format?: 'pptx' | 'pdf';
  message?: string;
}

// --- HELPER FUNCTIONS ---

/**
 * Converts an SVG data URL to a PNG data URL.
 * Necessary for libraries like PptxGenJS that don't support SVG embedding.
 */
async function svgDataUrlToPngDataUrl(svgDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = function () {
      const width = img.naturalWidth || 600;
      const height = img.naturalHeight || 338;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error("Failed to get canvas context"));
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = svgDataUrl;
  });
}

/**
 * Iterates through slides and converts any SVG images to PNGs.
 */
async function convertSlidesSvgToPng(slides: Slide[]): Promise<Slide[]> {
  console.log("🧪 Inside convertSlidesSvgToPng()");
  const slidesCopy = JSON.parse(JSON.stringify(slides));
  for (const slide of slidesCopy) {
    for (const element of slide.canvasElements || []) {
      if (
        element.type === 'image' &&
        typeof element.src === 'string' &&
        element.src.startsWith('data:image/svg+xml')
      ) {
        element.src = await svgDataUrlToPngDataUrl(element.src);
      }
    }
  }
  return slidesCopy;
}

// Add a helper for authenticated fetch
function authFetch(url: string, options: any = {}) {
  const token = localStorage.getItem('authToken');
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      'Authorization': `Bearer ${token}`,
    },
  });
}

// --- UI SUB-COMPONENTS ---

const LoadingScreen: FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
    <div className="text-center">
      <div className="relative flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute"></div>
      </div>
      <p className="mt-6 text-slate-700 text-lg font-medium">
        Loading Presentation...
      </p>
    </div>
  </div>
);

const ErrorScreen: FC<{ message: string }> = ({ message }) => (
  <div className="p-8 text-center min-h-screen bg-gradient-to-br from-red-50 to-rose-50 flex items-center justify-center">
    <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-100">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-red-600 text-2xl">⚠</span>
      </div>
      <p className="text-red-800 font-medium text-lg">Error: {message}</p>
    </div>
  </div>
);

const SaveFeedback: FC<{ status: SaveStatus }> = ({ status }) => {
  if (status.success)
    return (
      <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
        <span>💾</span> Presentation saved successfully!
      </div>
    );
  if (status.error)
    return (
      <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
        <span>❌</span> Save failed: {status.error}
      </div>
    );
  if (status.saving)
    return (
      <div className="fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
        <span>Saving...</span>
      </div>
    );
  return null;
};

const DownloadFeedback: FC<{ status: DownloadStatus }> = ({ status }) => {
  if (status.success)
    return (
      <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
        <span>📥</span> {status.format?.toUpperCase()} downloaded successfully!
      </div>
    );
  if (status.error)
    return (
      <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
        <span>❌</span> Download failed: {status.error}
      </div>
    );
  if (status.downloading)
    return (
      <div className="fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
        <span>{status.message || `Downloading ${status.format?.toUpperCase()}...`}</span>
      </div>
    );
  return null;
};

const BackConfirmationDialog: FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  onSave: () => void;
}> = ({ isOpen, onClose, onConfirm, onSave }) => {
  if (!isOpen) return null;
  
  return (
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
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Lose Progress
          </button>
          <button
            onClick={onSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save & Go Back
          </button>
        </div>
      </div>
    </div>
  );
};


// --- MAIN PAGE COMPONENT ---

const DynamicSavedPresentationRenderer = dynamic(
  () => import('../../../components/Presentation/client-only/SavedPresentationRenderer'),
  { ssr: false }
);

const PresentationViewerPage = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;
  const cameFromHome = searchParams.get('from') === 'home';

  const [data, setData] = useState<PresentationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [measuredLayouts, setMeasuredLayouts] = useState<Record<number, any>>({});
  const [scaleFactors, setScaleFactors] = useState<Record<number, number>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({});
  const [isAlreadySaved, setIsAlreadySaved] = useState<boolean>(false);
  const [checkingSaved, setCheckingSaved] = useState<boolean>(true);
  const [isSlideShow, setIsSlideShow] = useState<boolean>(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isSavedPresentation, setIsSavedPresentation] = useState<boolean>(false);
  const [showDownloadDropdown, setShowDownloadDropdown] = useState<boolean>(false);
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>({});
  const [downloadTask, setDownloadTask] = useState<{ format: 'pptx' | 'pdf' } | null>(null);
  const [showBackConfirmation, setShowBackConfirmation] = useState<boolean>(false);
  const [notFoundSince, setNotFoundSince] = useState<number | null>(null);

  const calculationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // const exportManagerRef = useRef(new PptxExportManager());
  const pdfManagerRef = useRef(new PdfExportManager());
  const stageRefs = useRef<any[]>([]); // Note: The type depends on the forwarded ref from SavedPresentationRenderer
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const POLL_TIMEOUT_MS = 60000; // 60 seconds

  const STATUS = useMemo(
    () => ({
      PENDING: "pending",
      PROCESSING: "processing",
      IMAGE_CREATION: "image creation",
      COMPLETED: "completed",
      FAILED: "failed",
    }),
    []
  );

  const isCompleted = (status: PresentationData['status'] | undefined) => status === STATUS.COMPLETED;
  const shouldRenderSlides = (status: PresentationData['status'] | undefined) =>
    status && [STATUS.PROCESSING, STATUS.IMAGE_CREATION, STATUS.COMPLETED].includes(status);

  useEffect(() => {
    // Sync isAlreadySaved with localStorage for viewer only
    if (projectId) {
      const savedKey = `presentation_saved_${projectId}`;
      if (isAlreadySaved) {
        localStorage.setItem(savedKey, 'true');
      } else {
        localStorage.setItem(savedKey, 'false');
      }
    }
  }, [isAlreadySaved, projectId]);

  useEffect(() => {
    const checkIfSaved = async () => {
      try {
        if (!projectId || projectId === "undefined" || projectId === "null") {
          console.error("❌ Invalid projectId:", projectId);
          setError("Invalid project ID");
          setLoading(false);
          return;
        }
        let alreadySaved = false;
        const savedKey = `presentation_saved_${projectId}`;
        const localSaved = localStorage.getItem(savedKey);
        if (localSaved === 'true') {
          alreadySaved = true;
        } else {
          const response = await fetch(`${API_BASE_URL}api/projects/check/${projectId}`);
          if (response.ok) {
            const result = await response.json();
            alreadySaved = result.alreadySaved;
          }
        }
        setIsAlreadySaved(alreadySaved);
      } catch (err) {
        console.error("Error checking if saved:", err);
        setIsAlreadySaved(false);
      } finally {
        setCheckingSaved(false);
      }
    };
    if (projectId) {
      checkIfSaved();
    }
  }, [projectId, API_BASE_URL]);

  const fetchProjectData = useCallback(async (): Promise<PresentationData | null> => {
    if (!projectId || projectId === "undefined" || projectId === "null") {
      setError("Invalid project ID");
      setLoading(false);
      return null;
    }

    let response = await fetch(`${API_BASE_URL}api/projects/edit/${projectId}`);
    if (response.ok) {
      const result: PresentationData = await response.json();
      setIsSavedPresentation(true);
      return result;
    }

    response = await fetch(`${API_BASE_URL}api/themes/project/${projectId}`);
    if (response.ok) {
      const result: PresentationData = await response.json();
      setIsSavedPresentation(false);
      return result;
    }

    if (response.status === 404) {
      response = await fetch(`${API_BASE_URL}api/projects/${projectId}`);
      if (response.ok) {
        const result = await response.json();
        const isSaved = result.projectId || (result.content && result.content.slides);
        setIsSavedPresentation(isSaved);
        return result;
      }
      // Try the fallback route
      response = await fetch(`${API_BASE_URL}api/projects/find/${projectId}`);
      if (response.ok) {
        const result = await response.json();
        setIsSavedPresentation(!!result.projectId);
        return result;
      }
    }

    throw new Error(`HTTP error! Status: ${response.status}`);
  }, [projectId, API_BASE_URL]);

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) {
        router.push("/login");
        return;
      }
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/projects/edit/${projectId}`);
        if (res.status === 401 || res.status === 403) {
          router.push("/login");
          return;
        }
        const project = await res.json();
        setData(project);
        setLoading(false);
      } catch (err) {
        setError("Failed to load project");
        setLoading(false);
      }
    };
    fetchProject();
  }, [projectId, router]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;
    let isUnmounted = false;

    const pollData = async () => {
      try {
        const result = await fetchProjectData();
        if (result) {
          setData(result);
          setError(null);
          setNotFoundSince(null);
          if (isCompleted(result.status) || result.status === STATUS.FAILED) {
            if (intervalId) clearInterval(intervalId);
            if (timeoutId) clearTimeout(timeoutId);
          }
        }
      } catch (err: any) {
        // If project not found, treat as loading for up to POLL_TIMEOUT_MS
        if (err.message && (err.message.includes('404') || err.message.toLowerCase().includes('not found'))) {
          if (!notFoundSince) setNotFoundSince(Date.now());
          // If timeout exceeded, show error
          if (notFoundSince && Date.now() - notFoundSince > POLL_TIMEOUT_MS) {
            setError('Project not found after waiting. Please try again later.');
            if (intervalId) clearInterval(intervalId);
            if (timeoutId) clearTimeout(timeoutId);
          } else {
            setError(null); // Still loading
          }
        } else {
          setError(err.message);
          if (intervalId) clearInterval(intervalId);
          if (timeoutId) clearTimeout(timeoutId);
        }
      } finally {
        setLoading(false);
      }
    };

    pollData();
    intervalId = setInterval(pollData, 5000);
    // Set a hard timeout for polling
    timeoutId = setTimeout(() => {
      if (!isUnmounted && !data) {
        setError('Project not found after waiting. Please try again later.');
        if (intervalId) clearInterval(intervalId);
      }
    }, POLL_TIMEOUT_MS);

    return () => {
      isUnmounted = true;
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [projectId, fetchProjectData, STATUS.FAILED, notFoundSince]);

  useEffect(() => {
    if (isCompleted(data?.status)) {
      setMeasuredLayouts({});
      setScaleFactors({});
      calculationTimeoutRef.current = setTimeout(() => {
        console.warn("⚠️ Calculation safety timeout fired. Forcing readiness.");
        setData((prev) => (prev ? { ...prev, _forceReady: true } : null));
      }, 8000);
    }
    return () => {
      if (calculationTimeoutRef.current) clearTimeout(calculationTimeoutRef.current);
    };
  }, [data?.status]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showDownloadDropdown && !target.closest(".download-dropdown")) {
        setShowDownloadDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDownloadDropdown]);

  const contentSlidesCount = useMemo(
    () => data?.slides?.filter((slide) => slide.content).length || 0,
    [data?.slides]
  );

  const layoutsReady = useMemo(
    () =>
      isCompleted(data?.status) &&
      (data?._forceReady ||
        (data?.slides && Object.keys(measuredLayouts).length >= data.slides.length)),
    [data, measuredLayouts]
  );

  const scalesReady = useMemo(
    () =>
      layoutsReady &&
      (data?._forceReady ||
        contentSlidesCount === 0 ||
        Object.keys(scaleFactors).length >= contentSlidesCount),
    [layoutsReady, scaleFactors, contentSlidesCount, data]
  );

  useEffect(() => {
    if (layoutsReady && scalesReady && calculationTimeoutRef.current) {
      clearTimeout(calculationTimeoutRef.current);
      calculationTimeoutRef.current = null;
      console.log("✅ All layouts and scales calculated successfully.");
    }
  }, [layoutsReady, scalesReady]);

  const theme: Theme = useMemo(
    () => ({
      background_color: data?.theme?.background_color || "#FFFFFF",
      primary_color: data?.theme?.primary_color || "#1f2937",
      text_color: data?.theme?.text_color || "#374151",
      heading_font: data?.theme?.heading_font || "Inter",
      body_font: data?.theme?.body_font || "Inter",
    }),
    [data?.theme]
  );

  const handleScaleReport = useCallback((index: number, scale: number) => {
    setScaleFactors((prev) => ({ ...prev, [index]: scale }));
  }, []);

  const handleLayoutMeasure = useCallback((slideIndex: number, layout: any) => {
    setMeasuredLayouts((prev) => ({ ...prev, [slideIndex]: layout }));
  }, []);

  const handleSave = useCallback(async (): Promise<PresentationData | undefined> => {
    if (!data || !data.slides) return;
    if (isAlreadySaved) return; // Avoid duplicate saves
    setSaveStatus({ saving: true, success: false, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}api/projects/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: projectId,
          slides: data.slides,
          theme: theme,
          title: data.slides[0]?.title || "Untitled Presentation",
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        setSaveStatus({ saving: false, error: errorData.error || "Failed to save presentation" });
        setTimeout(() => setSaveStatus({}), 5000);
        return;
      }
      const savedData: PresentationData = await response.json();
      setSaveStatus({ saving: false, success: true });
      setIsAlreadySaved(true);
      // Set localStorage flag
      if (projectId) {
        const savedKey = `presentation_saved_${projectId}`;
        localStorage.setItem(savedKey, 'true');
      }
      setTimeout(() => {
        setSaveStatus({});
        // Redirect to home after save
        router.push('/presentation');
      }, 2000);
      return savedData;
    } catch (err: any) {
      setSaveStatus({ saving: false, error: err.message });
      setTimeout(() => setSaveStatus({}), 5000);
      return;
    }
  }, [data, theme, projectId, isAlreadySaved, router]);

  const handleDownloadRequest = (format: 'pptx' | 'pdf') => {
    if (downloadStatus.downloading) return;
    setShowDownloadDropdown(false);
    setDownloadTask({ format });
  };

  const handleBackClick = () => {
    // If already saved or came from home, go back directly
    if (isAlreadySaved || cameFromHome) {
      router.push("/presentation");
    } else {
      // Show confirmation dialog
      setShowBackConfirmation(true);
    }
  };

  const handleBackConfirm = () => {
    setShowBackConfirmation(false);
    router.push("/presentation");
  };

  const handleBackSave = async () => {
    setShowBackConfirmation(false);
    const savedData = await handleSave();
    if (savedData) {
      router.push("/presentation");
    }
  };

  useEffect(() => {
    const executeDownload = async () => {
      if (!downloadTask || !data) return;
      const { format } = downloadTask;
      setDownloadStatus({ downloading: true, format, message: `Preparing ${format.toUpperCase()}...` });
      try {
        let presentationData = { ...data };
        if (!isSavedPresentation && !isAlreadySaved) {
          setDownloadStatus(prev => ({ ...prev, message: 'Auto-saving presentation...' }));
          const savedData = await handleSave();
          if (savedData) {
            presentationData = savedData;
            setData(savedData);
            setIsSavedPresentation(true);
            return;
          }
        }
        setDownloadStatus(prev => ({ ...prev, message: `Generating ${format.toUpperCase()}...` }));
        let slidesForExport = presentationData.slides;
        // Ensure background_color is always defined for ThemeData compatibility
        const themeForExport = {
          background_color: presentationData.theme.background_color || '#FFFFFF',
          ...presentationData.theme
        };
        if (!slidesForExport[0]?.canvasElements || slidesForExport[0]?.canvasElements.length === 0) {
          slidesForExport = presentationData.slides.map(slide => ({
            ...slide,
            canvasElements: convertSlideToCanvasElements(slide, themeForExport)
          }));
        }
        const finalData = { ...presentationData, slides: slidesForExport };
        if (format === "pptx") {
          const slidesCopy = await convertSlidesSvgToPng(slidesForExport);
          // Dynamically import and use PptxExportManager client-side
          const { PptxExportManager } = await import("../../../components/Presentation/utils/CoordinateUtility");
          const pptxExportManager = new PptxExportManager();
          await pptxExportManager.exportSavedPresentation({
            title: presentationData.title,
            slides: slidesCopy,
          }, themeForExport);
        } else if (format === "pdf") {
          // Dynamically import and use PdfExportManager client-side
          const { PdfExportManager } = await import("../../../components/Presentation/utils/PdfExportManager");
          const pdfExportManager = new PdfExportManager();
          await pdfExportManager.export(
            { title: presentationData.title, slides: slidesForExport },
            themeForExport as any,
            (info) => setDownloadStatus(prev => ({ ...prev, message: info.message }))
          );
        }
        setDownloadStatus({ downloading: false, success: true, format });
        setTimeout(() => setDownloadStatus({}), 3000);
        setDownloadTask(null);
      } catch (err: any) {
        setDownloadStatus({ downloading: false, error: err.message, format });
        setTimeout(() => setDownloadStatus({}), 5000);
        setDownloadTask(null);
      }
    };
    if (downloadTask) {
      setTimeout(executeDownload, 100);
    }
  }, [downloadTask, data, isSavedPresentation, isAlreadySaved, handleSave, theme]);

  const startSlideShow = useCallback(() => {
    if (!data?.slides?.length) return;
    setCurrentSlideIndex(0);
    setIsSlideShow(true);
  }, [data?.slides]);

  const exitSlideShow = useCallback(() => setIsSlideShow(false), []);

  const nextSlide = useCallback(() => {
    if (!data?.slides) return;
    setCurrentSlideIndex((prev) => Math.min(prev + 1, data.slides.length - 1));
  }, [data?.slides]);

  const prevSlide = useCallback(
    () => setCurrentSlideIndex((prev) => Math.max(prev - 1, 0)),
    []
  );

  useEffect(() => {
    if (!isSlideShow) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") nextSlide();
      else if (e.key === "ArrowLeft") prevSlide();
      else if (e.key === "Escape") exitSlideShow();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSlideShow, nextSlide, prevSlide, exitSlideShow]);

  const saveButtonState = useMemo(() => {
    if (cameFromHome) {
      return { text: "Saved", disabled: true, show: false };
    }
    if (checkingSaved) return { text: "⏳ Checking...", disabled: true, show: false };
    if (isAlreadySaved) return { text: "✅ Saved", disabled: true, show: false };
    if (saveStatus.saving) return { text: "💾 Saving...", disabled: true, show: true };
    if (isCompleted(data?.status)) return { text: "💾 Save", disabled: false, show: true };
    return { text: "💾 Save", disabled: true, show: false };
  }, [checkingSaved, isAlreadySaved, saveStatus.saving, data?.status, cameFromHome]);

  if (loading || (!data && !error)) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} />;
  if (!data) return <ErrorScreen message="No data found for this presentation." />;

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 min-h-screen">
      <SaveFeedback status={saveStatus} />
      <DownloadFeedback status={downloadStatus} />
      
      {/* Fixed Header */}
      <div className="w-full fixed top-0 z-50">
        <header className="sticky top-8 z-20 flex items-center justify-between px-6 py-3 mx-4 mt-3 rounded-xl shadow-md border border-blue-100 bg-gradient-to-r from-blue-200 via-white to-cyan-100">
          {/* Left: Back & Title */}
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
            <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
              {data.slides?.[currentSlideIndex]?.title || "Presentation"}
            </span>
          </div>

          {/* Center: Slide Navigation */}
          <div className="flex items-center gap-2">
            <button onClick={prevSlide} disabled={currentSlideIndex === 0} className="text-lg px-2 py-1 rounded hover:bg-blue-100 disabled:text-gray-300" title="Previous Slide">{'<'}</button>
            <span className="text-sm font-medium text-gray-700">
              Slide {currentSlideIndex + 1} of {data.slides?.length || 0}
            </span>
            <button onClick={nextSlide} disabled={currentSlideIndex === (data.slides?.length || 1) - 1} className="text-lg px-2 py-1 rounded hover:bg-blue-100 disabled:text-gray-300" title="Next Slide">{'>'}</button>
          </div>

          {/* Right: Actions for desktop */}
          <div className="hidden sm:flex items-center gap-4 text-sm text-gray-700">
            {isCompleted(data.status) && (
              <>
                <button 
                  onClick={() => router.push(`/presentation/edit/${projectId}`)} 
                  className="flex items-center gap-1 hover:text-indigo-600"
                  title="Edit Presentation"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit</span>
                </button>

                <button 
                  onClick={startSlideShow} 
                  className="flex items-center gap-1 hover:text-green-600"
                  title="Start Slideshow"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Slideshow</span>
                </button>

                {saveButtonState.show && !isAlreadySaved && !cameFromHome && (
                  <button 
                    onClick={handleSave} 
                    disabled={saveButtonState.disabled} 
                    className="flex items-center gap-1 hover:text-orange-600 disabled:opacity-30"
                    title="Save Presentation"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    <span>{saveButtonState.text.replace(/[💾✅⏳]/g, '').trim()}</span>
                  </button>
                )}

                <div className="relative download-dropdown">
                  <button 
                    onClick={() => setShowDownloadDropdown(!showDownloadDropdown)} 
                    disabled={downloadStatus.downloading} 
                    className="flex items-center gap-1 hover:text-blue-600 disabled:opacity-30"
                    title="Download Presentation"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Download</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showDownloadDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="py-1">
                        <button onClick={() => handleDownloadRequest("pptx")} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                          <span>📦</span>
                          Download as PPTX
                        </button>
                        <button onClick={() => handleDownloadRequest("pdf")} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                          <span>📄</span>
                          Download as PDF
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right: Mobile Dropdown */}
          <div className="sm:hidden relative">
            <button
              onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
              className="text-gray-600 hover:text-black"
              title="Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {showDownloadDropdown && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="py-1">
                  <button onClick={handleBackClick} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>
                  {isCompleted(data.status) && (
                    <>
                      <button onClick={() => router.push(`/presentation/edit/${projectId}`)} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button onClick={startSlideShow} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Slideshow
                      </button>
                      {saveButtonState.show && !isAlreadySaved && !cameFromHome && (
                        <button onClick={handleSave} disabled={saveButtonState.disabled} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-30">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                          </svg>
                          {saveButtonState.text.replace(/[💾✅⏳]/g, '').trim()}
                        </button>
                      )}
                      <button onClick={() => handleDownloadRequest("pptx")} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                        <span>📦</span>
                        Download PPTX
                      </button>
                      <button onClick={() => handleDownloadRequest("pdf")} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                        <span>📄</span>
                        Download PDF
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        <main className="relative">
          {data.status === STATUS.PENDING && (
            <div className="text-center py-32">
              <div className="relative inline-flex items-center justify-center">
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200"></div>
                <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-blue-600 absolute"></div>
              </div>
              <h2 className="text-2xl font-bold text-slate-700 mt-8">
                Initializing Presentation...
              </h2>
            </div>
          )}
          {shouldRenderSlides(data.status) && data.slides && data.slides.length > 0 && (
            <div className="space-y-8 flex flex-col items-center">
              <div key={data.slides[currentSlideIndex].slideNumber || `slide-${currentSlideIndex}`} id={`slide-container-${currentSlideIndex}`} className="relative group w-full flex justify-center">
                <div className="absolute -left-4 top-1/2 -translate-y-1/2 z-30">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-2xl border-2 border-white" style={{ backgroundColor: theme.primary_color }}>
                    {currentSlideIndex + 1}
                  </div>
                </div>
                {isSavedPresentation ? (
                  <DynamicSavedPresentationRenderer slide={data.slides[currentSlideIndex]} theme={{
                    background_color: theme.background_color || '#fff',
                    ...theme
                  }} ref={(el: any) => (stageRefs.current[currentSlideIndex] = el)} />
                ) : (
                  <SlideCard slide={data.slides[currentSlideIndex]} theme={{
                    background_color: theme.background_color || '#fff',
                    ...theme
                  }} slideIndex={currentSlideIndex} onScaleReport={isCompleted(data.status) ? handleScaleReport : undefined} onLayoutMeasure={isCompleted(data.status) ? handleLayoutMeasure : undefined} />
                )}
              </div>
            </div>
          )}
        </main>
      </div>
      
      {isSlideShow && data?.slides && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <button onClick={exitSlideShow} className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-60" title="Exit (ESC)">✕</button>
          <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl hover:text-gray-300 z-60" title="Previous (←)">‹</button>
          <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl hover:text-gray-300 z-60" title="Next (→)">›</button>
          <div className="w-full h-full max-w-7xl max-h-screen p-8 flex items-center justify-center">
            {isSavedPresentation ? (
              <DynamicSavedPresentationRenderer slide={data.slides[currentSlideIndex]} theme={{
                background_color: theme.background_color || '#fff',
                ...theme
              }} />
            ) : (
              <SlideCard slide={data.slides[currentSlideIndex]} theme={{
                background_color: theme.background_color || '#fff',
                ...theme
              }} slideIndex={currentSlideIndex} />
            )}
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
            {currentSlideIndex + 1} / {data.slides.length}
          </div>
        </div>
      )}
      
      {/* Only show the BackConfirmationDialog if not already saved and not from home */}
      {showBackConfirmation && !isAlreadySaved && !cameFromHome && (
        <BackConfirmationDialog
          isOpen={showBackConfirmation}
          onClose={() => setShowBackConfirmation(false)}
          onConfirm={handleBackConfirm}
          onSave={handleBackSave}
        />
      )}
    </div>
  );
};

export default PresentationViewerPage;