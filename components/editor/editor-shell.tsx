"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Download,
  Eye,
  ImagePlus,
  Layers3,
  Loader2,
  Lock,
  Monitor,
  PaintBucket,
  Plus,
  RotateCw,
  Save,
  Search,
  Sparkles,
  Type,
  X,
  Unlock,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import type {
  Canvas as FabricCanvas,
  FabricObject,
  FabricImage,
  Textbox,
} from "fabric";

import { ResizableAside } from "@/components/editor/layout/resizable-aside";
import { CanvasToolbar } from "@/components/editor/canvas/canvas-toolbar";
import { FilterPanel } from "@/components/editor/canvas/filter-panel";
import { ExportDialog } from "@/components/editor/export/export-dialog";
import { InstagramShell } from "@/components/editor/network-shell/instagram-shell";
import { LinkedInShell } from "@/components/editor/network-shell/linkedin-shell";
import { XShell } from "@/components/editor/network-shell/x-shell";
import { PreviewModal } from "@/components/editor/preview/preview-modal";
import { exportCanvasUHD, UHD_PRESET } from "@/lib/editor/export-utils";
import {
  NETWORK_CONFIGS,
  type NetworkFormat,
} from "@/lib/editor/network-configs";
import { cn } from "@/lib/utils";
import type {
  EditorPanelTab,
  EditorState,
  ExportOptions,
  NetworkId,
} from "@/types/editor";

type EditorShellProps = {
  networkId: "instagram" | "x" | "linkedin";
  formatKey: string;
  initialContent?: {
    headline?: string;
    body?: string;
    caption?: string;
    postText?: string;
    tweetText?: string;
  };
  canvasJSON?: object;
  username?: string;
  displayName?: string;
  handle?: string;
  onSave?: (canvasJSON: object, previewURL: string) => void;
  onClose?: () => void;
};

type SerializedCanvas = Record<string, unknown>;
type FabricModule = typeof import("fabric");
type ThemeSwatch = {
  label: string;
  background: string;
  accent: string;
  text: string;
};
type FontOption = {
  label: string;
  family: string;
};
type EditorMeta = {
  activeFilterId?: string;
  activeFilterCSS?: string;
};

const FABRIC_JSON_PROPERTIES = ["id", "role", "isLocked"] as const;
const TAB_ITEMS: Array<{ id: EditorPanelTab; label: string; icon: typeof Sparkles }> = [
  { id: "slides", label: "Slides", icon: Layers3 },
  { id: "theme", label: "Tema", icon: PaintBucket },
  { id: "assets", label: "Assets", icon: ImagePlus },
  { id: "filters", label: "Filtros", icon: Sparkles },
  { id: "fonts", label: "Fuentes", icon: Type },
];
const THEME_SWATCHES: ThemeSwatch[] = [
  {
    label: "Noctra Night",
    background: "#0B1020",
    accent: "#72F1B8",
    text: "#F8FAFC",
  },
  {
    label: "Editorial Sand",
    background: "#F4EDE4",
    accent: "#C36F3C",
    text: "#201A16",
  },
  {
    label: "Signal Blue",
    background: "#0B1F3A",
    accent: "#4CB3FF",
    text: "#F8FBFF",
  },
  {
    label: "Rose Studio",
    background: "#20111A",
    accent: "#FF7AA2",
    text: "#FFF4F7",
  },
];
const FONT_OPTIONS: FontOption[] = [
  { label: "Inter", family: "Inter, system-ui, sans-serif" },
  { label: "Georgia", family: "Georgia, serif" },
  { label: "Trebuchet", family: "'Trebuchet MS', sans-serif" },
  { label: "Courier", family: "'Courier New', monospace" },
];
const HEADER_BUTTON_CLASS =
  "inline-flex h-9 items-center gap-2 rounded-full border border-white/10 px-3 text-sm font-medium text-white transition-colors hover:border-white/20 hover:bg-white/5";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function cloneSnapshot(snapshot: SerializedCanvas): SerializedCanvas {
  return JSON.parse(JSON.stringify(snapshot)) as SerializedCanvas;
}

function extractEditorMeta(canvasJSON?: object): EditorMeta {
  if (!canvasJSON || !isRecord(canvasJSON)) {
    return {};
  }

  const candidate = canvasJSON.__editorMeta;
  if (!isRecord(candidate)) {
    return {};
  }

  return {
    activeFilterId:
      typeof candidate.activeFilterId === "string"
        ? candidate.activeFilterId
        : undefined,
    activeFilterCSS:
      typeof candidate.activeFilterCSS === "string"
        ? candidate.activeFilterCSS
        : undefined,
  };
}

function resolveFormatConfig(
  networkId: NetworkId,
  formatKey: string
): NetworkFormat {
  switch (networkId) {
    case "instagram":
      return (
        NETWORK_CONFIGS.instagram[
          formatKey as keyof typeof NETWORK_CONFIGS.instagram
        ] ?? NETWORK_CONFIGS.instagram.feed_square
      );
    case "x":
      return (
        NETWORK_CONFIGS.x[formatKey as keyof typeof NETWORK_CONFIGS.x] ??
        NETWORK_CONFIGS.x.single_image
      );
    case "linkedin":
      return (
        NETWORK_CONFIGS.linkedin[
          formatKey as keyof typeof NETWORK_CONFIGS.linkedin
        ] ?? NETWORK_CONFIGS.linkedin.single_image
      );
  }
}

function resolveInstagramFormat(formatKey: string) {
  if (
    formatKey === "feed_square" ||
    formatKey === "feed_portrait" ||
    formatKey === "story" ||
    formatKey === "carousel_slide"
  ) {
    return formatKey;
  }

  return "feed_square";
}

function resolveXFormat(formatKey: string) {
  return formatKey === "thread_card" ? "thread_card" : "single_image";
}

function resolveLinkedInFormat(formatKey: string) {
  if (formatKey === "portrait" || formatKey === "document_cover") {
    return formatKey;
  }

  return "single_image";
}

function getEditorCanvasWidth(networkId: NetworkId, formatKey: string) {
  if (networkId === "instagram" && formatKey === "story") {
    return "min(26vw, 360px)";
  }

  if (networkId === "linkedin" && formatKey === "portrait") {
    return "min(34vw, 460px)";
  }

  return "min(48vw, 760px)";
}

function getObjectLabel(object: FabricObject | null) {
  if (!object) {
    return "Sin seleccion";
  }

  const role = object.get("role");
  if (typeof role === "string" && role.length > 0) {
    return role;
  }

  return object.type || "objeto";
}

function isTextboxObject(object: FabricObject | null): object is Textbox {
  return !!object && ["textbox", "i-text", "text"].includes(object.type);
}

function findObjectByRole(canvas: FabricCanvas, role: string) {
  return (
    canvas
      .getObjects()
      .find((object) => object.get("role") === role) ?? null
  );
}

function getPrimaryCopy(
  initialContent: EditorShellProps["initialContent"],
  networkId: NetworkId
) {
  if (networkId === "x") {
    return (
      initialContent?.tweetText ||
      initialContent?.postText ||
      initialContent?.caption ||
      initialContent?.headline ||
      "Una idea clara merece un visual contundente."
    );
  }

  return (
    initialContent?.headline ||
    initialContent?.caption ||
    initialContent?.postText ||
    "Diseña una pieza que se sienta nativa en cada red."
  );
}

function getSecondaryCopy(initialContent: EditorShellProps["initialContent"]) {
  return (
    initialContent?.body ||
    initialContent?.postText ||
    initialContent?.caption ||
    "Combina tipografia, jerarquia y color para preparar una version lista para publicar."
  );
}

function getCanvasRootStyle(width: number, height: number): CSSProperties {
  return {
    aspectRatio: `${width} / ${height}`,
    width: "100%",
  };
}

async function seedEditorialTemplate(
  canvas: FabricCanvas,
  fabricModule: FabricModule,
  networkId: NetworkId,
  initialContent?: EditorShellProps["initialContent"]
) {
  const { Rect, Textbox } = fabricModule;
  const width = canvas.getWidth();
  const height = canvas.getHeight();
  const isVertical = height / width > 1.15;
  const primaryCopy = getPrimaryCopy(initialContent, networkId);
  const secondaryCopy = getSecondaryCopy(initialContent);

  canvas.clear();

  const background = new Rect({
    fill: isVertical ? "#0A0F1E" : "#111827",
    evented: false,
    height,
    left: 0,
    selectable: false,
    top: 0,
    width,
  });
  background.set("id", "background");
  background.set("role", "background");
  background.set("isLocked", true);

  const glow = new Rect({
    fill: networkId === "linkedin" ? "#0A66C2" : networkId === "x" ? "#3B82F6" : "#8B5CF6",
    height: height * 0.16,
    left: width * 0.08,
    opacity: 0.9,
    rx: 999,
    ry: 999,
    top: height * (isVertical ? 0.08 : 0.11),
    width: width * 0.28,
  });
  glow.set("id", "accent");
  glow.set("role", "accent");

  const headline = new Textbox(primaryCopy, {
    fill: "#F8FAFC",
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: isVertical ? width * 0.1 : width * 0.07,
    fontWeight: 700,
    left: width * 0.08,
    lineHeight: 0.92,
    splitByGrapheme: false,
    top: height * (isVertical ? 0.2 : 0.24),
    width: width * 0.78,
  });
  headline.set("id", "headline");
  headline.set("role", "headline");

  const body = new Textbox(secondaryCopy, {
    fill: "rgba(248,250,252,0.82)",
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: isVertical ? width * 0.04 : width * 0.028,
    fontWeight: 400,
    left: width * 0.08,
    lineHeight: 1.35,
    splitByGrapheme: false,
    top:
      (headline.top ?? 0) +
      (headline.getScaledHeight() || headline.height || 0) +
      height * 0.045,
    width: width * 0.62,
  });
  body.set("id", "body");
  body.set("role", "body");

  const footer = new Textbox(
    networkId === "x"
      ? "social.noctra.studio"
      : networkId === "linkedin"
        ? "Noctra Studio"
        : "@noctra.studio",
    {
      fill: "rgba(248,250,252,0.72)",
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: isVertical ? width * 0.026 : width * 0.02,
      fontWeight: 500,
      left: width * 0.08,
      top: height * (isVertical ? 0.88 : 0.87),
      width: width * 0.32,
    }
  );
  footer.set("id", "footer");
  footer.set("role", "footer");

  canvas.add(background, glow, headline, body, footer);
  canvas.setActiveObject(headline);
  canvas.requestRenderAll();
}

function EditorShellClient({
  networkId,
  formatKey,
  initialContent,
  canvasJSON,
  username = "noctra.studio",
  displayName = "Noctra Studio",
  handle = "noctra",
  onSave,
  onClose,
}: EditorShellProps) {
  const initialMeta = useMemo(() => extractEditorMeta(canvasJSON), [canvasJSON]);
  const formatConfig = useMemo(
    () => resolveFormatConfig(networkId, formatKey),
    [formatKey, networkId]
  );

  // --- STATE ---
  const [editorState, setEditorState] = useState<EditorState>(() => ({
    activeFilterCSS: initialMeta.activeFilterCSS ?? "",
    activeFilterId: initialMeta.activeFilterId ?? "none",
    canvasJSON: canvasJSON ?? null,
    formatKey,
    isDirty: false,
    isExporting: false,
    networkId,
    previewDataURL: null,
  }));
  const [activeObject, setActiveObject] = useState<FabricObject | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [previewDataURL, setPreviewDataURL] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<EditorPanelTab>("filters");
  const [canvasPreviewDataURL, setCanvasPreviewDataURL] = useState<string | null>(
    null
  );
  const [isMobile, setIsMobile] = useState(false);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [selectionVersion, setSelectionVersion] = useState(0);

  // --- REFS ---
  const fabricCanvas = useRef<FabricCanvas | null>(null);
  const fabricModuleRef = useRef<FabricModule | null>(null);
  const canvasEl = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const historyStack = useRef<SerializedCanvas[]>([]);
  const historyIndex = useRef(-1);
  const historyTimeoutRef = useRef<number | null>(null);
  const previewTimeoutRef = useRef<number | null>(null);
  const isRestoringRef = useRef(false);

  // --- DERIVED VALUES ---
  const shellWidth = useMemo(
    () => getEditorCanvasWidth(networkId, formatKey),
    [formatKey, networkId]
  );
  const canUndo = historyIndex.current > 0;
  const canRedo = historyIndex.current < historyStack.current.length - 1;
  const activeObjectLocked = Boolean(activeObject?.get("isLocked"));
  const normalizedHandle = handle.replace(/^@/, "") || "noctra";
  const selectedObjectLabel = getObjectLabel(activeObject);
  const objectPosition = {
    left: Math.round(activeObject?.left ?? 0),
    top: Math.round(activeObject?.top ?? 0),
    angle: Math.round(activeObject?.angle ?? 0),
    opacity: Math.round(((activeObject?.opacity ?? 1) * 100) as number),
  };
  const objectFill =
    typeof activeObject?.fill === "string" ? activeObject.fill : "#FFFFFF";
  const objectStroke =
    typeof activeObject?.stroke === "string" ? activeObject.stroke : "#000000";

  // --- SYNC PROPS ---
  useEffect(() => {
    setEditorState((previous) => ({
      ...previous,
      activeFilterCSS: initialMeta.activeFilterCSS ?? previous.activeFilterCSS,
      activeFilterId: initialMeta.activeFilterId ?? previous.activeFilterId,
      canvasJSON: canvasJSON ?? previous.canvasJSON,
      formatKey,
      networkId,
    }));
  }, [canvasJSON, formatKey, initialMeta.activeFilterCSS, initialMeta.activeFilterId, networkId]);

  // --- MOBILE GUARD ---
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // --- HISTORY HELPERS ---
  const captureCanvasSnapshot = useCallback(() => {
    const canvas = fabricCanvas.current;
    if (!canvas) {
      return null;
    }

    return cloneSnapshot(canvas.toJSON() as SerializedCanvas);
  }, []);

  const refreshCanvasPreview = useCallback(() => {
    const canvas = fabricCanvas.current;
    if (!canvas) {
      return;
    }

    const longEdge = Math.max(canvas.getWidth(), canvas.getHeight());
    const multiplier = Math.max(0.16, Math.min(0.34, 240 / longEdge));
    const nextPreview = canvas.toDataURL({
      format: "png",
      multiplier,
      quality: 1,
    });

    setCanvasPreviewDataURL(nextPreview);
  }, []);

  const syncSelection = useCallback(() => {
    const nextObject = fabricCanvas.current?.getActiveObject() ?? null;
    setActiveObject(nextObject);
    setSelectionVersion((value) => value + 1);
  }, []);

  const pushToHistory = useCallback(
    (markDirty: boolean) => {
      const snapshot = captureCanvasSnapshot();
      if (!snapshot) {
        return;
      }

      const serializedSnapshot = JSON.stringify(snapshot);
      const currentSnapshot = historyStack.current[historyIndex.current];

      if (
        currentSnapshot &&
        JSON.stringify(currentSnapshot) === serializedSnapshot
      ) {
        return;
      }

      if (historyIndex.current < historyStack.current.length - 1) {
        historyStack.current = historyStack.current.slice(
          0,
          historyIndex.current + 1
        );
      }

      historyStack.current.push(snapshot);
      historyIndex.current = historyStack.current.length - 1;

      setEditorState((previous) => ({
        ...previous,
        canvasJSON: snapshot,
        isDirty: markDirty ? true : previous.isDirty,
      }));
    },
    [captureCanvasSnapshot]
  );

  const scheduleHistoryPush = useCallback(
    (markDirty: boolean) => {
      if (historyTimeoutRef.current) {
        window.clearTimeout(historyTimeoutRef.current);
      }

      historyTimeoutRef.current = window.setTimeout(() => {
        pushToHistory(markDirty);
      }, 300);
    },
    [pushToHistory]
  );

  const schedulePreviewRefresh = useCallback(() => {
    if (previewTimeoutRef.current) {
      window.clearTimeout(previewTimeoutRef.current);
    }

    previewTimeoutRef.current = window.setTimeout(() => {
      refreshCanvasPreview();
    }, 120);
  }, [refreshCanvasPreview]);

  const applyCanvasMutation = useCallback(() => {
    if (isRestoringRef.current) {
      return;
    }

    setEditorState((previous) => ({ ...previous, isDirty: true }));
    syncSelection();
    scheduleHistoryPush(true);
    schedulePreviewRefresh();
  }, [scheduleHistoryPush, schedulePreviewRefresh, syncSelection]);

  const loadSnapshot = useCallback(
    async (snapshot: SerializedCanvas) => {
      const canvas = fabricCanvas.current;
      if (!canvas) {
        return;
      }

      isRestoringRef.current = true;
      await canvas.loadFromJSON(snapshot);
      canvas.requestRenderAll();
      setEditorState((previous) => ({ ...previous, canvasJSON: snapshot }));
      syncSelection();
      refreshCanvasPreview();
      window.setTimeout(() => {
        isRestoringRef.current = false;
      }, 0);
    },
    [refreshCanvasPreview, syncSelection]
  );

  // --- CANVAS INITIALIZATION ---
  useEffect(() => {
    if (isMobile || !canvasEl.current) {
      return;
    }

    let isMounted = true;

    const setupCanvas = async () => {
      await document.fonts.ready;

      const fabricModule = await import("fabric");
      if (!isMounted || !canvasEl.current) {
        return;
      }

      fabricModuleRef.current = fabricModule;
      fabricModule.FabricObject.customProperties = [
        ...FABRIC_JSON_PROPERTIES,
      ];

      const canvas = new fabricModule.Canvas(canvasEl.current, {
        height: formatConfig.canvas.height,
        preserveObjectStacking: true,
        selection: true,
        width: formatConfig.canvas.width,
      });

      const wrapperElement = canvas.wrapperEl;
      wrapperElement.style.position = "absolute";
      wrapperElement.style.inset = "0";
      wrapperElement.style.width = "100%";
      wrapperElement.style.height = "100%";

      const lowerCanvas = wrapperElement.querySelector("canvas");
      if (lowerCanvas) {
        lowerCanvas.style.width = "100%";
        lowerCanvas.style.height = "100%";
      }

      if (canvas.upperCanvasEl) {
        canvas.upperCanvasEl.style.width = "100%";
        canvas.upperCanvasEl.style.height = "100%";
      }

      fabricCanvas.current = canvas;

      const handleSelectionChange = () => {
        syncSelection();
      };

      const handleCanvasMutation = () => {
        applyCanvasMutation();
      };

      canvas.on("selection:created", handleSelectionChange);
      canvas.on("selection:updated", handleSelectionChange);
      canvas.on("selection:cleared", handleSelectionChange);
      canvas.on("object:added", handleCanvasMutation);
      canvas.on("object:modified", handleCanvasMutation);
      canvas.on("object:removed", handleCanvasMutation);
      canvas.on("text:changed", handleCanvasMutation);

      if (canvasJSON) {
        await canvas.loadFromJSON(canvasJSON as SerializedCanvas);
      } else {
        await seedEditorialTemplate(canvas, fabricModule, networkId, initialContent);
      }

      canvas.requestRenderAll();
      syncSelection();
      refreshCanvasPreview();
      pushToHistory(false);
      setIsCanvasReady(true);
    };

    void setupCanvas();

    return () => {
      isMounted = false;
      setIsCanvasReady(false);
      if (historyTimeoutRef.current) {
        window.clearTimeout(historyTimeoutRef.current);
      }
      if (previewTimeoutRef.current) {
        window.clearTimeout(previewTimeoutRef.current);
      }
      fabricCanvas.current?.dispose();
      fabricCanvas.current = null;
    };
  }, [
    applyCanvasMutation,
    canvasJSON,
    formatConfig.canvas.height,
    formatConfig.canvas.width,
    initialContent,
    isMobile,
    networkId,
    pushToHistory,
    refreshCanvasPreview,
    syncSelection,
  ]);

  // --- OBJECT ACTIONS ---
  const mutateActiveObject = useCallback(
    (mutator: (object: FabricObject) => void) => {
      const canvas = fabricCanvas.current;
      const object = canvas?.getActiveObject();

      if (!canvas || !object) {
        return;
      }

      mutator(object);
      object.setCoords();
      canvas.requestRenderAll();
      syncSelection();
      applyCanvasMutation();
    },
    [applyCanvasMutation, syncSelection]
  );

  const setObjectLocked = useCallback(
    (object: FabricObject, locked: boolean) => {
      object.set("isLocked", locked);
      object.set("hasControls", !locked);
      object.set("lockMovementX", locked);
      object.set("lockMovementY", locked);
      object.set("lockRotation", locked);
      object.set("lockScalingX", locked);
      object.set("lockScalingY", locked);
    },
    []
  );

  const handleDelete = useCallback(() => {
    const canvas = fabricCanvas.current;
    const object = canvas?.getActiveObject();

    if (!canvas || !object || object.get("role") === "background") {
      return;
    }

    canvas.remove(object);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    syncSelection();
    applyCanvasMutation();
  }, [applyCanvasMutation, syncSelection]);

  const handleDuplicate = useCallback(async () => {
    const canvas = fabricCanvas.current;
    const object = canvas?.getActiveObject();

    if (!canvas || !object) {
      return;
    }

    const clonedObject = (await object.clone([
      ...FABRIC_JSON_PROPERTIES,
    ])) as FabricObject;

    clonedObject.set("left", (object.left ?? 0) + 28);
    clonedObject.set("top", (object.top ?? 0) + 28);
    clonedObject.set("isLocked", false);

    canvas.add(clonedObject);
    canvas.setActiveObject(clonedObject);
    canvas.requestRenderAll();
    syncSelection();
    applyCanvasMutation();
  }, [applyCanvasMutation, syncSelection]);

  const handleBringForward = useCallback(() => {
    const canvas = fabricCanvas.current;
    const object = canvas?.getActiveObject();

    if (!canvas || !object) {
      return;
    }

    canvas.bringObjectForward(object);
    canvas.requestRenderAll();
    applyCanvasMutation();
  }, [applyCanvasMutation]);

  const handleSendBackward = useCallback(() => {
    const canvas = fabricCanvas.current;
    const object = canvas?.getActiveObject();

    if (!canvas || !object || object.get("role") === "background") {
      return;
    }

    canvas.sendObjectBackwards(object);
    canvas.requestRenderAll();
    applyCanvasMutation();
  }, [applyCanvasMutation]);

  const handleToggleLock = useCallback(() => {
    mutateActiveObject((object) => {
      setObjectLocked(object, !Boolean(object.get("isLocked")));
    });
  }, [mutateActiveObject, setObjectLocked]);

  const handleUndo = useCallback(async () => {
    if (historyIndex.current <= 0) {
      return;
    }

    historyIndex.current -= 1;
    const snapshot = historyStack.current[historyIndex.current];
    if (snapshot) {
      await loadSnapshot(snapshot);
    }
  }, [loadSnapshot]);

  const handleRedo = useCallback(async () => {
    if (historyIndex.current >= historyStack.current.length - 1) {
      return;
    }

    historyIndex.current += 1;
    const snapshot = historyStack.current[historyIndex.current];
    if (snapshot) {
      await loadSnapshot(snapshot);
    }
  }, [loadSnapshot]);

  // --- CONTENT ACTIONS ---
  const addTextbox = useCallback(
    async (role: "headline" | "body", fontFamily?: string) => {
      const canvas = fabricCanvas.current;
      const fabricModule = fabricModuleRef.current;

      if (!canvas || !fabricModule) {
        return;
      }

      const { Textbox } = fabricModule;
      const isHeadline = role === "headline";
      const textbox = new Textbox(
        isHeadline ? "Nuevo titular" : "Texto descriptivo",
        {
          fill: isHeadline ? "#F8FAFC" : "rgba(248,250,252,0.82)",
          fontFamily: fontFamily ?? "Inter, system-ui, sans-serif",
          fontSize: isHeadline ? canvas.getWidth() * 0.062 : canvas.getWidth() * 0.028,
          fontWeight: isHeadline ? 700 : 400,
          left: canvas.getWidth() * 0.1,
          top: canvas.getHeight() * (isHeadline ? 0.18 : 0.5),
          width: canvas.getWidth() * (isHeadline ? 0.72 : 0.55),
        }
      );

      textbox.set("role", role);
      textbox.set("id", `${role}-${Date.now()}`);

      canvas.add(textbox);
      canvas.setActiveObject(textbox);
      canvas.requestRenderAll();
      syncSelection();
      applyCanvasMutation();
    },
    [applyCanvasMutation, syncSelection]
  );

  const addAccentCard = useCallback(async () => {
    const canvas = fabricCanvas.current;
    const fabricModule = fabricModuleRef.current;

    if (!canvas || !fabricModule) {
      return;
    }

    const { Rect } = fabricModule;
    const card = new Rect({
      fill: "rgba(255,255,255,0.08)",
      height: canvas.getHeight() * 0.18,
      left: canvas.getWidth() * 0.1,
      rx: 32,
      ry: 32,
      top: canvas.getHeight() * 0.64,
      width: canvas.getWidth() * 0.8,
    });

    card.set("role", "shape");
    card.set("id", `shape-${Date.now()}`);

    canvas.add(card);
    canvas.setActiveObject(card);
    canvas.requestRenderAll();
    syncSelection();
    applyCanvasMutation();
  }, [applyCanvasMutation, syncSelection]);

  const handleAssetUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const canvas = fabricCanvas.current;
      const fabricModule = fabricModuleRef.current;
      const file = event.target.files?.[0];

      if (!canvas || !fabricModule || !file) {
        return;
      }

      const imageUrl = URL.createObjectURL(file);

      try {
        const image = (await fabricModule.FabricImage.fromURL(
          imageUrl,
          {},
          {
            left: canvas.getWidth() * 0.1,
            top: canvas.getHeight() * 0.18,
          }
        )) as FabricImage;

        const maxWidth = canvas.getWidth() * 0.78;
        const maxHeight = canvas.getHeight() * 0.52;
        const scale = Math.min(
          maxWidth / image.getScaledWidth(),
          maxHeight / image.getScaledHeight()
        );

        image.scale(scale);
        image.set("role", "image");
        image.set("id", `image-${Date.now()}`);

        canvas.add(image);
        canvas.setActiveObject(image);
        canvas.requestRenderAll();
        syncSelection();
        applyCanvasMutation();
      } finally {
        URL.revokeObjectURL(imageUrl);
        event.target.value = "";
      }
    },
    [applyCanvasMutation, syncSelection]
  );

  const applyTheme = useCallback(
    (theme: ThemeSwatch) => {
      const canvas = fabricCanvas.current;
      if (!canvas) {
        return;
      }

      const background = findObjectByRole(canvas, "background");
      if (background) {
        background.set("fill", theme.background);
      }

      const accent = findObjectByRole(canvas, "accent");
      if (accent) {
        accent.set("fill", theme.accent);
      }

      canvas.getObjects().forEach((object) => {
        const role = object.get("role");
        if (role === "headline") {
          object.set("fill", theme.text);
        }
        if (role === "body" || role === "footer") {
          object.set("fill", theme.text);
        }
      });

      canvas.requestRenderAll();
      applyCanvasMutation();
    },
    [applyCanvasMutation]
  );

  const handleFilterChange = useCallback((filterId: string, filterCSS: string) => {
    setEditorState((previous) => ({
      ...previous,
      activeFilterCSS: filterCSS,
      activeFilterId: filterId,
      isDirty: true,
    }));
  }, []);

  // --- PREVIEW AND EXPORT ---
  const openPreview = useCallback(async () => {
    const canvas = fabricCanvas.current;
    if (!canvas) {
      return;
    }

    const url = canvas.toDataURL({
      format: "png",
      multiplier: 1,
      quality: 1,
    });

    setPreviewDataURL(url);
    setIsPreviewOpen(true);
  }, []);

  const handleExport = useCallback(
    async (options: ExportOptions) => {
      const canvas = fabricCanvas.current;
      if (!canvas) {
        return;
      }

      setEditorState((previous) => ({ ...previous, isExporting: true }));

      try {
        await exportCanvasUHD(canvas, {
          ...options,
          activeFilterCSS: editorState.activeFilterCSS,
          filename: `noctra-${networkId}-${formatKey}`,
        });
      } finally {
        setEditorState((previous) => ({ ...previous, isExporting: false }));
        setIsExportDialogOpen(false);
      }
    },
    [editorState.activeFilterCSS, formatKey, networkId]
  );

  const handleQuickExport = useCallback(async () => {
    await handleExport({
      ...UHD_PRESET,
      activeFilterCSS: editorState.activeFilterCSS,
      filename: `noctra-${networkId}-${formatKey}`,
    });
  }, [editorState.activeFilterCSS, formatKey, handleExport, networkId]);

  const handleSave = useCallback(() => {
    const canvas = fabricCanvas.current;
    if (!canvas) {
      return;
    }

    const rawJSON = canvas.toJSON() as SerializedCanvas;
    const nextJSON = {
      ...rawJSON,
      __editorMeta: {
        activeFilterCSS: editorState.activeFilterCSS,
        activeFilterId: editorState.activeFilterId,
      },
    };
    const preview = canvas.toDataURL({
      format: "jpeg",
      multiplier: 0.5,
      quality: 0.6,
    });

    onSave?.(nextJSON, preview);
    setEditorState((previous) => ({
      ...previous,
      canvasJSON: nextJSON,
      isDirty: false,
      previewDataURL: preview,
    }));
  }, [editorState.activeFilterCSS, editorState.activeFilterId, onSave]);

  // --- RENDER HELPERS ---
  const renderShell = () => {
    const canvasStage = (
      <div className="relative h-full w-full">
        <canvas
          ref={canvasEl}
          className="absolute inset-0 h-full w-full"
          aria-label="Canvas del editor"
        />
      </div>
    );

    switch (networkId) {
      case "instagram":
        return (
          <InstagramShell
            className="h-full"
            format={resolveInstagramFormat(formatKey)}
            username={username}
            caption={initialContent?.caption || initialContent?.postText}
          >
            {canvasStage}
          </InstagramShell>
        );
      case "x":
        return (
          <XShell
            className="h-full"
            format={resolveXFormat(formatKey)}
            displayName={displayName}
            handle={normalizedHandle}
            tweetText={initialContent?.tweetText || initialContent?.postText}
          >
            {canvasStage}
          </XShell>
        );
      case "linkedin":
        return (
          <LinkedInShell
            className="h-full"
            format={resolveLinkedInFormat(formatKey)}
            fullName={displayName}
            jobTitle="social.noctra.studio"
            postText={initialContent?.postText || initialContent?.body}
          >
            {canvasStage}
          </LinkedInShell>
        );
    }
  };

  const renderLeftPanelContent = () => {
    switch (activeTab) {
      case "slides":
        return (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                Formato activo
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {formatConfig.label}
              </p>
              <p className="mt-2 text-sm text-white/60">
                {formatConfig.canvas.width}x{formatConfig.canvas.height}px
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => void addTextbox("headline")}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white transition-colors hover:bg-white/10"
              >
                <span>Agregar titular</span>
                <Type className="h-4 w-4 text-white/60" />
              </button>
              <button
                type="button"
                onClick={() => void addTextbox("body")}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white transition-colors hover:bg-white/10"
              >
                <span>Agregar cuerpo</span>
                <Sparkles className="h-4 w-4 text-white/60" />
              </button>
              <button
                type="button"
                onClick={() => void addAccentCard()}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white transition-colors hover:bg-white/10"
              >
                <span>Agregar bloque</span>
                <Layers3 className="h-4 w-4 text-white/60" />
              </button>
            </div>
          </div>
        );
      case "theme":
        return (
          <div className="space-y-3">
            {THEME_SWATCHES.map((theme) => (
              <button
                key={theme.label}
                type="button"
                onClick={() => applyTheme(theme)}
                className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition-colors hover:bg-white/10"
              >
                <span
                  className="grid h-11 w-11 shrink-0 grid-cols-2 overflow-hidden rounded-2xl border border-white/10"
                  aria-hidden="true"
                >
                  <span style={{ backgroundColor: theme.background }} />
                  <span style={{ backgroundColor: theme.accent }} />
                </span>
                <span>
                  <span className="block text-sm font-medium text-white">
                    {theme.label}
                  </span>
                  <span className="block text-xs text-white/55">
                    Fondo, acento y color de texto
                  </span>
                </span>
              </button>
            ))}
          </div>
        );
      case "assets":
        return (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-between rounded-2xl border border-dashed border-white/15 bg-white/[0.04] px-4 py-4 text-left text-sm text-white transition-colors hover:border-white/25 hover:bg-white/10"
            >
              <span>Subir imagen al canvas</span>
              <ImagePlus className="h-4 w-4 text-white/60" />
            </button>
            <p className="text-sm text-white/55">
              Importa un asset y colocalo sobre el shell de la red social.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                void handleAssetUpload(event);
              }}
            />
          </div>
        );
      case "filters":
        return (
          <FilterPanel
            activeFilterId={editorState.activeFilterId}
            onFilterChange={handleFilterChange}
            canvasPreviewDataURL={canvasPreviewDataURL}
          />
        );
      case "fonts":
        return (
          <div className="space-y-3">
            {FONT_OPTIONS.map((font) => (
              <button
                key={font.label}
                type="button"
                onClick={() => {
                  if (isTextboxObject(activeObject)) {
                    mutateActiveObject((object) => {
                      object.set("fontFamily", font.family);
                    });
                    return;
                  }

                  void addTextbox("headline", font.family);
                }}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition-colors hover:bg-white/10"
              >
                <span
                  className="block text-lg text-white"
                  style={{ fontFamily: font.family }}
                >
                  {font.label}
                </span>
                <span className="mt-1 block text-xs text-white/55">
                  Aplicar a la seleccion o crear un titular nuevo
                </span>
              </button>
            ))}
          </div>
        );
    }
  };

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#111111] p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm rounded-lg border border-white/10 bg-[#1e1e1e] p-6 text-center shadow-2xl"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-white/10 bg-white/5 mb-4">
            <Monitor className="h-6 w-6 text-white/70" />
          </div>
          <h1 className="text-lg font-bold text-white">Editor Desktop Requerido</h1>
          <p className="mt-2 text-xs leading-relaxed text-white/50">
            Noctra Studio requiere una pantalla más amplia para el diseño de precisión. Por favor, abre esta herramienta en tu computadora.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 inline-flex h-9 items-center justify-center rounded-md bg-white px-4 text-xs font-bold text-black hover:bg-white/90"
          >
            Cerrar
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] flex h-screen w-screen flex-col overflow-hidden bg-[var(--editor-bg)] text-white font-sans text-sm antialiased">
      {/* --- HEADER BAR --- */}
      <header className="flex h-10 items-center justify-between border-b border-[var(--editor-border)] bg-[var(--editor-surface)] px-3 shrink-0">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-gradient-to-br from-[#72F1B8] via-[#59B8FF] to-[#9B7BFF] text-[10px] font-black tracking-widest text-[#090D14]">
            N
          </div>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-bold text-white/90 leading-none">Noctra Studio</p>
            <p className="truncate text-[9px] text-white/30 uppercase tracking-[0.1em] mt-1 leading-none">
              {networkId} — {formatConfig?.label}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => void openPreview()}
            className="inline-flex h-7 items-center gap-1.5 rounded-sm border border-white/5 bg-white/5 px-2.5 text-[11px] font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Vista previa</span>
          </button>
          <button
            type="button"
            onClick={() => setIsExportDialogOpen(true)}
            className="inline-flex h-7 items-center gap-1.5 rounded-sm border border-white/5 bg-white/5 px-2.5 text-[11px] font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-sm px-2.5 text-[11px] font-bold transition-opacity hover:opacity-90",
              editorState.isDirty ? "bg-[var(--editor-accent)] text-white" : "bg-white/10 text-white/70"
            )}
          >
            <Save className="h-3.5 w-3.5" />
            <span>{editorState.isDirty ? "Guardar" : "Guardado"}</span>
          </button>
          <div className="mx-1 h-4 w-px bg-white/10" />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-white/40 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Cerrar editor"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* --- CONTENT AREA --- */}
      <div className="flex min-h-0 flex-1">
        <ResizableAside side="left" defaultWidth={260} minWidth={220} maxWidth={400}>
          <div className="flex border-b border-[var(--editor-border)] bg-black/10 p-1">
            {TAB_ITEMS.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex flex-1 flex-col items-center justify-center gap-1 rounded-sm py-2 text-[9px] font-bold uppercase tracking-tighter transition-colors",
                    isActive ? "bg-white/5 text-[var(--editor-accent)]" : "text-white/30 hover:bg-white/[0.03] hover:text-white/60"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-2 scrollbar-none">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
              >
                {renderLeftPanelContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </ResizableAside>

        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[var(--editor-bg)]">
          <CanvasToolbar
            activeObject={activeObject}
            onDelete={handleDelete}
            onDuplicate={() => void handleDuplicate()}
            onBringForward={handleBringForward}
            onSendBackward={handleSendBackward}
            onToggleLock={handleToggleLock}
            isLocked={activeObjectLocked}
            onPreview={() => void openPreview()}
            onExport={() => setIsExportDialogOpen(true)}
            onUndo={() => void handleUndo()}
            onRedo={() => void handleRedo()}
            canUndo={canUndo}
            canRedo={canRedo}
          />

          <div className="flex flex-1 items-center justify-center p-8 overflow-auto">
            <div
              className="relative shadow-2xl shadow-black/80 ring-1 ring-white/5"
              style={{
                maxWidth: shellWidth,
                width: shellWidth,
              }}
            >
              <div
                style={getCanvasRootStyle(
                  formatConfig.canvas.width,
                  formatConfig.canvas.height
                )}
              >
                {renderShell()}
              </div>
            </div>
          </div>

          {!isCanvasReady && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--editor-bg)]/80 backdrop-blur-sm">
              <div className="flex items-center gap-3 rounded-md border border-white/5 bg-[var(--editor-surface)] px-4 py-2 text-xs font-medium text-white/50 shadow-xl">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Cargando Noctra Engine...</span>
              </div>
            </div>
          )}
        </main>

        <ResizableAside side="right" defaultWidth={300} minWidth={260} maxWidth={500}>
          <div className="flex h-8 items-center border-b border-[var(--editor-border)] bg-black/10 px-3 shrink-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/20">
              {activeObject ? `Propiedades: ${getObjectLabel(activeObject)}` : "Documento"}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 scrollbar-none">
            {activeObject ? (
              <div className="space-y-4" key={selectionVersion}>
                {/* --- TRANSFORM --- */}
                <section className="space-y-2 rounded-sm border border-white/5 bg-white/[0.02] p-2.5">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/20">Transformas</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 rounded-sm border border-white/5 bg-black/20 px-2 py-1.5 focus-within:ring-1 focus-within:ring-[var(--editor-accent)]">
                      <span className="text-[8px] font-black text-white/20 w-3">X</span>
                      <input
                        type="number"
                        value={Math.round(objectPosition.left)}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          if (!isNaN(value)) mutateActiveObject(o => o.set("left", value));
                        }}
                        className="w-full bg-transparent text-[11px] text-white/80 outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2 rounded-sm border border-white/5 bg-black/20 px-2 py-1.5 focus-within:ring-1 focus-within:ring-[var(--editor-accent)]">
                      <span className="text-[8px] font-black text-white/20 w-3">Y</span>
                      <input
                        type="number"
                        value={Math.round(objectPosition.top)}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          if (!isNaN(value)) mutateActiveObject(o => o.set("top", value));
                        }}
                        className="w-full bg-transparent text-[11px] text-white/80 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 rounded-sm border border-white/5 bg-black/20 px-2 py-1.5 focus-within:ring-1 focus-within:ring-[var(--editor-accent)]">
                      <RotateCw className="h-3 w-3 text-white/20" />
                      <input
                        type="number"
                        value={Math.round(objectPosition.angle)}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          if (!isNaN(value)) mutateActiveObject(o => o.set("angle", value));
                        }}
                        className="w-full bg-transparent text-[11px] text-white/80 outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2 rounded-sm border border-white/5 bg-black/20 px-2 py-1.5 focus-within:ring-1 focus-within:ring-[var(--editor-accent)]">
                      <Eye className="h-3 w-3 text-white/20" />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={Math.round(objectPosition.opacity * 100)}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          if (!isNaN(value)) mutateActiveObject(o => o.set("opacity", value / 100));
                        }}
                        className="w-full bg-transparent text-[11px] text-white/80 outline-none"
                      />
                      <span className="text-[9px] text-white/20">%</span>
                    </div>
                  </div>
                </section>

                {/* --- APPEARANCE (Fill/Stroke) --- */}
                <section className="space-y-2 rounded-sm border border-white/5 bg-white/[0.02] p-2.5">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/20">Apariencia</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex flex-1 items-center gap-2 rounded-sm border border-white/5 bg-black/20 p-1.5">
                      <div className="relative h-5 w-5 overflow-hidden rounded-sm border border-white/10 ring-1 ring-inset ring-black/20">
                        <input
                          type="color"
                          value={typeof activeObject.get("fill") === "string" ? activeObject.get("fill") : "#ffffff"}
                          onChange={(e) => mutateActiveObject(o => o.set("fill", e.target.value))}
                          className="absolute -inset-1 h-[200%] w-[200%] cursor-pointer"
                        />
                      </div>
                      <span className="text-[10px] text-white/60">Relleno</span>
                    </div>

                    <div className="flex flex-1 items-center gap-2 rounded-sm border border-white/5 bg-black/20 p-1.5">
                      <div className="relative h-5 w-5 overflow-hidden rounded-sm border border-white/10 ring-1 ring-inset ring-black/20">
                        <input
                          type="color"
                          value={typeof activeObject.get("stroke") === "string" ? activeObject.get("stroke") : "#000000"}
                          onChange={(e) => mutateActiveObject(o => o.set("stroke", e.target.value))}
                          className="absolute -inset-1 h-[200%] w-[200%] cursor-pointer"
                        />
                      </div>
                      <span className="text-[10px] text-white/60">Trazo</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-sm border border-white/5 bg-black/20 px-2 py-1.5 focus-within:ring-1 focus-within:ring-[var(--editor-accent)]">
                   <Type className="h-3 w-3 text-white/20 shrink-0" />
                   <input
                     type="number"
                     min="0"
                     max="100"
                     value={Math.round(activeObject.get("strokeWidth") || 0)}
                     onChange={(event) => {
                       const value = Number(event.target.value);
                       if (!isNaN(value)) mutateActiveObject(o => o.set("strokeWidth", value));
                     }}
                     className="w-full bg-transparent text-[11px] text-white/80 outline-none"
                   />
                   <span className="text-[9px] text-white/20 uppercase">px</span>
                  </div>
                </section>

                {/* --- TYPOGRAPHY (Textbox only) --- */}
                {isTextboxObject(activeObject) && (
                  <section className="space-y-2 rounded-sm border border-white/5 bg-white/[0.02] p-2.5">
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-white/20">Tipografía</span>
                    </div>
                    
                    <div className="space-y-2">
                       <div className="flex items-center gap-2 rounded-sm border border-white/5 bg-black/20 px-2 py-1.5">
                         <select
                           value={activeObject.get("fontFamily")}
                           onChange={(e) => mutateActiveObject(o => o.set("fontFamily", e.target.value))}
                           className="w-full bg-transparent text-[11px] text-white/80 outline-none"
                         >
                           {FONT_OPTIONS.map(f => (
                             <option key={f.family} value={f.family} className="bg-[#1e1e1e]">{f.label}</option>
                           ))}
                         </select>
                       </div>

                       <div className="grid grid-cols-2 gap-2">
                         <div className="flex items-center gap-2 rounded-sm border border-white/5 bg-black/20 px-2 py-1.5">
                           <span className="text-[8px] font-black text-white/20 shrink-0">Aa</span>
                           <input
                             type="number"
                             value={Math.round(activeObject.get("fontSize") || 0)}
                             onChange={(e) => {
                               const value = Number(e.target.value);
                               if (!isNaN(value)) mutateActiveObject(o => o.set("fontSize", value));
                             }}
                             className="w-full bg-transparent text-[11px] text-white/80 outline-none"
                           />
                         </div>

                         <div className="flex items-center justify-center gap-0.5 rounded-sm border border-white/5 bg-black/20 p-0.5">
                            {[
                              { id: "left", icon: AlignLeft },
                              { id: "center", icon: AlignCenter },
                              { id: "right", icon: AlignRight }
                            ].map((btn) => {
                              const Icon = btn.icon;
                              const isSelected = activeObject.get("textAlign") === btn.id;
                              return (
                                <button
                                  key={btn.id}
                                  onClick={() => mutateActiveObject(o => o.set("textAlign", btn.id))}
                                  className={cn(
                                    "flex flex-1 h-6 items-center justify-center rounded-sm transition-colors",
                                    isSelected ? "bg-[var(--editor-accent)] text-white" : "text-white/20 hover:bg-white/5 hover:text-white/40"
                                  )}
                                >
                                  <Icon className="h-3 w-3" />
                                </button>
                              );
                            })}
                         </div>
                       </div>
                    </div>
                  </section>
                )}
                
                <section className="space-y-2 rounded-sm border border-white/5 bg-white/[0.02] p-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleLock}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 rounded-sm border py-2 text-[10px] font-bold transition-colors",
                        activeObjectLocked 
                          ? "border-[var(--editor-accent)] bg-[var(--editor-accent)]/10 text-[var(--editor-accent)]" 
                          : "border-white/5 bg-white/5 text-white/50 hover:bg-white/10"
                      )}
                    >
                      {activeObjectLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                      <span>{activeObjectLocked ? "Desbloquear" : "Bloquear"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDuplicate()}
                      className="flex h-8 w-8 items-center justify-center rounded-sm border border-white/5 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </section>
              </div>
            ) : (
              <div className="flex h-48 flex-col items-center justify-center rounded-sm border border-dashed border-white/5 bg-white/[0.01] p-6 text-center">
                <Search className="h-5 w-5 text-white/10 mb-2" />
                <p className="text-[10px] text-white/30 uppercase tracking-[0.15em] leading-relaxed">
                  Sin selección<br/>
                  <span className="text-[9px] normal-case lowercase tracking-normal">Selecciona un elemento para editar</span>
                </p>
              </div>
            )}
          </div>
        </ResizableAside>
      </div>

      {/* --- MODALS --- */}
      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        networkId={networkId}
        format={formatKey}
        canvasDataURL={previewDataURL ?? canvasPreviewDataURL ?? ""}
        activeFilterCSS={editorState.activeFilterCSS}
        onExport={handleQuickExport}
        isExporting={editorState.isExporting}
        username={username}
        displayName={displayName}
        handle={normalizedHandle}
        postText={initialContent?.postText || initialContent?.tweetText}
        caption={initialContent?.caption}
      />

      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        canvasSize={formatConfig.canvas}
        networkId={networkId}
        formatKey={formatKey}
        activeFilterCSS={editorState.activeFilterCSS}
        onConfirmExport={handleExport}
        isExporting={editorState.isExporting}
      />
    </div>
  );
}

export default dynamic(() => Promise.resolve(EditorShellClient), { ssr: false });
