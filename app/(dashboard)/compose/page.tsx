"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LinkedInPostPreview } from '@/components/linkedin/linkedin-preview'
import { XPostPreview } from '@/components/x/x-preview'
import { InstagramPostPreview } from '@/components/instagram/instagram-post-preview'

import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Calendar,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Copy,
  Download,
  ExternalLink,
  History,
  Image as ImageIcon,
  Layers3,
  Layout,
  Lightbulb,
  Loader2,
  Lock,
  Maximize2,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  MoveRight,
  PenSquare,
  Play,
  Plus,
  RefreshCcw,
  RefreshCw,
  Save,
  Search,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  Trash2,
  Upload,
  User,
  Users,
  Video,
  Wand2,
  X,
  type LucideIcon,
} from 'lucide-react'

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  getLanguageLevelLabel,
  stripHtml,
  type BrandPillar,
  type PlatformAudience,
  type StrategyResponse,
} from "@/lib/brand-strategy";
import { InstagramCarouselPreview } from "@/components/instagram/carousel-preview";
import { EditorSkeleton } from "@/components/editor/editor-skeleton";
import {
  LinkedInPdfGenerator,
  type LinkedInPdfGeneratorHandle,
} from "@/components/linkedin/pdf-generator";
import { TagsEditor } from "@/components/compose/tags-editor";
import { ExportRenderer, type ExportRendererHandle } from "@/components/instagram/export-renderer";
import { PostFeedback } from "@/components/post-feedback";
import { AIButton, type AIButtonState } from "@/components/ui/AIButton";
import { PlatformBadge } from "@/components/ui/PlatformBadge";
import {
  ANGLE_LIBRARY,
  formatPlatformLabel,
  getPlatformGuidance,
  platforms,
  type AngleSuggestion,
  type AssistanceLevel,
  type ComposeMode,
  type GeneratedContent,
  type Platform,
  type SuggestedIdea,
} from "@/lib/product";
import {
  ensureHashtags,
  estimateReadTime,
  getCaptionText,
  getCopyText,
  getDefaultFormat,
  getExportActionLabel,
  getFormatLabel,
  getPreviewText,
  getXTweetColor,
  inferPostFormat,
  isRecord,
  joinHashtags,
  platformFormatOptions,
  readInstagramSlides,
  readOptionalString,
  readLinkedInSlides,
  readString,
  readStringArray,
  readXThreadTweets,
  toVisualSearchHref,
  type InstagramCarouselSlide,
  type SlideBackgroundSelection,
  type XThreadTweet,
  type LinkedInCarouselSlide,
  type PostFormat,
  type SocialFormatOption,
  type XHookStrength,
  type VisualBrief,
  type ExportMetadata,
} from "@/lib/social-content";

import { parseMarkdownContent } from "@/lib/importers/markdown";
import {
  convertInstagramSingleToCarouselPreview,
  evaluateInstagramSaturation,
} from "@/lib/instagram-saturation";
import { writeVisualEditorDraft } from "@/lib/visual-editor-draft";

import {
  type CarouselEditorSavePayload,
  type CarouselEditorSlide,
} from "@/lib/instagram-carousel-editor";
import { renderElementToPng } from "@/lib/export/render-post";
import {
  exportInstagramPackage,
  exportLinkedInPackage,
  exportXPackage,
} from "@/lib/social-export";
import type {
  QuickActionFaqPost,
  QuickActionPlanItem,
  QuickActionThoughtLeadershipPost,
  QuickActionViralTrend,
} from "@/lib/quick-actions/types";

const assistanceStateKey = "noctra:compose:assistance";

const FabricEditor = dynamic(
  () =>
    import("@/components/editor/fabric-editor").then((mod) => mod.FabricEditor),
  {
    loading: () => <EditorSkeleton />,
    ssr: false,
  },
);

import { TemplateSelector } from "@/components/editor/template-selector";
import { templates, SlideTemplate } from "@/lib/editor/templates";
import { AngleLibrary } from "@/components/compose/angle-library";
import { ImageDrawer, type SelectedImage, type OverlayConfig } from "@/components/compose/image-drawer";
import { IdeaSwipeDeck } from "@/components/compose/idea-swipe-deck";
import { HookScore } from "@/components/compose/hook-score";
import { ImageTipsCard } from "@/components/compose/image-tips-card";
import { ContentImageSlot } from "@/components/compose/content-image-slot";
import { ContentScore } from "@/components/compose/content-score";
import {
  buildStructuredPostFields,
  isMissingStructuredPostColumnError,
  omitStructuredPostFields,
  resolveExternalImageSource,
  type ImageSource,
} from "@/lib/post-records";
import { uploadPostImage } from "@/lib/post-image-upload";
import type { EditorialScoreData } from "@/lib/content-score";



const modeCards: Array<{
  description: string;
  eyebrow: string;
  icon: LucideIcon;
  key: ComposeMode;
  label: string;
  stepLabel: string;
  title: string;
}> = [
  {
    key: "explore",
    label: "Explora",
    stepLabel: "Modo 1",
    icon: Sparkles,
    title: "No sé qué publicar",
    eyebrow: "La IA sugiere ideas para ti",
    description: "Empieza por exploración guiada según plataforma y contexto.",
  },
  {
    key: "idea",
    label: "Desarrolla",
    stepLabel: "Modo 2",
    icon: Layers3,
    title: "Tengo una idea",
    eyebrow: "La desarrollo contigo",
    description:
      "Trae una intuición cruda y conviértela en una pieza lista para publicar.",
  },
  {
    key: "direct",
    label: "Ejecuta",
    stepLabel: "Modo 3",
    icon: PenSquare,
    title: "Sé lo que quiero",
    eyebrow: "Editor directo",
    description: "Elige plataforma, ángulo y ejecuta sin pasos intermedios.",
  },
];

type StoredIdeaRow = {
  id: string;
  platform: Platform | null;
  raw_idea: string;
};

type ProfileRow = {
  assistance_level: AssistanceLevel | null;
};

type QuickActionKey =
  | "plan"
  | "repurpose"
  | "viral"
  | "caseStudy"
  | "thoughtLeadership"
  | "faq";

type RepurposePostOption = {
  content: Record<string, unknown> | null;
  created_at: string;
  id: string;
  platform: Platform;
  status: string;
};

type QuickActionOutput =
  | {
      kind: "generated";
      note?: string;
      platformOrder: Platform[];
      sourceLabel: string;
      stanceUsed?: string;
    }
  | {
      kind: "plan";
      plan: QuickActionPlanItem[];
      sourceLabel: string;
    }
  | {
      kind: "viral";
      platform: Platform;
      sourceLabel: string;
      trends: QuickActionViralTrend[];
    }
  | {
      kind: "faq";
      platform: Platform;
      posts: QuickActionFaqPost[];
      sourceLabel: string;
    };

type ComposeImageTarget =
  | { kind: "article-cover"; platform: "x" }
  | { kind: "carousel-slide"; platform: "instagram"; slideNumber: number }
  | { kind: "single-post"; platform: Platform }
  | { kind: "slides-item"; platform: "linkedin"; slideNumber: number }
  | { kind: "thread-item"; platform: "x"; tweetNumber: number };

type AssistanceState = {
  dismissed: boolean;
  usageCount: number;
};

type ExportStats = {
  count: number;
  lastExportedAt: string | null;
};

type InstagramCarouselPreviewState = {
  backgrounds: SlideBackgroundSelection[];
  slides: InstagramCarouselSlide[];
  sourceKey: string;
  suggestedSlides: number;
};

type AdaptPlatformStatus = "pending" | "in_progress" | "complete" | "error";

function getSuggestedIdeaKey(suggestedIdea: SuggestedIdea) {
  return `${suggestedIdea.title}-${suggestedIdea.angle}`;
}

function getInstagramSinglePreviewKey(result: GeneratedContent) {
  return JSON.stringify({
    body: readString(result.content.body || result.content.caption),
    caption: readString(result.content.caption),
    headline: readString(result.content.headline),
    postId: result.post_id ?? null,
    raw: result.raw,
  });
}

function isPlatform(value: string | null): value is Platform {
  return value === "instagram" || value === "linkedin" || value === "x";
}

function readAssistanceState(): AssistanceState {
  try {
    const raw = window.localStorage.getItem(assistanceStateKey);

    if (!raw) {
      return { dismissed: false, usageCount: 0 };
    }

    const parsed = JSON.parse(raw) as Partial<AssistanceState>;

    return {
      dismissed: Boolean(parsed.dismissed),
      usageCount: typeof parsed.usageCount === "number" ? parsed.usageCount : 0,
    };
  } catch {
    return { dismissed: false, usageCount: 0 };
  }
}

function writeAssistanceState(state: AssistanceState) {
  window.localStorage.setItem(assistanceStateKey, JSON.stringify(state));
}

function getContentPreview(
  platform: Platform,
  format: PostFormat,
  content: Record<string, unknown> | null,
  maxLength = 100,
) {
  if (!content) {
    return "Sin preview disponible.";
  }

  return getPreviewText(platform, format, content, maxLength);
}

function getQuickActionSourceLabel(label: string) {
  return `✦ Generado con: ${label}`;
}

function PlatformIcon({
  platform,
  className,
}: {
  platform: Platform;
  className?: string;
}) {
  if (platform === "instagram") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className={className}
        aria-hidden="true">
        <rect x="3.75" y="3.75" width="16.5" height="16.5" rx="5.25" />
        <circle cx="12" cy="12" r="3.5" />
        <circle cx="17.3" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (platform === "linkedin") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden="true">
        <path d="M6.26 8.28a1.52 1.52 0 1 0 0-3.04 1.52 1.52 0 0 0 0 3.04ZM4.96 9.84h2.6v8.35h-2.6V9.84Zm4.23 0h2.5v1.14h.04c.35-.66 1.2-1.35 2.48-1.35 2.66 0 3.15 1.75 3.15 4.02v4.54h-2.6v-4.03c0-.96-.02-2.2-1.34-2.2-1.35 0-1.56 1.05-1.56 2.13v4.1h-2.6V9.84Z" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true">
      <path d="m5.53 4.5 5.09 6.82L5.5 19.5h1.88l4.08-6.2 4.63 6.2h4.41l-5.38-7.2 4.76-7.8H18l-3.75 5.86L9.91 4.5H5.53Zm2.78 1.5h.87l8.01 12h-.87l-8-12Z" />
    </svg>
  );
}

const ideaPlaceholders = [
  "Ej: 'Quiero hablar de como el contexto cambia la calidad del contenido cuando pasas de publicar por publicar a publicar con una tesis clara...'",
  "Ej: 'Tengo una idea sobre por que muchas marcas suenan iguales en redes aunque tengan ofertas muy distintas...'",
  "Ej: 'Quiero convertir un insight de una reunion con clientes en un post util, no en una opinion vaga...'",
];

const IDEA_LOADING_PHASES = [
  "Inicializando",
  "Analizando tu marca",
  "Identificando oportunidad",
  "Generando ideas",
  "Finalizando detalles",
];

const ANGLE_LOADING_PHASES = [
  "Inicializando",
  "Analizando contexto",
  "Identificando ángulos",
  "Propuesta lista",
];

const GENERATION_LOADING_PHASES = [
  "Inicializando",
  "Identificando oportunidad",
  "Generando contenido",
  "Finalizando detalles",
  "Propuesta lista",
];

export default function ComposePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");
  const ideaId = searchParams.get("idea");
  const draftIdea = searchParams.get("draftIdea");
  const platformParam = searchParams.get("platform");
  const supabase = useMemo(() => createClient(), []);
  const ideaTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const outputSectionRef = useRef<HTMLElement | null>(null);
  const completedGenerationPlatformRef = useRef<Platform | null>(null);
  const [mode, setMode] = useState<ComposeMode | null>(null);
  const [activePlatform, setActivePlatform] = useState<Platform>("instagram");
  const [selectedFormats, setSelectedFormats] = useState<
    Record<Platform, PostFormat>
  >({
    instagram: "single",
    linkedin: "text",
    x: "tweet",
  });
  const [idea, setIdea] = useState("");
  const [sourceIdeaId, setSourceIdeaId] = useState<string | null>(null);
  const [angles, setAngles] = useState<AngleSuggestion[]>([]);
  const [selectedAngle, setSelectedAngle] = useState<string | null>(null);
  const [showAngleLibrary, setShowAngleLibrary] = useState(false);
  const [generatedResults, setGeneratedResults] = useState<
    Partial<Record<Platform, GeneratedContent>>
  >({});
  const [instagramCarouselPreviewState, setInstagramCarouselPreviewState] =
    useState<InstagramCarouselPreviewState | null>(null);
  const [
    instagramCarouselSuggestionDismissed,
    setInstagramCarouselSuggestionDismissed,
  ] = useState(false);
  const [loadingAngles, setLoadingAngles] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [adapting, setAdapting] = useState(false);
  const [adaptPlatformStatuses, setAdaptPlatformStatuses] = useState<
    Record<Platform, AdaptPlatformStatus>
  >({
    instagram: "pending",
    linkedin: "pending",
    x: "pending",
  });
  const [showAdaptSuccessPulse, setShowAdaptSuccessPulse] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [loadingIdea, setLoadingIdea] = useState(false);
  const [suggestingIdeas, setSuggestingIdeas] = useState(false);
  const [suggestedIdeas, setSuggestedIdeas] = useState<SuggestedIdea[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [assistanceLevel, setAssistanceLevel] =
    useState<AssistanceLevel>("balanced");
  const [brandPillars, setBrandPillars] = useState<BrandPillar[]>([]);
  const [platformAudiences, setPlatformAudiences] = useState<
    Partial<Record<Platform, PlatformAudience>>
  >({});
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [selectedPillarId, setSelectedPillarId] = useState<string | null>(null);
  const [pillarSelectionMode, setPillarSelectionMode] = useState<
    "auto" | "manual"
  >("auto");
  const [suggestingPillar, setSuggestingPillar] = useState(false);
  const [pillarSuggestionReason, setPillarSuggestionReason] = useState<
    string | null
  >(null);
  const [assistanceDismissed, setAssistanceDismissed] = useState(false);
  const [assistanceUsageCount, setAssistanceUsageCount] = useState(0);
  const [showGuidancePanel, setShowGuidancePanel] = useState(false);
  const [savedPostIds, setSavedPostIds] = useState<
    Partial<Record<Platform, string>>
  >({});
  const [savedSuggestedIdeaKeys, setSavedSuggestedIdeaKeys] = useState<
    Record<string, string>
  >({});
  const [ideaPlaceholderIndex, setIdeaPlaceholderIndex] = useState(0);
  const [copiedResultPlatform, setCopiedResultPlatform] =
    useState<Platform | null>(null);
  const [ideasButtonState, setIdeasButtonState] =
    useState<AIButtonState>("idle");
  const [anglesButtonState, setAnglesButtonState] =
    useState<AIButtonState>("idle");
  const [generateButtonState, setGenerateButtonState] =
    useState<AIButtonState>("idle");
  const [openQuickAction, setOpenQuickAction] = useState<QuickActionKey | null>(
    null,
  );
  const [runningQuickAction, setRunningQuickAction] =
    useState<QuickActionKey | null>(null);
  const [quickActionOutput, setQuickActionOutput] =
    useState<QuickActionOutput | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [enhancingWritingPlatform, setEnhancingWritingPlatform] =
    useState<Platform | null>(null);
  const [enhancementUndoState, setEnhancementUndoState] = useState<
    Partial<Record<Platform, { previous: GeneratedContent }>>
  >({});
  const [enhancementHighlightState, setEnhancementHighlightState] = useState<
    Partial<Record<Platform, boolean>>
  >({});
  const [editorialScoresByPlatform, setEditorialScoresByPlatform] = useState<
    Partial<Record<Platform, EditorialScoreData>>
  >({});
  const [enhancementScoreBaselines, setEnhancementScoreBaselines] = useState<
    Partial<Record<Platform, EditorialScoreData | null>>
  >({});
  const [isCarouselEditorOpen, setIsCarouselEditorOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [carouselEditorActiveIndex, setCarouselEditorActiveIndex] = useState(0);
  const [preSelectedTemplate, setPreSelectedTemplate] = useState<SlideTemplate | null>(null);
  const [applyTemplateToAll, setApplyTemplateToAll] = useState(false);
  const [planDays, setPlanDays] = useState(7);
  const [planPlatforms, setPlanPlatforms] = useState<Platform[]>([
    ...platforms,
  ]);
  const [repurposePosts, setRepurposePosts] = useState<RepurposePostOption[]>(
    [],
  );
  const [repurposePostsLoading, setRepurposePostsLoading] = useState(false);
  const [repurposePostsLoaded, setRepurposePostsLoaded] = useState(false);
  const [selectedRepurposePostId, setSelectedRepurposePostId] = useState<
    string | null
  >(null);
  const [generationHistory, setGenerationHistory] = useState<string[]>([]);
  const [viralPlatform, setViralPlatform] = useState<Platform>("linkedin");
  const [caseStudyClient, setCaseStudyClient] = useState("");
  const [caseStudyService, setCaseStudyService] = useState("");
  const [caseStudyResult, setCaseStudyResult] = useState("");
  const [caseStudyPlatform, setCaseStudyPlatform] =
    useState<Platform>("linkedin");
  const [thoughtLeadershipTopic, setThoughtLeadershipTopic] = useState("");
  const [thoughtLeadershipStance, setThoughtLeadershipStance] = useState("");
  const [thoughtLeadershipPlatform, setThoughtLeadershipPlatform] =
    useState<Platform>("linkedin");
  const [faqQuestions, setFaqQuestions] = useState("");
  const [faqPlatform, setFaqPlatform] = useState<Platform>("linkedin");
  const [faqCount, setFaqCount] = useState(3);
  const [faqActiveIndex, setFaqActiveIndex] = useState(0);
  const [instagramSlideCount, setInstagramSlideCount] = useState(5);
  const [instagramIncludeCover, setInstagramIncludeCover] = useState(true);
  const [instagramIncludeCta, setInstagramIncludeCta] = useState(true);
  const [linkedinSlideCount, setLinkedinSlideCount] = useState(8);
  const [showLinkedInPreview, setShowLinkedInPreview] = useState(false);
  
  // Image Drawer State
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [overlayConfig, setOverlayConfig] = useState<OverlayConfig | null>(null);
  const [imagePickerTarget, setImagePickerTarget] =
    useState<ComposeImageTarget | null>(null);
  const [regeneratingHook, setRegeneratingHook] = useState(false);
  const [exportingPlatform, setExportingPlatform] = useState<Platform | null>(
    null,
  );
  const [exportStatsByPostId, setExportStatsByPostId] = useState<
    Record<string, ExportStats>
  >({});
  
  // AI visual brief
  const [visualBrief, setVisualBrief] = useState<VisualBrief | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);

  const instagramExportRef = useRef<ExportRendererHandle>(null);
  const linkedInPdfRef = useRef<LinkedInPdfGeneratorHandle>(null);
  const enhancementUndoTimeoutRef = useRef<Partial<Record<Platform, number>>>(
    {},
  );
  const enhancementHighlightTimeoutRef = useRef<
    Partial<Record<Platform, number>>
  >({});

  const assistanceVisible =
    assistanceLevel !== "expert" &&
    !assistanceDismissed &&
    assistanceUsageCount < 10;
  const currentGuidance = getPlatformGuidance(activePlatform);
  const currentModeCard = mode
    ? (modeCards.find((card) => card.key === mode) ?? null)
    : null;
  const currentResult = generatedResults[activePlatform];
  const isImageDrawerOpen = imagePickerTarget !== null;
  const activePillar =
    brandPillars.find((pillar) => pillar.id === selectedPillarId) || null;
  const activeAudience = platformAudiences[activePlatform] || null;
  const currentQuickGeneratedOutput =
    quickActionOutput?.kind === "generated" ? quickActionOutput : null;
  const canGenerate =
    Boolean(idea.trim()) &&
    Boolean(selectedAngle) &&
    !generating &&
    !loadingIdea;
  const generationActionLabel =
    activePlatform === "instagram" && selectedFormats.instagram === "carousel"
      ? "Generar carrusel"
      : activePlatform === "x" && selectedFormats.x === "thread"
        ? "Generar hilo"
        : activePlatform === "x" && selectedFormats.x === "article"
          ? "Generar articulo"
          : activePlatform === "linkedin" &&
              (selectedFormats.linkedin === "document" ||
                selectedFormats.linkedin === "carousel")
            ? "Generar documento"
            : "Generar contenido";

  const getCarouselEditorMeta = (result: GeneratedContent | undefined) => {
    const metadata = isRecord(result?.export_metadata)
      ? result?.export_metadata
      : null;

    return {
      activeFilterCSS:
        typeof metadata?.active_filter_css === "string"
          ? metadata.active_filter_css
          : "",
      activeFilterId:
        typeof metadata?.active_filter_id === "string"
          ? metadata.active_filter_id
          : "none",
      editedSlides: Array.isArray(metadata?.edited_carousel_slides)
        ? (metadata.edited_carousel_slides as CarouselEditorSlide[])
        : [],
      slideBackgrounds: Array.isArray(metadata?.slide_backgrounds)
        ? (metadata.slide_backgrounds as SlideBackgroundSelection[])
        : [],
    };
  };

  const createInstagramSingleSlide = (
    content: Record<string, unknown>,
  ): InstagramCarouselSlide => {
    const slideType = readString(content.type)
    const textOrder = readOptionalString(content.text_order) as InstagramCarouselSlide["text_order"] | null
    const headlineSize = readOptionalString(content.headline_size) as InstagramCarouselSlide["headline_size"] | null
    const bodySize = readOptionalString(content.body_size) as InstagramCarouselSlide["body_size"] | null
    const verticalAlignment = readOptionalString(content.vertical_alignment) as InstagramCarouselSlide["vertical_alignment"] | null
    const verticalOffset =
      typeof content.vertical_offset === "number" ? content.vertical_offset : undefined

    return {
      body: readString(content.body || content.caption),
      color_suggestion: readOptionalString(content.color_suggestion),
      design_note: readString(content.design_note),
      headline: readString(content.headline),
      slide_number: 1,
      type:
        slideType === "cover" || slideType === "cta" || slideType === "content"
          ? slideType
          : "content",
      visual_direction: readString(content.visual_direction),
      stat_or_example: readOptionalString(content.stat_or_example),
      bg_type:
        (readString(content.bg_type) as InstagramCarouselSlide["bg_type"]) ||
        "solid",
      bg_reasoning: readString(content.bg_reasoning),
      unsplash_query: readOptionalString(content.unsplash_query),
      gradient_style:
        (readOptionalString(
          content.gradient_style,
        ) as InstagramCarouselSlide["gradient_style"]) ?? null,
      suggested_template: readOptionalString(content.suggested_template),
      text_order:
        textOrder === "body-first" || textOrder === "headline-first"
          ? textOrder
          : undefined,
      headline_size: headlineSize ?? undefined,
      body_size: bodySize ?? undefined,
      vertical_alignment:
        verticalAlignment === "top" ||
        verticalAlignment === "middle" ||
        verticalAlignment === "bottom"
          ? verticalAlignment
          : undefined,
      vertical_offset: verticalOffset,
    }
  };

  const instagramSingleSaturation = useMemo(() => {
    const instagramResult = generatedResults.instagram;

    if (!instagramResult) {
      return null;
    }

    const format = inferPostFormat(
      "instagram",
      instagramResult.content,
      instagramResult.format,
    );

    if (format !== "single") {
      return null;
    }

    const body = readString(
      instagramResult.content.body || instagramResult.content.caption,
    );

    if (!body.trim()) {
      return null;
    }

    return {
      evaluation: evaluateInstagramSaturation(body),
      slide: createInstagramSingleSlide(instagramResult.content),
      sourceKey: getInstagramSinglePreviewKey(instagramResult),
    };
  }, [generatedResults.instagram]);

  const isInstagramPreviewCarouselActive =
    Boolean(instagramCarouselPreviewState?.sourceKey) &&
    instagramCarouselPreviewState?.sourceKey ===
      instagramSingleSaturation?.sourceKey;

  const getInstagramEditorPayload = () => {
    const instagramResult = generatedResults.instagram;

    if (!instagramResult) {
      return null;
    }

    const format = inferPostFormat(
      "instagram",
      instagramResult.content,
      instagramResult.format,
    );

    if (format !== "carousel" && format !== "single") {
      return null;
    }

    const slides =
      format === "carousel"
        ? readInstagramSlides(instagramResult.content.slides)
        : [createInstagramSingleSlide(instagramResult.content)];
    const metadata = getCarouselEditorMeta(instagramResult);

    return {
      activeFilterCSS: metadata.activeFilterCSS,
      activeFilterId: metadata.activeFilterId,
      angle: readString(instagramResult.angle),
      editedSlides: metadata.editedSlides,
      slideBackgrounds: metadata.slideBackgrounds,
      slides,
      caption: readString(instagramResult.content.caption),
      hashtags: readStringArray(instagramResult.content.hashtags),
    };
  };

  useEffect(() => {
    let isActive = true;

    async function loadSessionState() {
      const assistanceState = readAssistanceState();

      if (isActive) {
        setAssistanceDismissed(assistanceState.dismissed);
        setAssistanceUsageCount(assistanceState.usageCount);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !isActive) {
        return;
      }

      setUserId(user.id);

      const { data } = await supabase
        .from("profiles")
        .select("assistance_level")
        .eq("id", user.id)
        .maybeSingle();

      const profile = data as ProfileRow | null;

      if (isActive && profile?.assistance_level) {
        setAssistanceLevel(profile.assistance_level);
      }
    }

    void loadSessionState();

    return () => {
      isActive = false;
    };
  }, [supabase]);

  useEffect(() => {
    if (
      instagramCarouselPreviewState &&
      instagramCarouselPreviewState.sourceKey !== instagramSingleSaturation?.sourceKey
    ) {
      setInstagramCarouselPreviewState(null);
    }
  }, [instagramCarouselPreviewState, instagramSingleSaturation?.sourceKey]);

  useEffect(() => {
    let isActive = true;

    async function loadStrategy() {
      setStrategyLoading(true);

      try {
        const response = await fetch("/api/settings/strategy");
        const data = (await response.json()) as StrategyResponse & {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error || "No fue posible cargar la estrategia.");
        }

        if (!isActive) {
          return;
        }

        setBrandPillars(data.pillars || []);
        setPlatformAudiences(
          (data.audiences || []).reduce<
            Partial<Record<Platform, PlatformAudience>>
          >((accumulator, audience) => {
            accumulator[audience.platform] = audience;
            return accumulator;
          }, {}),
        );
        setSelectedPillarId((current) =>
          (data.pillars || []).some((pillar) => pillar.id === current)
            ? current
            : null,
        );
      } catch (error) {
        if (isActive) {
          console.error("Failed to load strategy", error);
        }
      } finally {
        if (isActive) {
          setStrategyLoading(false);
        }
      }
    }

    void loadStrategy();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    setIdeasButtonState("idle");
  }, [activePlatform]);

  useEffect(() => {
    setAnglesButtonState("idle");
  }, [activePlatform, idea]);

  useEffect(() => {
    setGenerateButtonState("idle");
  }, [activePlatform, idea, selectedAngle, selectedPillarId]);

  useEffect(() => {
    if (brandPillars.length === 0) {
      setSelectedPillarId(null);
      setPillarSuggestionReason(null);
      setSuggestingPillar(false);
      return;
    }

    if (pillarSelectionMode === "manual") {
      return;
    }

    const trimmedIdea = idea.trim();

    if (!trimmedIdea) {
      setSelectedPillarId(null);
      setPillarSuggestionReason(null);
      setSuggestingPillar(false);
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setSuggestingPillar(true);

      try {
        const response = await fetch("/api/content/suggest-pillar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idea: trimmedIdea }),
        });
        const data = (await response.json()) as {
          confidence?: "high" | "low" | "medium";
          error?: string;
          pillar_id?: string | null;
          reason?: string;
        };

        if (!response.ok) {
          throw new Error(data.error || "No fue posible sugerir un pilar.");
        }

        if (!cancelled) {
          setSelectedPillarId(data.pillar_id || null);
          setPillarSuggestionReason(data.reason || null);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to suggest pillar", error);
        }
      } finally {
        if (!cancelled) {
          setSuggestingPillar(false);
        }
      }
    }, 420);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [brandPillars, idea, pillarSelectionMode]);

  useEffect(() => {
    if (isPlatform(platformParam)) {
      setActivePlatform(platformParam);
    }

    const templateIdParam = searchParams.get("templateId");
    if (templateIdParam && templates[templateIdParam]) {
      setPreSelectedTemplate(templates[templateIdParam]);
      setIsCarouselEditorOpen(true);
      setMode("direct");
      setActivePlatform("instagram");
    }

    if (
      modeParam === "explore" ||
      modeParam === "idea" ||
      modeParam === "direct"
    ) {
      setMode(modeParam);
    }

    if (draftIdea) {
      setIdea(draftIdea);
      setPillarSelectionMode("auto");
      setSourceIdeaId(null);
      setMode("idea");
      return;
    }

    if (!ideaId) {
      return;
    }

    let cancelled = false;

    async function loadIdea() {
      setLoadingIdea(true);
      setErrorMessage(null);

      try {
        const { data, error } = await supabase
          .from("content_ideas")
          .select("id, raw_idea, platform")
          .eq("id", ideaId)
          .maybeSingle();

        const storedIdea = data as StoredIdeaRow | null;

        if (error) {
          throw error;
        }

        if (!cancelled && storedIdea) {
          setIdea(storedIdea.raw_idea);
          setPillarSelectionMode("auto");
          setSourceIdeaId(storedIdea.id);
          if (storedIdea.platform) {
            setActivePlatform(storedIdea.platform);
          }
          setMode("idea");
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "No fue posible cargar la idea seleccionada.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingIdea(false);
        }
      }
    }

    void loadIdea();

    return () => {
      cancelled = true;
    };
  }, [draftIdea, ideaId, modeParam, platformParam, supabase]);

  useEffect(() => {
    if (mode !== "idea" && mode !== "direct") {
      return;
    }

    const intervalId = window.setInterval(() => {
      setIdeaPlaceholderIndex(
        (current) => (current + 1) % ideaPlaceholders.length,
      );
    }, 3600);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [mode]);

  useEffect(() => {
    const textarea = ideaTextareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "0px";
    textarea.style.height = `${Math.max(textarea.scrollHeight, 120)}px`;
  }, [idea, mode]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToastMessage(null);
    }, 2600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toastMessage]);

  useEffect(() => {
    return () => {
      Object.values(enhancementUndoTimeoutRef.current).forEach((timeoutId) => {
        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }
      });
      Object.values(enhancementHighlightTimeoutRef.current).forEach(
        (timeoutId) => {
          if (timeoutId) {
            window.clearTimeout(timeoutId);
          }
        },
      );
    };
  }, []);

  useEffect(() => {
    const completedPlatform = completedGenerationPlatformRef.current;
    const outputSection = outputSectionRef.current;

    if (
      !completedPlatform ||
      !generatedResults[completedPlatform] ||
      !outputSection
    ) {
      return;
    }

    completedGenerationPlatformRef.current = null;

    const timeoutId = window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          outputSection.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      });
      setToastMessage("Tu contenido está listo ↑");
    }, 120);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [generatedResults]);

  useEffect(() => {
    const postIds = Object.values(generatedResults)
      .map((result) => result?.post_id)
      .filter((value): value is string => Boolean(value))
      .filter((value) => !exportStatsByPostId[value]);

    if (postIds.length === 0) {
      return;
    }

    let cancelled = false;

    async function loadStats() {
      const entries = await Promise.all(
        postIds.map(async (postId) => {
          const [{ count }, { data: lastRows }] = await Promise.all([
            supabase
              .from("exports")
              .select("*", { count: "exact", head: true })
              .eq("post_id", postId),
            supabase
              .from("exports")
              .select("exported_at")
              .eq("post_id", postId)
              .order("exported_at", { ascending: false })
              .limit(1),
          ]);

          return [
            postId,
            {
              count: count ?? 0,
              lastExportedAt:
                (lastRows as Array<{ exported_at: string }> | null)?.[0]
                  ?.exported_at ?? null,
            },
          ] as const;
        }),
      );

      if (cancelled) {
        return;
      }

      setExportStatsByPostId((current) => ({
        ...current,
        ...Object.fromEntries(entries),
      }));
    }

    void loadStats();

    return () => {
      cancelled = true;
    };
  }, [exportStatsByPostId, generatedResults, supabase]);

  const persistAssistanceState = (nextState: AssistanceState) => {
    setAssistanceDismissed(nextState.dismissed);
    setAssistanceUsageCount(nextState.usageCount);
    writeAssistanceState(nextState);
  };

  const setFormatForPlatform = (platform: Platform, format: PostFormat) => {
    setSelectedFormats((current) => ({ ...current, [platform]: format }));
  };

  const updateGeneratedResult = (
    platform: Platform,
    updater: (result: GeneratedContent) => GeneratedContent,
  ) => {
    setGeneratedResults((current) => {
      const existing = current[platform];

      if (!existing) {
        return current;
      }

      return {
        ...current,
        [platform]: updater(existing),
      };
    });
  };

  const ensureCurrentUserId = async () => {
    if (userId) {
      return userId;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Necesitas iniciar sesión para continuar.");
    }

    setUserId(user.id);
    return user.id;
  };

  const buildPostPayload = (
    platform: Platform,
    result: GeneratedContent,
    overrides?: Partial<GeneratedContent>,
  ) => {
    const nextResult = {
      ...result,
      ...overrides,
      content: overrides?.content ?? result.content,
      export_metadata: overrides?.export_metadata ?? result.export_metadata,
    };
    const inferredFormat = inferPostFormat(
      platform,
      nextResult.content,
      nextResult.format,
    );
    const structuredFields = buildStructuredPostFields({
      content: nextResult.content,
      export_metadata: nextResult.export_metadata,
      format: inferredFormat,
      platform,
    });

    return {
      angle: nextResult.angle,
      article_data: structuredFields.article_data,
      carousel_slides: structuredFields.carousel_slides,
      content: nextResult.content,
      export_metadata: nextResult.export_metadata ?? {},
      format: inferredFormat,
      image_url: structuredFields.image_url,
      pillar_id: nextResult.pillar_id || selectedPillarId,
      platform,
      post_type: structuredFields.post_type,
      slides_data: structuredFields.slides_data,
      thread_items: structuredFields.thread_items,
    };
  };

  const persistGeneratedPost = async (
    platform: Platform,
    nextResult: GeneratedContent,
  ) => {
    if (!nextResult.post_id) {
      return;
    }

    const nextUserId = await ensureCurrentUserId();
    let { error } = await supabase
      .from("posts")
      .update(buildPostPayload(platform, nextResult))
      .eq("id", nextResult.post_id)
      .eq("user_id", nextUserId);

    if (error && isMissingStructuredPostColumnError(error)) {
      const fallback = await supabase
        .from("posts")
        .update(omitStructuredPostFields(buildPostPayload(platform, nextResult)))
        .eq("id", nextResult.post_id)
        .eq("user_id", nextUserId);

      error = fallback.error;
    }

    if (error) {
      throw error;
    }
  };

  const applyGeneratedResultUpdate = async (
    platform: Platform,
    updater: (result: GeneratedContent) => GeneratedContent,
  ) => {
    const current = generatedResults[platform];

    if (!current) {
      return;
    }

    const nextResult = updater(current);
    updateGeneratedResult(platform, () => nextResult);

    try {
      await persistGeneratedPost(platform, nextResult);
    } catch (error) {
      console.error("Failed to persist post media", error);
      setToastMessage("Se actualizó localmente, pero no se pudo guardar en Supabase.");
    }
  };

  const clearEnhancementUndo = (platform: Platform) => {
    const undoTimeoutId = enhancementUndoTimeoutRef.current[platform];

    if (undoTimeoutId) {
      window.clearTimeout(undoTimeoutId);
      delete enhancementUndoTimeoutRef.current[platform];
    }

    setEnhancementUndoState((current) => {
      const next = { ...current };
      delete next[platform];
      return next;
    });
    setEnhancementScoreBaselines((current) => {
      const next = { ...current };
      delete next[platform];
      return next;
    });
  };

  const triggerEnhancementHighlight = (platform: Platform) => {
    const existingTimeout = enhancementHighlightTimeoutRef.current[platform];

    if (existingTimeout) {
      window.clearTimeout(existingTimeout);
    }

    setEnhancementHighlightState((current) => ({
      ...current,
      [platform]: true,
    }));

    enhancementHighlightTimeoutRef.current[platform] = window.setTimeout(() => {
      setEnhancementHighlightState((current) => {
        const next = { ...current };
        delete next[platform];
        return next;
      });
      delete enhancementHighlightTimeoutRef.current[platform];
    }, 1800);
  };

  const getResultPillarLabel = (result: GeneratedContent) => {
    const pillarId = result.pillar_id || selectedPillarId;
    return (
      brandPillars.find((pillar) => pillar.id === pillarId)?.name ||
      activePillar?.name ||
      ""
    );
  };

  const handleEnhanceWriting = async (platform: Platform) => {
    const result = generatedResults[platform];

    if (!result || enhancingWritingPlatform === platform) {
      return;
    }

    const baselineScore = editorialScoresByPlatform[platform] ?? null;
    const previousResult = JSON.parse(
      JSON.stringify(result),
    ) as GeneratedContent;
    const format = inferPostFormat(platform, result.content, result.format);

    setEnhancingWritingPlatform(platform);
    setEnhancementScoreBaselines((current) => ({
      ...current,
      [platform]: baselineScore,
    }));

    try {
      const response = await fetch("/api/content/enhance-writing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          angle: result.angle,
          content: result.content,
          format,
          pillar: getResultPillarLabel(result),
          platform,
        }),
      });

      const data = (await response.json()) as {
        content?: Record<string, unknown>;
        error?: string;
      };

      if (!response.ok || !data.content) {
        throw new Error(
          data.error || "No se pudo mejorar el contenido. Intenta de nuevo.",
        );
      }

      const hasChanged =
        JSON.stringify(data.content) !== JSON.stringify(result.content);

      await applyGeneratedResultUpdate(platform, (current) => ({
        ...current,
        content: data.content ?? current.content,
      }));

      if (!hasChanged) {
        clearEnhancementUndo(platform);
        return;
      }

      clearEnhancementUndo(platform);
      setEnhancementUndoState((current) => ({
        ...current,
        [platform]: { previous: previousResult },
      }));
      enhancementUndoTimeoutRef.current[platform] = window.setTimeout(() => {
        clearEnhancementUndo(platform);
      }, 10000);
      triggerEnhancementHighlight(platform);
    } catch (error) {
      console.error("Failed to enhance writing", error);
      clearEnhancementUndo(platform);
      setToastMessage("No se pudo mejorar el contenido. Intenta de nuevo.");
    } finally {
      setEnhancingWritingPlatform((current) =>
        current === platform ? null : current,
      );
    }
  };

  const handleRevertEnhancedWriting = async (platform: Platform) => {
    const undoEntry = enhancementUndoState[platform];

    if (!undoEntry) {
      return;
    }

    clearEnhancementUndo(platform);

    await applyGeneratedResultUpdate(platform, () => undoEntry.previous);
    setToastMessage("Se revirtió la mejora.");
  };

  const openVisualSearch = (query: string) => {
    setImagePickerTarget({ kind: "single-post", platform: activePlatform });
  };

  const openLiveEditor = () => {
    const params = new URLSearchParams();
    params.set("platform", activePlatform);

    const result = generatedResults[activePlatform];

    if (activePlatform === "instagram" && result) {
      const format = inferPostFormat("instagram", result.content, result.format);
      const slides =
        format === "carousel"
          ? readInstagramSlides(result.content.slides)
          : [createInstagramSingleSlide(result.content)];
      const firstSlide = slides[0];

      if (firstSlide) {
        const firstBackground =
          getCarouselEditorMeta(result).slideBackgrounds.find(
            (background) => background.slide_number === firstSlide.slide_number,
          ) ?? {
            bg_type: firstSlide.bg_type,
            gradient_style: firstSlide.gradient_style ?? undefined,
            image_url: undefined,
            photographer: undefined,
            slide_number: firstSlide.slide_number,
            solid_color: firstSlide.color_suggestion || "#101417",
          };

        const query =
          readString(firstSlide.visual_direction) ||
          idea.trim() ||
          readString(result.angle);

        writeVisualEditorDraft({
          angle: readString(result.angle),
          background:
            firstBackground.bg_type === "image" && firstBackground.image_url
              ? {
                  type: "image",
                  imageThumb: firstBackground.image_url,
                  imageUrl: firstBackground.image_url,
                  photographer: firstBackground.photographer,
                }
              : firstBackground.bg_type === "gradient"
                ? {
                    type: "gradient",
                    gradientStyle:
                      (readOptionalString(firstBackground.gradient_style) as
                        | InstagramCarouselSlide["gradient_style"]
                        | null) ?? undefined,
                  }
                : {
                    type: "solid",
                    solidColor:
                      firstBackground.solid_color ||
                      firstSlide.color_suggestion ||
                      "#101417",
                  },
          platform: "instagram",
          query,
          slide: firstSlide,
          totalSlides: slides.length,
        });

        if (query) {
          params.set("keywords", query);
        }
      }
    } else if (idea.trim()) {
      params.set("keywords", idea.trim());
    }

    router.push(`/visual${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleImageConfirm = (image: SelectedImage, config: OverlayConfig) => {
    const target = imagePickerTarget;
    const source = resolveExternalImageSource(image.unsplashId);

    if (!target) {
      return;
    }

    if (target.kind === "single-post") {
      setSelectedImage(image);
      setOverlayConfig(config);
      setImagePickerTarget(null);
      return;
    }

    void applyGeneratedResultUpdate(target.platform, (current) => {
      if (target.kind === "article-cover") {
        return {
          ...current,
          content: {
            ...current.content,
            cover_image: image.url,
            cover_image_source: source,
          },
        };
      }

      if (target.kind === "thread-item") {
        const tweets = readXThreadTweets(current.content.tweets ?? current.content.thread).map(
          (tweet) =>
            tweet.number === target.tweetNumber
              ? {
                  ...tweet,
                  id: tweet.id ?? `tweet-${tweet.number}`,
                  media_source: source,
                  media_url: image.url,
                }
              : tweet
        );

        return {
          ...current,
          content: {
            ...current.content,
            tweets,
          },
        };
      }

      if (target.kind === "slides-item") {
        const slides = readLinkedInSlides(current.content.slides).map((slide) =>
          slide.number === target.slideNumber
            ? {
                ...slide,
                id: slide.id ?? `slide-${slide.number}`,
                image_source: source,
                image_url: image.url,
              }
            : slide
        );

        return {
          ...current,
          content: {
            ...current.content,
            slides,
          },
        };
      }

      const existingBackgrounds = Array.isArray((current.export_metadata as any)?.slide_backgrounds)
        ? ([...(current.export_metadata as any).slide_backgrounds] as Array<Record<string, unknown>>)
        : [];
      const otherBackgrounds = existingBackgrounds.filter(
        (background) => Number(background.slide_number) !== target.slideNumber
      );

      return {
        ...current,
        export_metadata: {
          ...(isRecord(current.export_metadata) ? current.export_metadata : {}),
          slide_backgrounds: [
            ...otherBackgrounds,
            {
              bg_type: "image",
              image_source: source,
              image_url: image.url,
              photographer: image.photographer,
              slide_number: target.slideNumber,
              overlayOpacity: config.dimming,
              blur: config.blur,
            },
          ],
        },
      };
    }).finally(() => {
      setImagePickerTarget(null);
    });
  };

  const removeImage = () => {
    setSelectedImage(null);
    setOverlayConfig(null);
  };

  const handleStructuredUpload = async (
    target: Exclude<ComposeImageTarget, { kind: "single-post"; platform: Platform }>,
    file: File,
  ) => {
    const current = generatedResults[target.platform];

    if (!current?.post_id) {
      setToastMessage("Genera el contenido antes de subir una imagen.");
      return;
    }

    const nextUserId = await ensureCurrentUserId();
    const upload = await uploadPostImage({
      file,
      postId: current.post_id,
      userId: nextUserId,
    });

    await applyGeneratedResultUpdate(target.platform, (result) => {
      if (target.kind === "article-cover") {
        return {
          ...result,
          content: {
            ...result.content,
            cover_image: upload.url,
            cover_image_source: "upload" satisfies ImageSource,
          },
        };
      }

      if (target.kind === "thread-item") {
        const tweets = readXThreadTweets(result.content.tweets ?? result.content.thread).map(
          (tweet) =>
            tweet.number === target.tweetNumber
              ? {
                  ...tweet,
                  id: tweet.id ?? `tweet-${tweet.number}`,
                  media_source: "upload" satisfies ImageSource,
                  media_url: upload.url,
                }
              : tweet
        );

        return {
          ...result,
          content: {
            ...result.content,
            tweets,
          },
        };
      }

      if (target.kind === "slides-item") {
        const slides = readLinkedInSlides(result.content.slides).map((slide) =>
          slide.number === target.slideNumber
            ? {
                ...slide,
                id: slide.id ?? `slide-${slide.number}`,
                image_source: "upload" satisfies ImageSource,
                image_url: upload.url,
              }
            : slide
        );

        return {
          ...result,
          content: {
            ...result.content,
            slides,
          },
        };
      }

      const existingBackgrounds = Array.isArray((result.export_metadata as any)?.slide_backgrounds)
        ? ([...(result.export_metadata as any).slide_backgrounds] as Array<Record<string, unknown>>)
        : [];
      const otherBackgrounds = existingBackgrounds.filter(
        (background) => Number(background.slide_number) !== target.slideNumber
      );

      return {
        ...result,
        export_metadata: {
          ...(isRecord(result.export_metadata) ? result.export_metadata : {}),
          slide_backgrounds: [
            ...otherBackgrounds,
            {
              bg_type: "image",
              image_source: "upload" satisfies ImageSource,
              image_url: upload.url,
              slide_number: target.slideNumber,
            },
          ],
        },
      };
    });
  };

  const openCarouselEditor = (activeIndex: number) => {
    setCarouselEditorActiveIndex(activeIndex);
    setIsTemplateModalOpen(true);
  };

  const handleCarouselEditorSave = (payload: CarouselEditorSavePayload) => {
    updateGeneratedResult("instagram", (current) => ({
      ...current,
      content:
        inferPostFormat("instagram", current.content, current.format) ===
        "single"
          ? (() => {
              const slide =
                payload.slides[0] ?? createInstagramSingleSlide(current.content);

              return {
                ...current.content,
                body: slide.body,
                headline: slide.headline,
                visual_direction: slide.visual_direction,
                stat_or_example: slide.stat_or_example,
                bg_type: slide.bg_type,
                bg_reasoning: slide.bg_reasoning,
                color_suggestion: slide.color_suggestion,
                design_note: slide.design_note,
                unsplash_query: slide.unsplash_query,
                gradient_style: slide.gradient_style,
                suggested_template: slide.suggested_template,
              };
            })()
          : {
              ...current.content,
              slides: payload.slides,
            },
      export_metadata: {
        ...(isRecord(current.export_metadata) ? current.export_metadata : {}),
        active_filter_css: payload.activeFilterCSS ?? "",
        active_filter_id: payload.activeFilterId ?? "none",
        edited_carousel_slides: payload.editorSlides,
        slide_backgrounds: payload.slideBackgrounds,
      },
    }));

    setIsCarouselEditorOpen(false);
    setToastMessage("Editor del carrusel guardado.");
  };

  const dismissAssistance = () => {
    persistAssistanceState({
      dismissed: true,
      usageCount: assistanceUsageCount,
    });
  };

  const incrementAssistanceUsage = () => {
    const nextState = {
      dismissed: assistanceDismissed,
      usageCount: assistanceUsageCount + 1,
    };

    persistAssistanceState(nextState);
  };

  const clearSavedPostIds = (platformKeys: Platform[]) => {
    setSavedPostIds((current) => {
      const next = { ...current };

      platformKeys.forEach((platform) => {
        delete next[platform];
      });

      return next;
    });
  };

  const scrollToOutput = () => {
    const outputSection = outputSectionRef.current;

    if (!outputSection) {
      return;
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        outputSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });
  };

  const showQuickActionToast = () => {
    setToastMessage("Error al generar. Intenta de nuevo.");
  };

  const toggleQuickAction = (action: QuickActionKey) => {
    setOpenQuickAction((current) => (current === action ? null : action));
  };

  const handleQuickActionError = () => {
    showQuickActionToast();
  };

  const requestSuggestedIdeas = async () => {
    setSuggestingIdeas(true);
    setIdeasButtonState("loading");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/content/suggest-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: activePlatform }),
      });
      const data = (await response.json()) as {
        error?: string;
        ideas?: SuggestedIdea[];
      };

      if (!response.ok) {
        throw new Error(data.error || "No fue posible sugerir ideas");
      }

      setSuggestedIdeas(data.ideas || []);
      setSavedSuggestedIdeaKeys({});
      setIdeasButtonState("success");
    } catch (error) {
      setIdeasButtonState("error");
      setErrorMessage(
        error instanceof Error ? error.message : "No fue posible sugerir ideas",
      );
    } finally {
      setSuggestingIdeas(false);
    }
  };

  const requestAngles = async () => {
    if (!idea.trim()) {
      return;
    }

    setLoadingAngles(true);
    setAnglesButtonState("loading");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/content/angles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, platform: activePlatform }),
      });
      const data = (await response.json()) as {
        angles?: AngleSuggestion[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "No fue posible sugerir ángulos");
      }

      setAngles(data.angles || []);
      setSelectedAngle(null);
      setShowAngleLibrary(false);
      setAnglesButtonState("success");
    } catch (error) {
      setAnglesButtonState("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No fue posible sugerir ángulos",
      );
    } finally {
      setLoadingAngles(false);
    }
  };

  const generateContent = async () => {
    if (!idea.trim() || !selectedAngle) {
      return;
    }

    setGenerating(true);
    setGenerateButtonState("loading");
    setErrorMessage(null);
    setQuickActionOutput(null);
    if (activePlatform === "instagram") {
      setInstagramCarouselPreviewState(null);
    }
    clearSavedPostIds([activePlatform]);

    try {
      const { data: brandVoice } = await supabase
        .from("brand_voice")
        .select("*")
        .limit(1)
        .maybeSingle();

      const selectedFormat =
        selectedFormats[activePlatform] ?? getDefaultFormat(activePlatform);

      const route =
        activePlatform === "instagram" && selectedFormat === "carousel"
          ? "/api/instagram/carousel"
          : activePlatform === "x" && selectedFormat === "thread"
            ? "/api/x/thread"
            : activePlatform === "x" && selectedFormat === "article"
              ? "/api/x/article"
              : activePlatform === "linkedin" &&
                  (selectedFormat === "document" ||
                    selectedFormat === "carousel")
                ? "/api/linkedin/carousel"
                : "/api/content/generate";

      const payload =
        route === "/api/instagram/carousel"
          ? {
              angle: selectedAngle,
              brand_voice: brandVoice || {},
              idea,
              include_cover: instagramIncludeCover,
              include_cta: instagramIncludeCta,
              pillar_id: selectedPillarId,
              slide_count: instagramSlideCount,
            }
          : route === "/api/linkedin/carousel"
            ? {
                angle: selectedAngle,
                brand_voice: brandVoice || {},
                idea,
                pillar_id: selectedPillarId,
                slide_count: linkedinSlideCount,
              }
            : {
                angle: selectedAngle,
                brand_voice: brandVoice || {},
                format: selectedFormat,
                idea,
                pillar_id: selectedPillarId,
                platform: activePlatform,
              };

      const response = await fetch(route, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as GeneratedContent & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "No fue posible generar contenido");
      }

      setGeneratedResults((current) => ({
        ...current,
        [activePlatform]: data,
      }));
      setSelectedFormats((current) => ({
        ...current,
        [activePlatform]: inferPostFormat(
          activePlatform,
          data.content,
          data.format,
        ),
      }));
      incrementAssistanceUsage();
      completedGenerationPlatformRef.current = activePlatform;
      setGenerateButtonState("success");

      // Trigger Stage 1: Visual Brief Generation
      void requestVisualBrief(data);
    } catch (error) {
      setGenerateButtonState("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No fue posible generar contenido",
      );
    } finally {
      setGenerating(false);
    }
  };

  const requestVisualBrief = async (generatedPost: GeneratedContent) => {
    if (activePlatform === 'x' && generatedPost.format !== 'article') return;
    
    setBriefLoading(true);
    try {
      const { data: brandVoice } = await supabase
        .from("brand_voice")
        .select("*")
        .limit(1)
        .maybeSingle();

      const response = await fetch('/api/images/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_content: {
            caption: getCaptionText(activePlatform, (generatedPost.format || "single") as PostFormat, generatedPost.content),
            platform: activePlatform,
            angle: generatedPost.angle,
          },
          brand_voice: brandVoice,
          post_id: generatedPost.post_id
        })
      });

      if (response.ok) {
        const data = await response.json();
        setVisualBrief(data);
      }
    } catch (err) {
      console.error('Failed to generate visual brief', err);
    } finally {
      setBriefLoading(false);
    }
  };

  const handleGenerateAction = () => {
    if (generateButtonState === "success" && generatedResults[activePlatform]) {
      scrollToOutput();
      return;
    }

    void generateContent();
  };

  const adaptToOtherPlatforms = async () => {
    if (!currentResult) {
      return;
    }

    const targetPlatforms = platforms.filter(
      (platform) => platform !== activePlatform,
    );

    setAdapting(true);
    setErrorMessage(null);
    setQuickActionOutput(null);
    setShowAdaptSuccessPulse(false);
    setAdaptPlatformStatuses({
      instagram:
        activePlatform === "instagram" ? "complete" : "pending",
      linkedin:
        activePlatform === "linkedin" ? "complete" : "pending",
      x: activePlatform === "x" ? "complete" : "pending",
    });

    try {
      clearSavedPostIds(targetPlatforms);

      const sourcePost = JSON.stringify(currentResult.content, null, 2);
      const settled = await Promise.allSettled(
        targetPlatforms.map(async (platform) => {
          setAdaptPlatformStatuses((current) => ({
            ...current,
            [platform]: "in_progress",
          }));

          const response = await fetch("/api/content/adapt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              source_platform: activePlatform,
              source_post: sourcePost,
              target_platforms: [platform],
            }),
          });

          const data = (await response.json()) as {
            adaptations?: Array<{
              content: Record<string, unknown>;
              platform: Platform;
            }>;
            error?: string;
          };

          if (!response.ok) {
            throw new Error(data.error || `No fue posible adaptar a ${formatPlatformLabel(platform)}`);
          }

          const adaptation = data.adaptations?.find(
            (item) => item.platform === platform,
          );

          if (!adaptation) {
            throw new Error(`No llegó adaptación para ${formatPlatformLabel(platform)}`);
          }

          setGeneratedResults((current) => ({
            ...current,
            [platform]: {
              angle: selectedAngle || "Adaptación",
              content: adaptation.content,
              platform,
              pillar_id: selectedPillarId,
              raw: idea,
            },
          }));

          setAdaptPlatformStatuses((current) => ({
            ...current,
            [platform]: "complete",
          }));

          return platform;
        }),
      );

      const failedPlatforms: string[] = [];
      settled.forEach((result, index) => {
        if (result.status === "rejected") {
          const platform = targetPlatforms[index];
          failedPlatforms.push(formatPlatformLabel(platform));
          setAdaptPlatformStatuses((current) => ({
            ...current,
            [platform]: "error",
          }));
        }
      });

      if (failedPlatforms.length > 0) {
        throw new Error(
          `No fue posible adaptar: ${failedPlatforms.join(", ")}`,
        );
      }

      scrollToOutput();
      setShowAdaptSuccessPulse(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No fue posible adaptar contenido",
      );
    } finally {
      setAdapting(false);
    }
  };

  useEffect(() => {
    if (!showAdaptSuccessPulse) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowAdaptSuccessPulse(false);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [showAdaptSuccessPulse]);

  const saveAsDraft = async (platform: Platform) => {
    const result = generatedResults[platform];

    if (!result) {
      return null;
    }

    if (savedPostIds[platform]) {
      return savedPostIds[platform] ?? null;
    }

    setSavingDraft(true);
    setErrorMessage(null);

    try {
      let nextUserId = userId;

      if (!nextUserId) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("Necesitas iniciar sesión para guardar el borrador.");
        }

        nextUserId = user.id;
        setUserId(user.id);
      }

      let ideaId = sourceIdeaId;

      if (ideaId) {
        const { error } = await supabase
          .from("content_ideas")
          .update({ platform, raw_idea: idea, status: "drafted" })
          .eq("id", ideaId)
          .eq("user_id", nextUserId);

        if (error) {
          throw error;
        }
      } else {
        const { data, error } = await supabase
          .from("content_ideas")
          .insert([
            {
              platform,
              raw_idea: idea,
              status: "drafted",
              user_id: nextUserId,
            },
          ])
          .select("id")
          .single();

        const createdIdea = data as { id: string } | null;

        if (error || !createdIdea) {
          throw error || new Error("No fue posible crear la idea base");
        }

        ideaId = createdIdea.id;
        setSourceIdeaId(createdIdea.id);
      }

      const postPayload = buildPostPayload(platform, result);

      if (result.post_id) {
        let { error: updateError } = await supabase
          .from("posts")
          .update({
            ...postPayload,
            idea_id: ideaId,
            status: "draft",
            user_id: nextUserId,
          })
          .eq("id", result.post_id)
          .eq("user_id", nextUserId);

        if (updateError && isMissingStructuredPostColumnError(updateError)) {
          const fallback = await supabase
            .from("posts")
            .update({
              ...omitStructuredPostFields(postPayload),
              idea_id: ideaId,
              status: "draft",
              user_id: nextUserId,
            })
            .eq("id", result.post_id)
            .eq("user_id", nextUserId);

          updateError = fallback.error;
        }

        if (updateError) {
          throw updateError;
        }

        setSavedPostIds((current) => ({
          ...current,
          [platform]: result.post_id!,
        }));
        return result.post_id;
      }

      let { data: postData, error: postError } = await supabase
        .from("posts")
        .insert([
          {
            ...postPayload,
            idea_id: ideaId,
            status: "draft",
            user_id: nextUserId,
          },
        ])
        .select("id")
        .single();

      if (postError && isMissingStructuredPostColumnError(postError)) {
        const fallback = await supabase
          .from("posts")
          .insert([
            {
              ...omitStructuredPostFields(postPayload),
              idea_id: ideaId,
              status: "draft",
              user_id: nextUserId,
            },
          ])
          .select("id")
          .single();

        postData = fallback.data;
        postError = fallback.error;
      }

      const createdPost = postData as { id: string } | null;

      if (postError || !createdPost) {
        throw postError || new Error("No fue posible guardar el borrador");
      }

      setSavedPostIds((current) => ({
        ...current,
        [platform]: createdPost.id,
      }));
      return createdPost.id;
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No fue posible guardar el borrador",
      );
      return null;
    } finally {
      setSavingDraft(false);
    }
  };

  const copyResult = async (platform: Platform) => {
    const result = generatedResults[platform];

    if (!result) {
      return;
    }

    const format = inferPostFormat(platform, result.content, result.format);
    await navigator.clipboard.writeText(
      getCopyText(platform, format, result.content),
    );
    setCopiedResultPlatform(platform);

    window.setTimeout(() => {
      setCopiedResultPlatform((current) =>
        current === platform ? null : current,
      );
    }, 1800);
  };

  const selectSuggestedIdea = (suggestedIdea: SuggestedIdea) => {
    setIdea(`${suggestedIdea.title}. ${suggestedIdea.hook}`);
    setPillarSelectionMode("auto");
    setSelectedAngle(null);
    setAngles([]);
    setMode("idea");
  };

  const saveSuggestedIdea = async (suggestedIdea: SuggestedIdea) => {
    const suggestionKey = getSuggestedIdeaKey(suggestedIdea);

    if (savedSuggestedIdeaKeys[suggestionKey]) {
      return;
    }

    setErrorMessage(null);

    try {
      let nextUserId = userId;

      if (!nextUserId) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("Necesitas iniciar sesión para guardar ideas.");
        }

        nextUserId = user.id;
        setUserId(user.id);
      }

      const rawIdea = `${suggestedIdea.title}. ${suggestedIdea.hook}`;
      const { data, error } = await supabase
        .from("content_ideas")
        .insert([
          {
            platform: activePlatform,
            raw_idea: rawIdea,
            status: "raw",
            user_id: nextUserId,
          },
        ])
        .select("id")
        .single();

      const createdIdea = data as { id: string } | null;

      if (error || !createdIdea) {
        throw error || new Error("No fue posible guardar la idea sugerida.");
      }

      setSavedSuggestedIdeaKeys((current) => ({
        ...current,
        [suggestionKey]: createdIdea.id,
      }));
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No fue posible guardar la idea sugerida.",
      );
    }
  };

  const applyQuickGeneratedOutput = ({
    note,
    platformOrder,
    results,
    savedIds,
    sourceLabel,
    stanceUsed,
  }: {
    note?: string;
    platformOrder: Platform[];
    results: Partial<Record<Platform, GeneratedContent>>;
    savedIds: Partial<Record<Platform, string>>;
    sourceLabel: string;
    stanceUsed?: string;
  }) => {
    setGeneratedResults((current) => ({ ...current, ...results }));
    setSavedPostIds((current) => ({ ...current, ...savedIds }));
    setQuickActionOutput({
      kind: "generated",
      note,
      platformOrder,
      sourceLabel,
      stanceUsed,
    });
    setActivePlatform(platformOrder[0] ?? activePlatform);
    setOpenQuickAction(null);
    scrollToOutput();
  };

  const fetchRepurposePosts = async () => {
    setRepurposePostsLoading(true);

    try {
      const { data, error } = await supabase
        .from("posts")
        .select("id, platform, status, created_at, content")
        .in("status", ["published", "draft"])
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        throw error;
      }

      const posts = ((data as RepurposePostOption[] | null) ?? []).filter(
        (post): post is RepurposePostOption =>
          post.platform === "instagram" ||
          post.platform === "linkedin" ||
          post.platform === "x",
      );

      setRepurposePosts(posts);
      setSelectedRepurposePostId(posts[0]?.id ?? null);
      setRepurposePostsLoaded(true);
    } catch {
      handleQuickActionError();
    } finally {
      setRepurposePostsLoading(false);
    }
  };

  const handleQuickActionChipClick = (action: QuickActionKey) => {
    toggleQuickAction(action);

    if (action === "repurpose" && openQuickAction !== "repurpose") {
      void fetchRepurposePosts();
    }
  };

  const runPlanQuickAction = async () => {
    setRunningQuickAction("plan");

    try {
      const response = await fetch("/api/quick-actions/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          days: planDays,
          platforms: planPlatforms,
          user_id: userId,
          history: generationHistory,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        plan?: QuickActionPlanItem[];
      };

      if (!response.ok || !data.plan) {
        throw new Error(data.error || "No fue posible generar el plan");
      }

      const newHistory = data.plan.map(item => `${item.platform}: ${item.hook}`);
      setGenerationHistory(prev => [...prev, ...newHistory].slice(-20));

      setQuickActionOutput({
        kind: "plan",
        plan: data.plan,
        sourceLabel: getQuickActionSourceLabel(`Planear ${planDays} días`),
      });
      setOpenQuickAction(null);
      scrollToOutput();
    } catch {
      handleQuickActionError();
    } finally {
      setRunningQuickAction(null);
    }
  };

  const handleImportMarkdown = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedPosts = parseMarkdownContent(text);
      
      if (importedPosts.length === 0) {
        setErrorMessage("No se encontraron publicaciones en el archivo MD.");
        return;
      }

      const results: Record<Platform, GeneratedContent> = {} as any;
      const order: Platform[] = [];

      importedPosts.forEach((post: any) => {
        const platform = post.platform as Platform;
        results[platform] = {
          angle: post.angle,
          content: {
            headline: post.headline,
            body: post.body,
            caption: post.caption,
            post_caption: post.caption,
          },
          platform: platform,
          raw: `${post.headline}\n\n${post.body}`,
        };
        if (!order.includes(platform)) order.push(platform);
      });

      // Apply to first available days or just populate results
      setGeneratedResults(results);
      if (order.length > 0) setActivePlatform(order[0]);
      setToastMessage(`Se importaron ${importedPosts.length} publicaciones.`);
      scrollToOutput();

    } catch (error) {
      setErrorMessage("Error al procesar el archivo Markdown.");
    }
  };

  const runRepurposeQuickAction = async () => {
    const selectedPost = repurposePosts.find(
      (post) => post.id === selectedRepurposePostId,
    );

    if (!selectedPost) {
      return;
    }

    setRunningQuickAction("repurpose");

    try {
      const response = await fetch("/api/quick-actions/repurpose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: selectedPost.id,
          source_platform: selectedPost.platform,
        }),
      });
      const data = (await response.json()) as {
        adaptations?: Array<{
          content: Record<string, unknown>;
          platform: Platform;
          savedPostId: string;
        }>;
        error?: string;
      };

      if (!response.ok || !data.adaptations?.length) {
        throw new Error(data.error || "No fue posible adaptar el post");
      }

      const results: Partial<Record<Platform, GeneratedContent>> = {};
      const savedIds: Partial<Record<Platform, string>> = {};
      const platformOrder = data.adaptations.map(
        (adaptation) => adaptation.platform,
      );

      data.adaptations.forEach((adaptation) => {
        results[adaptation.platform] = {
          angle: "Repurpose",
          content: adaptation.content,
          platform: adaptation.platform,
          raw: getContentPreview(
            selectedPost.platform,
            getDefaultFormat(selectedPost.platform),
            selectedPost.content,
            180,
          ),
        };
        savedIds[adaptation.platform] = adaptation.savedPostId;
      });

      applyQuickGeneratedOutput({
        platformOrder,
        results,
        savedIds,
        sourceLabel: getQuickActionSourceLabel("Repurpose"),
      });
    } catch {
      handleQuickActionError();
    } finally {
      setRunningQuickAction(null);
    }
  };

  const runViralQuickAction = async () => {
    setRunningQuickAction("viral");

    try {
      const response = await fetch("/api/quick-actions/viral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: viralPlatform }),
      });
      const data = (await response.json()) as {
        error?: string;
        trends?: QuickActionViralTrend[];
      };

      if (!response.ok || !data.trends?.length) {
        throw new Error(data.error || "No fue posible buscar tendencias");
      }

      setQuickActionOutput({
        kind: "viral",
        platform: viralPlatform,
        sourceLabel: getQuickActionSourceLabel("Qué está viral"),
        trends: data.trends,
      });
      setOpenQuickAction(null);
      scrollToOutput();
    } catch {
      handleQuickActionError();
    } finally {
      setRunningQuickAction(null);
    }
  };

  const runCaseStudyQuickAction = async () => {
    setRunningQuickAction("caseStudy");

    try {
      const response = await fetch("/api/quick-actions/case-study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: caseStudyClient,
          platform: caseStudyPlatform,
          result: caseStudyResult,
          service: caseStudyService,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        post?: {
          content: Record<string, unknown>;
          platform: Platform;
          savedPostId: string;
        };
      };

      if (!response.ok || !data.post) {
        throw new Error(
          data.error || "No fue posible generar el caso de estudio",
        );
      }

      applyQuickGeneratedOutput({
        note: "Recuerda validar con el cliente antes de publicar.",
        platformOrder: [data.post.platform],
        results: {
          [data.post.platform]: {
            angle: "Caso de estudio",
            content: data.post.content,
            platform: data.post.platform,
            raw: `Caso de estudio: ${caseStudyClient} · ${caseStudyService}`,
          },
        },
        savedIds: {
          [data.post.platform]: data.post.savedPostId,
        },
        sourceLabel: getQuickActionSourceLabel("Caso de estudio"),
      });
    } catch {
      handleQuickActionError();
    } finally {
      setRunningQuickAction(null);
    }
  };

  const runThoughtLeadershipQuickAction = async () => {
    setRunningQuickAction("thoughtLeadership");

    try {
      const response = await fetch("/api/quick-actions/thought-leadership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: thoughtLeadershipPlatform,
          stance: thoughtLeadershipStance,
          topic: thoughtLeadershipTopic,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        post?: QuickActionThoughtLeadershipPost;
      };

      if (!response.ok || !data.post) {
        throw new Error(data.error || "No fue posible generar la opinión");
      }

      applyQuickGeneratedOutput({
        platformOrder: [data.post.platform],
        results: {
          [data.post.platform]: {
            angle: "Thought leadership",
            content: data.post.content,
            platform: data.post.platform,
            raw: `Thought leadership: ${thoughtLeadershipTopic}`,
          },
        },
        savedIds: {
          [data.post.platform]: data.post.savedPostId,
        },
        sourceLabel: getQuickActionSourceLabel("Thought leadership"),
        stanceUsed: data.post.stance_used,
      });
    } catch {
      handleQuickActionError();
    } finally {
      setRunningQuickAction(null);
    }
  };

  const runFaqQuickAction = async () => {
    setRunningQuickAction("faq");

    try {
      const response = await fetch("/api/quick-actions/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: faqCount,
          platform: faqPlatform,
          questions: faqQuestions,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        posts?: QuickActionFaqPost[];
      };

      if (!response.ok || !data.posts?.length) {
        throw new Error(data.error || "No fue posible generar contenido FAQ");
      }

      setFaqActiveIndex(0);
      setQuickActionOutput({
        kind: "faq",
        platform: faqPlatform,
        posts: data.posts,
        sourceLabel: getQuickActionSourceLabel("FAQ de clientes"),
      });
      setOpenQuickAction(null);
      scrollToOutput();
    } catch {
      handleQuickActionError();
    } finally {
      setRunningQuickAction(null);
    }
  };

  const openCalendarForDay = (day: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + day - 1);
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, "0");
    const date = String(targetDate.getDate()).padStart(2, "0");
    const dateString = `${year}-${month}-${date}`;

    router.push(`/calendar?date=${dateString}`);
  };

  const developTrend = (trend: QuickActionViralTrend) => {
    setActivePlatform(trend.platform);
    setIdea(trend.hook);
    setPillarSelectionMode("auto");
    setSelectedAngle(trend.angle);
    setAngles([]);
    setShowAngleLibrary(false);
    setMode("idea");
    focusIdeaTextarea();
  };

  const enterMode = (nextMode: ComposeMode) => {
    setMode(nextMode);

    if (nextMode === "direct" && !selectedAngle) {
      setSelectedAngle(
        ANGLE_LIBRARY.find((angle) => angle.best_for.includes(activePlatform))
          ?.id ?? ANGLE_LIBRARY[0]?.id ?? null,
      );
    }

    if (nextMode !== "idea") {
      setShowAngleLibrary(false);
    }
  };

  useEffect(() => {
    if (mode !== "direct") {
      return;
    }

    const isCurrentAngleAvailable = selectedAngle
      ? ANGLE_LIBRARY.some(
          (angle) =>
            angle.id === selectedAngle && angle.best_for.includes(activePlatform),
        )
      : false;

    if (isCurrentAngleAvailable) {
      return;
    }

    setSelectedAngle(
      ANGLE_LIBRARY.find((angle) => angle.best_for.includes(activePlatform))
        ?.id ?? ANGLE_LIBRARY[0]?.id ?? null,
    );
  }, [activePlatform, mode, selectedAngle]);

  const focusIdeaTextarea = () => {
    window.requestAnimationFrame(() => {
      const textarea = ideaTextareaRef.current;

      if (!textarea) {
        return;
      }

      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      textarea.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const handleEditGeneratedContent = (platform: Platform) => {
    const result = generatedResults[platform];

    if (!result) {
      return;
    }

    setActivePlatform(platform);
    setSelectedPillarId(result.pillar_id || null);
    setPillarSelectionMode(result.pillar_id ? "manual" : "auto");
    setSelectedAngle(result.angle);
    setMode(mode === "direct" ? "direct" : "idea");
    setIdea(result.raw);
    focusIdeaTextarea();
  };

  const handleScheduleDraft = async (platform: Platform) => {
    const postId = await saveAsDraft(platform);

    if (!postId) {
      return;
    }

    router.push("/calendar");
  };

  const handlePillarSelection = (pillarId: string | null) => {
    setSelectedPillarId(pillarId);
    setPillarSelectionMode("manual");
    setPillarSuggestionReason(null);
  };

  const renderPillarSelector = () => {
    if (strategyLoading) {
      return (
        <div className="flex items-center gap-2 rounded-[24px] border border-white/10 bg-[#101417]/60 px-4 py-3 text-sm text-[#8D95A6]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando tu estrategia editorial...
        </div>
      );
    }

    if (brandPillars.length === 0) {
      return (
        <div className="rounded-[24px] border border-dashed border-white/10 bg-[#101417]/50 p-4">
          <p className="text-sm text-[#E0E5EB]">
            ¿A qué pilar pertenece este post?
          </p>
          <p className="mt-2 text-sm leading-6 text-[#8D95A6]">
            Primero define tus pilares y audiencias en estrategia para que la
            generación salga calibrada por territorio y plataforma.
          </p>
          <Link
            href="/settings?section=studio&tab=strategy"
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/5">
            Abrir estrategia
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      );
    }

    return (
      <div className="rounded-[24px] border border-white/10 bg-[#101417]/70 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#4E576A]">
              Pilar
            </p>
            <p className="mt-2 text-sm text-[#E0E5EB]">
              ¿A qué pilar pertenece este post?
            </p>
          </div>
          {activeAudience ? (
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-[#8D95A6]">
              Audiencia {formatPlatformLabel(activePlatform)}:{" "}
              {getLanguageLevelLabel(activeAudience.language_level)}
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {brandPillars.map((pillar) => (
            <button
              key={pillar.id}
              type="button"
              onClick={() => handlePillarSelection(pillar.id)}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                selectedPillarId === pillar.id
                  ? "text-white"
                  : "border-white/10 text-[#B5BDCA] hover:border-white/20 hover:text-white"
              }`}
              style={
                selectedPillarId === pillar.id
                  ? {
                      backgroundColor: pillar.color || "#212631",
                      borderColor: pillar.color || "#212631",
                    }
                  : undefined
              }>
              {pillar.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handlePillarSelection(null)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              selectedPillarId === null
                ? "border-white/40 bg-white text-black"
                : "border-white/10 text-[#B5BDCA] hover:border-white/20 hover:text-white"
            }`}>
            Sin pilar
          </button>
        </div>

        <div className="mt-4 space-y-2 text-xs leading-5 text-[#8D95A6]">
          {suggestingPillar && pillarSelectionMode === "auto" ? (
            <p>Sugiriendo pilar en función de tu idea...</p>
          ) : null}
          {activePillar ? (
            <p>
              Pilar activo:{" "}
              <span className="text-[#E0E5EB]">{activePillar.name}</span>
              {activePillar.description ? ` · ${activePillar.description}` : ""}
            </p>
          ) : null}
          {pillarSuggestionReason && pillarSelectionMode === "auto" ? (
            <p>{pillarSuggestionReason}</p>
          ) : null}
          {activeAudience ? (
            <p>
              Esta audiencia en {formatPlatformLabel(activePlatform)} busca{" "}
              {stripHtml(activeAudience.desired_outcomes) || "claridad útil"} y
              tiene problemas como{" "}
              {stripHtml(activeAudience.pain_points) || "falta de contexto"}.
            </p>
          ) : (
            <p>
              Aún no definiste audiencia para{" "}
              {formatPlatformLabel(activePlatform)}. La generación usará solo la
              voz de marca.
            </p>
          )}
        </div>
      </div>
    );
  };

  const handleCopyCaption = async (platform: Platform) => {
    const result = generatedResults[platform];

    if (!result) {
      return;
    }

    const format = inferPostFormat(platform, result.content, result.format);
    await navigator.clipboard.writeText(
      getCaptionText(platform, format, result.content),
    );
    setToastMessage("Caption copiado al portapapeles.");
  };

  const recordExport = async (
    postId: string,
    platform: Platform,
    format: PostFormat,
  ) => {
    let nextUserId = userId;

    if (!nextUserId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          "Necesitas iniciar sesion para registrar la exportacion.",
        );
      }

      nextUserId = user.id;
      setUserId(user.id);
    }

    await supabase.from("exports").insert([
      {
        format,
        platform,
        post_id: postId,
        user_id: nextUserId,
      },
    ]);

    setExportStatsByPostId((current) => {
      const previous = current[postId] ?? { count: 0, lastExportedAt: null };

      return {
        ...current,
        [postId]: {
          count: previous.count + 1,
          lastExportedAt: new Date().toISOString(),
        },
      };
    });
  };

  const ensureExportPostId = async (platform: Platform) => {
    const result = generatedResults[platform];

    if (!result) {
      return null;
    }

    if (result.post_id) {
      return result.post_id;
    }

    if (savedPostIds[platform]) {
      return savedPostIds[platform] ?? null;
    }

    return saveAsDraft(platform);
  };

  const handleExport = async (platform: Platform) => {
    const result = generatedResults[platform];

    if (!result) {
      return;
    }

    const format = inferPostFormat(platform, result.content, result.format);
    setExportingPlatform(platform);
    setErrorMessage(null);

    try {
      const postId = await ensureExportPostId(platform);

      if (!postId) {
        throw new Error("No fue posible preparar el post para exportacion");
      }

      if (platform === "instagram") {
        let blobs: Blob[] | null = null;
        if (format === "carousel") {
          blobs = await instagramExportRef.current?.renderAll() || null;
        } else if (format === "single") {
          // Single post preview capture could be added here if needed
          // For now handled by existing logic or specific renderer
        }

        await exportInstagramPackage({
          content: result.content,
          exportMetadata: isRecord(result.export_metadata)
            ? result.export_metadata
            : null,
          format,
          blobs,
          imageMetadata: selectedImage ? {
            url: selectedImage.url,
            photographer: selectedImage.photographer,
            overlay: overlayConfig
          } : null
        });
      } else if (platform === "linkedin") {
        const pdfBlob =
          format === "document" || format === "carousel"
            ? await linkedInPdfRef.current?.generatePdf()
            : null;

        let blobs: Blob[] | null = null;
        if (format === "image" || format === "single") {
          const previewEl = document.querySelector(`[data-platform-preview="${platform}"]`) as HTMLElement;
          if (previewEl) {
             const blob = await renderElementToPng(previewEl);
             blobs = [blob];
          }
        }

        await exportLinkedInPackage({
          content: result.content,
          format,
          pdfBlob: pdfBlob ?? null,
          blobs,
          imageMetadata: selectedImage ? {
            url: selectedImage.url,
            photographer: selectedImage.photographer,
            overlay: overlayConfig
          } : null
        });
        // ... rest of linkedin logic ...
      } else {
        // Platform X
        let blobs: Blob[] | null = null;
        
        if (format === "tweet" || format === "thread") {
          const previewEl = document.querySelector(`[data-platform-preview="${platform}"]`) as HTMLElement;
          if (previewEl) {
             const blob = await renderElementToPng(previewEl);
             blobs = [blob];
          }
        }

        await exportXPackage({
          content: result.content,
          format,
          idea: result.raw,
          blobs,
          imageMetadata: selectedImage ? {
            url: selectedImage.url,
            photographer: selectedImage.photographer,
            overlay: overlayConfig
          } : null
        });
      }

      await recordExport(postId, platform, format);
      setToastMessage(`${getExportActionLabel(platform)} listo.`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No fue posible exportar el contenido",
      );
    } finally {
      setExportingPlatform(null);
    }
  };

  const handleSingleTweetEdit = (value: string) => {
    updateGeneratedResult("x", (result) => {
      const nextContent = {
        ...result.content,
        char_count: value.length,
        tweet: value,
      };

      return {
        ...result,
        content: nextContent,
      };
    });
  };

  const handleThreadTweetEdit = (tweetNumber: number, value: string) => {
    updateGeneratedResult("x", (result) => {
      const tweets = readXThreadTweets(
        result.content.tweets ?? result.content.thread,
      ).map((tweet) =>
        tweet.number === tweetNumber
          ? { ...tweet, char_count: value.length, content: value }
          : tweet,
      );

      return {
        ...result,
        content: {
          ...result.content,
          tweets,
        },
      };
    });
  };

  const handleCaptionEdit = (value: string) => {
    updateGeneratedResult(activePlatform, (result) => ({
      ...result,
      content: {
        ...result.content,
        caption: value,
        post_caption: value,
      },
    }));
  };

  const handleDismissInstagramCarouselSuggestion = () => {
    setInstagramCarouselSuggestionDismissed(true);
    setInstagramCarouselPreviewState(null);
  };

  const handlePreviewInstagramCarousel = () => {
    const instagramResult = generatedResults.instagram;

    if (
      !instagramResult ||
      !instagramSingleSaturation?.evaluation.isSaturated ||
      !instagramSingleSaturation.sourceKey
    ) {
      return;
    }

    const suggestedSlides = instagramSingleSaturation.evaluation.suggestedSlides;
    const baseSlide = createInstagramSingleSlide(instagramResult.content);
    const previewSlides = convertInstagramSingleToCarouselPreview({
      baseSlide,
      body: baseSlide.body,
      caption: readString(instagramResult.content.caption),
      headline: readString(instagramResult.content.headline),
      slideCount: suggestedSlides,
    });
    const firstBackground = getCarouselEditorMeta(instagramResult).slideBackgrounds.find(
      (background) => background.slide_number === 1,
    );
    const previewBackgrounds = firstBackground
      ? previewSlides.map((slide) => ({
          ...firstBackground,
          slide_number: slide.slide_number,
        }))
      : [];

    setInstagramCarouselPreviewState({
      backgrounds: previewBackgrounds,
      slides: previewSlides,
      sourceKey: instagramSingleSaturation.sourceKey,
      suggestedSlides,
    });
  };

  const handleCancelInstagramCarouselPreview = () => {
    setInstagramCarouselPreviewState(null);
  };

  const handleConfirmInstagramCarouselPreview = async () => {
    const previewState = instagramCarouselPreviewState;

    if (!previewState) {
      return;
    }

    setInstagramCarouselPreviewState(null);
    setSelectedFormats((current) => ({ ...current, instagram: "carousel" }));

    await applyGeneratedResultUpdate("instagram", (current) => ({
      ...current,
      format: "carousel",
      content: {
        ...current.content,
        caption: readString(current.content.caption),
        hashtags: readStringArray(current.content.hashtags),
        slides: previewState.slides,
      },
      export_metadata: {
        ...(isRecord(current.export_metadata) ? current.export_metadata : {}),
        edited_carousel_slides: [],
        slide_backgrounds: previewState.backgrounds,
        slide_count: previewState.slides.length,
      },
    }));

    setToastMessage("Carrusel listo para revisar.");
  };

  const replaceLeadingLine = (value: string, newHook: string) => {
    const lines = value.split(/\r?\n/);

    if (lines.length === 0 || !value.trim()) {
      return newHook;
    }

    lines[0] = newHook;
    return lines.join("\n");
  };

  const replaceFirstLine = (
    platform: Platform,
    format: PostFormat,
    content: Record<string, unknown>,
    newHook: string,
  ) => {
    if (platform === "instagram") {
      if (format === "carousel") {
        const slides = readInstagramSlides(content.slides);
        const coverSlide = slides.find((slide) => slide.type === "cover");
        const fallbackIndex = coverSlide ? -1 : 0;

        return {
          ...content,
          slides: slides.map((slide, index) => {
            const shouldReplace = coverSlide
              ? slide.slide_number === coverSlide.slide_number
              : index === fallbackIndex;

            return shouldReplace ? { ...slide, headline: newHook } : slide;
          }),
        };
      }

      return {
        ...content,
        caption: replaceLeadingLine(readString(content.caption), newHook),
      };
    }

    if (platform === "linkedin") {
      if (format === "document" || format === "carousel") {
        const slides = readLinkedInSlides(content.slides);

        return {
          ...content,
          slides: slides.map((slide, index) =>
            index === 0 ? { ...slide, title: newHook } : slide,
          ),
        };
      }

      return {
        ...content,
        caption: replaceLeadingLine(readString(content.caption), newHook),
      };
    }

    return content;
  };

  const handleTagsChange = (platform: Platform, tags: string[]) => {
    updateGeneratedResult(platform, (result) => ({
      ...result,
      content: {
        ...result.content,
        hashtags: tags,
        tags: tags,
      },
    }));
  };

  const handleSuggestTags = async (platform: Platform) => {
    const result = generatedResults[platform];
    if (!result || isSuggestingTags) return;

    setIsSuggestingTags(true);
    try {
      const response = await fetch("/api/social/suggest-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          content: result.content,
          angle: result.angle,
        }),
      });

      if (!response.ok) throw new Error("Fallo al sugerir hashtags");

      const data = await response.json();
      if (data.hashtags) {
        handleTagsChange(platform, data.hashtags);
      }
    } catch (error) {
      console.error("Error suggesting tags:", error);
    } finally {
      setIsSuggestingTags(false);
    }
  };

  const handleUnifyStyle = () => {
    const result = generatedResults["instagram"];
    if (!result) return;

    const slides = readInstagramSlides(result.content.slides);
    if (slides.length === 0) return;

    const firstSlide = slides[0];
    const firstBgRaw = (result.export_metadata as ExportMetadata)?.slide_backgrounds?.find(
      (b: SlideBackgroundSelection) => b.slide_number === firstSlide.slide_number,
    );


    const nextSlides = slides.map((slide, index) => {
      if (index === 0) return slide;
      return {
        ...slide,
        bg_type: firstSlide.bg_type,
        gradient_style: firstSlide.gradient_style,
        unsplash_query: firstSlide.unsplash_query,
        suggested_template: firstSlide.suggested_template,
      };
    });

    const nextBackgrounds = (
      (result.export_metadata as ExportMetadata)?.slide_backgrounds || []
    ).map((bg: SlideBackgroundSelection) => {
      if (bg.slide_number === firstSlide.slide_number || !firstBgRaw) return bg;

      return {
        ...bg,
        bg_type: firstBgRaw.bg_type,
        gradient_config: firstBgRaw.gradient_config,
        gradient_style: firstBgRaw.gradient_style,
        image_url: firstBgRaw.image_url,
        photographer: firstBgRaw.photographer,
        solid_color: firstBgRaw.solid_color,
      };
    });

    updateGeneratedResult("instagram", (current) => ({
      ...current,
      content: { ...current.content, slides: nextSlides },
      export_metadata: {
        ...(isRecord(current.export_metadata) ? current.export_metadata : {}),
        slide_backgrounds: nextBackgrounds,
      },
    }));

    setToastMessage("Estilo unificado en todas las slides.");
  };

  const handleMagicLayout = () => {
    const result = generatedResults["instagram"];
    if (!result) return;

    const slides = readInstagramSlides(result.content.slides);
    const availableTemplates = [
      "editorial",
      "bold-statement",
      "split",
      "list",
      "stat-hero",
      "minimal-quote",
    ];

    const nextSlides = slides.map((slide) => {
      const filtered = availableTemplates.filter((tId) => {
        if (slide.type === "cover")
          return ["editorial", "bold-statement", "split", "stat-hero", "minimal-quote"].includes(tId);
        if (slide.type === "cta")
          return ["bold-statement", "minimal-quote", "split"].includes(tId);
        return ["editorial", "split", "list", "stat-hero", "minimal-quote"].includes(tId);
      });
      const randomTemplate = filtered[Math.floor(Math.random() * filtered.length)];
      return { ...slide, suggested_template: randomTemplate };
    });

    updateGeneratedResult("instagram", (current) => ({
      ...current,
      content: { ...current.content, slides: nextSlides },
    }));

    setToastMessage("Diseño transformado mágicamente.");
  };

  const handleRegenerateHook = async () => {
    if (!currentResult?.post_id) {
      return;
    }

    const tweets = readXThreadTweets(
      currentResult.content.tweets ?? currentResult.content.thread,
    );
    const currentHook = tweets[0]?.content ?? "";

    if (!currentHook) {
      return;
    }

    setRegeneratingHook(true);

    try {
      const response = await fetch("/api/x/regenerate-hook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_hook: currentHook,
          thread_id: currentResult.post_id,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        hook_note?: string;
        hook_strength?: XHookStrength;
        tweets?: Array<{ char_count: number; content: string; number: number }>;
      };

      if (!response.ok) {
        throw new Error(data.error || "No fue posible regenerar el hook");
      }

      updateGeneratedResult("x", (result) => ({
        ...result,
        content: {
          ...result.content,
          hook_note: data.hook_note ?? "",
          hook_strength: data.hook_strength ?? "strong",
          tweets: data.tweets ?? [],
        },
        export_metadata: {
          ...(isRecord(result.export_metadata) ? result.export_metadata : {}),
          hook_strength: data.hook_strength ?? "strong",
          tweet_count:
            data.tweets?.length ??
            readXThreadTweets(result.content.tweets).length,
        },
      }));
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No fue posible regenerar el hook",
      );
    } finally {
      setRegeneratingHook(false);
    }
  };

  const renderPlatformTabs = () => (
    <div className="flex flex-wrap gap-2">
      {platforms.map((platform) => (
        <button
          key={platform}
          type="button"
          onClick={() => setActivePlatform(platform)}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm transition-colors ${
            activePlatform === platform
              ? "bg-white text-black"
              : "text-zinc-400 hover:text-white"
          }`}>
          <PlatformIcon platform={platform} className="h-4 w-4" />
          {formatPlatformLabel(platform)}
        </button>
      ))}
    </div>
  );

  const renderAdaptPlatformStatus = (platform: Platform) => {
    const status = adaptPlatformStatuses[platform];

    return (
      <div
        key={platform}
        className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs text-[#B5BDCA]"
      >
        <span className="flex h-4 w-4 items-center justify-center">
          {status === "in_progress" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#E0E5EB]" />
          ) : status === "complete" ? (
            <Check className="h-3.5 w-3.5 text-[#22c55e]" />
          ) : status === "error" ? (
            <X className="h-3.5 w-3.5 text-[#ef4444]" />
          ) : (
            <span className="h-2.5 w-2.5 rounded-full border border-[#4E576A]" />
          )}
        </span>
        <span>{formatPlatformLabel(platform)}</span>
      </div>
    );
  };

  const renderFormatSelector = () => {
    const options = platformFormatOptions[
      activePlatform
    ] as SocialFormatOption[];
    const activeFormat =
      activePlatform === "instagram" && isInstagramPreviewCarouselActive
        ? "carousel"
        : selectedFormats[activePlatform];

    return (
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.24em] text-[#4E576A]">
          Formato
        </p>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={async () => {
                if (activePlatform === "instagram") {
                  const currentFormat = inferPostFormat(
                    "instagram",
                    generatedResults.instagram?.content || {},
                    generatedResults.instagram?.format
                  );

                  if (currentFormat === "single" && option.value === "carousel") {
                    // Convert single to carousel transparently
                    const instagramResult = generatedResults.instagram;
                    if (instagramResult) {
                      const suggestedSlides = instagramSingleSaturation?.evaluation.suggestedSlides || 5;
                      const baseSlide = createInstagramSingleSlide(instagramResult.content);
                      const previewSlides = convertInstagramSingleToCarouselPreview({
                        baseSlide,
                        body: baseSlide.body,
                        caption: readString(instagramResult.content.caption),
                        headline: readString(instagramResult.content.headline),
                        slideCount: suggestedSlides,
                      });
                      const firstBackground = getCarouselEditorMeta(instagramResult).slideBackgrounds.find(
                        (background) => background.slide_number === 1
                      );
                      const previewBackgrounds = firstBackground
                        ? previewSlides.map((slide) => ({
                            ...firstBackground,
                            slide_number: slide.slide_number,
                          }))
                        : [];

                      setInstagramCarouselPreviewState(null);
                      setFormatForPlatform(activePlatform, option.value);
                      void applyGeneratedResultUpdate("instagram", (current) => ({
                        ...current,
                        format: "carousel",
                        content: {
                          ...current.content,
                          slides: previewSlides,
                        },
                        export_metadata: {
                          ...(isRecord(current.export_metadata) ? current.export_metadata : {}),
                          edited_carousel_slides: [],
                          slide_backgrounds: previewBackgrounds,
                          slide_count: previewSlides.length,
                        },
                      }));
                      return;
                    }
                  }

                  if (currentFormat === "carousel" && option.value === "single") {
                    setInstagramCarouselPreviewState(null);
                    setFormatForPlatform(activePlatform, option.value);
                    if (generatedResults.instagram) {
                      void applyGeneratedResultUpdate("instagram", (current) => ({
                        ...current,
                        format: "single"
                      }));
                    }
                    return;
                  }
                  
                  if (isInstagramPreviewCarouselActive && option.value === "single") {
                    setInstagramCarouselPreviewState(null);
                    setFormatForPlatform(activePlatform, option.value);
                    return;
                  }
                }

                setFormatForPlatform(activePlatform, option.value);
              }}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                activeFormat === option.value
                  ? "bg-white text-black"
                  : "border border-white/10 text-[#B5BDCA] hover:border-white/20 hover:text-white"
              }`}>
              {option.label}
            </button>
          ))}
        </div>
        <p className="text-xs leading-5 text-[#6F7786]">
          {options.find((option) => option.value === activeFormat)?.description}
        </p>
      </div>
    );
  };

  const renderMarkdownParagraph = (line: string, key: string) => {
    const chunks = line.split(/(\*\*.*?\*\*)/g);

    return (
      <p key={key} className="text-base leading-8 text-[#D5DBE5]">
        {chunks.map((chunk, index) =>
          chunk.startsWith("**") && chunk.endsWith("**") ? (
            <strong
              key={`${key}-${index}`}
              className="font-semibold text-[#E0E5EB]">
              {chunk.slice(2, -2)}
            </strong>
          ) : (
            <span key={`${key}-${index}`}>{chunk}</span>
          ),
        )}
      </p>
    );
  };

  const renderMarkdownBody = (body: string) => (
    <div className="space-y-5">
      {body.split("\n").map((line, index) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={`spacer-${index}`} className="h-2" />;
        }

        if (trimmed.startsWith("## ")) {
          return (
            <h4
              key={`heading-${index}`}
              className="pt-2 text-2xl font-medium text-[#E0E5EB]"
              style={{ fontFamily: "var(--font-brand-display)" }}>
              {trimmed.replace(/^##\s+/, "")}
            </h4>
          );
        }

        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <div key={`bullet-${index}`} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#462D6E]" />
              {renderMarkdownParagraph(
                trimmed.slice(2),
                `bullet-text-${index}`,
              )}
            </div>
          );
        }

        return renderMarkdownParagraph(trimmed, `paragraph-${index}`);
      })}
    </div>
  );

  const renderExportBar = (platform: Platform, result: GeneratedContent) => {
    const format = inferPostFormat(platform, result.content, result.format);
    const postId = result.post_id ?? savedPostIds[platform] ?? null;
    const stats = postId ? exportStatsByPostId[postId] : undefined;
    const isExporting = exportingPlatform === platform;

    return (
      <div className="rounded-[28px] border border-white/10 bg-[#171B22] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-medium text-[#E0E5EB]">
              Listo para publicar
            </p>
            <p className="mt-2 text-sm text-[#8D95A6]">
              Exportado {stats?.count ?? 0} veces
              {"  "}
              Ultima exportacion:{" "}
              {stats?.lastExportedAt
                ? new Date(stats.lastExportedAt).toLocaleString()
                : "—"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleMagicLayout}
              className="inline-flex items-center gap-2 rounded-full border border-[#462D6E]/30 bg-[#462D6E]/5 px-4 py-2 text-sm text-[#E0E5EB] transition-colors hover:bg-[#462D6E]/15">
              <Sparkles className="h-4 w-4 text-[#462D6E]" />
              Cambio mágico
            </button>
            <button
              type="button"
              onClick={handleUnifyStyle}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/5">
              <Layout className="h-4 w-4" />
              Unificar estilo
            </button>
            <button
              type="button"
              onClick={() => void handleExport(platform)}
              disabled={isExporting}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-60">
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {getExportActionLabel(platform)}
            </button>
            <button
              type="button"
              onClick={() => void handleCopyCaption(platform)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/5">
              <Copy className="h-4 w-4" />
              Copiar caption
            </button>
            <span className="inline-flex items-center rounded-full border border-white/10 px-3 py-2 text-xs text-[#8D95A6]">
              {getFormatLabel(platform, format)}
            </span>
            <button
              type="button"
              onClick={() => document.getElementById('md-import-input')?.click()}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition-colors hover:bg-white/10"
            >
              <Plus className="h-4 w-4" />
              Importar MD
              <input
                id="md-import-input"
                type="file"
                accept=".md"
                className="hidden"
                onChange={handleImportMarkdown}
              />
            </button>
          </div>
        </div>
      </div>
    );
  };


  const renderPostContentBody = (
    platform: Platform,
    result: GeneratedContent,
  ) => {
    const format = inferPostFormat(platform, result.content, result.format);
    const content = result.content;
    const hashtags = ensureHashtags(readStringArray(content.hashtags));

    if (platform === "instagram") {
      const instagramSingleSourceKey =
        format === "single" ? getInstagramSinglePreviewKey(result) : null;
      const previewState =
        format === "single" &&
        instagramCarouselPreviewState?.sourceKey === instagramSingleSourceKey
          ? instagramCarouselPreviewState
          : null;

      if (format === "carousel") {
        const slides = readInstagramSlides(content.slides);
        const { editedSlides, slideBackgrounds } = getCarouselEditorMeta(result);
        const slideBackgroundMap = new Map(
          slideBackgrounds.map((background) => [
            background.slide_number,
            background,
          ]),
        );

        return (
          <div className="space-y-5">
            <InstagramCarouselPreview
              angle={readString(result.angle)}
              editedSlides={editedSlides}
              initialBackgrounds={slideBackgrounds}
              slides={slides}
              caption={readString(content.caption)}
              onUpdateCaption={(newCaption) => {
                setGeneratedResults((prev) => {
                  const r = prev[platform];
                  if (!r || !r.content) return prev;
                  return {
                    ...prev,
                    [platform]: {
                      ...r,
                      content: {
                        ...(r.content as any),
                        caption: newCaption,
                      },
                    },
                  };
                });
              }}
              onOpenDetailEditor={(activeIndex) =>
                openCarouselEditor(activeIndex)
              }
              onUpdateSlide={(slideNumber, updates) => {
                setGeneratedResults((prev) => {
                  const r = prev[platform];
                  if (!r || !r.content) return prev;
                  const currentSlides = (r.content as any).slides || [];
                  const updatedSlides = currentSlides.map((s: any) =>
                    s.slide_number === slideNumber ? { ...s, ...updates } : s,
                  );
                  return {
                    ...prev,
                    [platform]: {
                      ...r,
                      content: {
                        ...(r.content as any),
                        slides: updatedSlides,
                      },
                    },
                  };
                });
              }}
              onReorderSlides={(newOrder) => {
                setGeneratedResults((prev) => {
                  const r = prev.instagram;
                  if (
                    !r ||
                    !r.content ||
                    !Array.isArray((r.content as any).slides)
                  ) {
                    return prev;
                  }
                  const oldSlides = [...(r.content as any).slides];
                  const newSlides = newOrder.map((originalPos, newIdx) => {
                    const s = { ...oldSlides[originalPos - 1] };
                    s.slide_number = newIdx + 1;
                    return s;
                  });
                  return {
                    ...prev,
                    instagram: {
                      ...r,
                      content: {
                        ...(r.content as any),
                        slides: newSlides,
                      },
                    },
                  };
                });
              }}
              onBackgroundChange={(backgrounds) => {
                setGeneratedResults((prev) => {
                  const r = prev[platform];
                  if (!r) return prev;
                  return {
                    ...prev,
                    [platform]: {
                      ...r,
                      export_metadata: {
                        ...r.export_metadata,
                        edited_carousel_slides: [],
                        slide_backgrounds: backgrounds,
                      },
                    },
                  };
                });
              }}
            />
            <div className="grid gap-3 md:grid-cols-2">
              {slides.map((slide) => {
                const imageBackground = slideBackgroundMap.get(
                  slide.slide_number,
                );

                return (
                  <ContentImageSlot
                    key={`carousel-image-slot-${slide.slide_number}`}
                    aspectRatio="square"
                    hint="Cada slide puede llevar su propia imagen."
                    imageSource={
                      (imageBackground?.image_source as
                        | ImageSource
                        | null
                        | undefined) ?? null
                    }
                    imageUrl={imageBackground?.image_url ?? null}
                    label={`Imagen slide ${slide.slide_number}`}
                    onOpenPicker={() =>
                      setImagePickerTarget({
                        kind: "carousel-slide",
                        platform: "instagram",
                        slideNumber: slide.slide_number,
                      })
                    }
                    onRemove={() => {
                      void applyGeneratedResultUpdate("instagram", (current) => ({
                        ...current,
                        export_metadata: {
                          ...(isRecord(current.export_metadata)
                            ? current.export_metadata
                            : {}),
                          slide_backgrounds: getCarouselEditorMeta(
                            current,
                          ).slideBackgrounds.filter(
                            (background) =>
                              background.slide_number !== slide.slide_number,
                          ),
                        },
                      }));
                    }}
                    onUpload={async (file) => {
                      await handleStructuredUpload(
                        {
                          kind: "carousel-slide",
                          platform: "instagram",
                          slideNumber: slide.slide_number,
                        },
                        file,
                      );
                    }}
                  />
                );
              })}
            </div>
            <div className="rounded-[24px] border border-white/10 bg-[#101417] p-4 text-sm leading-7 text-[#E0E5EB]">
              <p className="whitespace-pre-wrap">{readString(content.caption)}</p>

              <div className="mt-6 border-t border-white/5 pt-6">
                <TagsEditor
                  tags={hashtags}
                  onChange={(tags) => handleTagsChange(platform, tags)}
                  onSuggest={() => handleSuggestTags(platform)}
                  isSuggesting={isSuggestingTags}
                />
              </div>
            </div>
          </div>
        );
      }

      if (previewState) {
        return (
          <div className="space-y-5">
            <div className="rounded-[24px] border border-[#D3C2F1]/20 bg-[#1A1622] p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-[#E0E5EB]">
                    Vista previa lista. ¿Guardar como carrusel?
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#8D95A6]">
                    Se prepararon {previewState.suggestedSlides} slides sin
                    modificar todavía tu post original.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handleConfirmInstagramCarouselPreview()}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-[#E0E5EB]"
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelInstagramCarouselPreview}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/5"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>

            <InstagramCarouselPreview
              angle={readString(result.angle)}
              editedSlides={[]}
              initialBackgrounds={previewState.backgrounds}
              onOpenDetailEditor={() => {}}
              slides={previewState.slides}
              caption={readString(content.caption)}
              onUpdateSlide={(slideNumber, updates) => {
                setInstagramCarouselPreviewState((current) => {
                  if (!current) {
                    return current;
                  }

                  return {
                    ...current,
                    slides: current.slides.map((slide) =>
                      slide.slide_number === slideNumber
                        ? { ...slide, ...updates }
                        : slide,
                    ),
                  };
                });
              }}
              onReorderSlides={(newOrder) => {
                setInstagramCarouselPreviewState((current) => {
                  if (!current) {
                    return current;
                  }

                  const oldSlides = [...current.slides];
                  const newSlides = newOrder.map((originalPos, newIdx) => ({
                    ...oldSlides[originalPos - 1],
                    slide_number: newIdx + 1,
                  }));

                  return {
                    ...current,
                    backgrounds: current.backgrounds.map((background) => {
                      const newIndex = newOrder.findIndex(
                        (originalPos) =>
                          originalPos === background.slide_number,
                      );

                      return newIndex >= 0
                        ? { ...background, slide_number: newIndex + 1 }
                        : background;
                    }),
                    slides: newSlides,
                  };
                });
              }}
              onBackgroundChange={(backgrounds) => {
                setInstagramCarouselPreviewState((current) =>
                  current ? { ...current, backgrounds } : current,
                );
              }}
            />
          </div>
        );
      }

      const slide = createInstagramSingleSlide(content);
      const saturationSuggestion =
        instagramSingleSaturation?.sourceKey === instagramSingleSourceKey
          ? instagramSingleSaturation.evaluation
          : null;
      const showSaturationBanner = Boolean(
        saturationSuggestion?.isSaturated &&
          !instagramCarouselSuggestionDismissed,
      );
      const backgrounds = (result.export_metadata as any)?.slide_backgrounds || [];
      const background = backgrounds.find((b: any) => b.slide_number === 1) || {
        slide_number: 1,
        bg_type: slide.bg_type,
        solid_color: slide.color_suggestion || "#101417",
      };

      const onUpdateSlide = (updates: Partial<InstagramCarouselSlide>) => {
        setGeneratedResults((prev) => {
          const r = prev[platform];
          if (!r) return prev;
          return {
            ...prev,
            [platform]: {
              ...r,
              content: {
                ...r.content,
                ...updates,
              },
            },
          };
        });
      };

      return (
        <div className="space-y-6">
          {showSaturationBanner && saturationSuggestion && (
            <div className="rounded-[24px] border border-[#D3C2F1]/20 bg-[#1A1622] p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#D3C2F1]/20 bg-[#462D6E]/15 text-[#D3C2F1]">
                    <Layers3 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#E0E5EB]">
                      Este contenido funciona mejor como carrusel. Te sugerimos{" "}
                      {saturationSuggestion.suggestedSlides} slides.
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#8D95A6]">
                      {saturationSuggestion.reason}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handlePreviewInstagramCarousel}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-[#E0E5EB]"
                  >
                    Convertir a carrusel (
                    {saturationSuggestion.suggestedSlides} slides)
                  </button>
                  <button
                    type="button"
                    onClick={handleDismissInstagramCarouselSuggestion}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/5"
                  >
                    Mantener como post único
                  </button>
                </div>
              </div>
            </div>
          )}

          <div data-platform-preview={platform}>
            <InstagramPostPreview
              slide={slide}
              background={background as any}
              onUpdateSlide={onUpdateSlide}
              onBackgroundChange={(newBg) => {
                setGeneratedResults((prev) => {
                  const r = prev[platform];
                  if (!r) return prev;
                  const currentBackgrounds =
                    (r.export_metadata as any)?.slide_backgrounds || [];
                  const otherBackgrounds = currentBackgrounds.filter(
                    (b: any) => b.slide_number !== 1,
                  );
                  return {
                    ...prev,
                    [platform]: {
                      ...r,
                      export_metadata: {
                        ...r.export_metadata,
                        slide_backgrounds: [newBg, ...otherBackgrounds],
                      },
                    },
                  };
                });
              }}
            />
          </div>
          <div className="rounded-[24px] border border-white/10 bg-[#101417] p-5 space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#4E576A]">
                  Titular Social
                </p>
                <textarea
                  value={readString(content.headline)}
                  onChange={(e) => onUpdateSlide?.({ headline: e.target.value })}
                  placeholder="Escribe un titular llamativo..."
                  className="min-h-[40px] w-full resize-none bg-transparent text-sm font-bold leading-relaxed text-[#E0E5EB] focus:outline-none"
                />
                {!readString(content.headline).trim() ? (
                  <p className="text-xs leading-5 text-[#6F7786]">
                    La IA no rellena este campo autom&aacute;ticamente
                  </p>
                ) : null}
              </div>
              <div className="h-px bg-white/5" />
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#4E576A]">
                  Cuerpo del Post
                </p>
                <textarea
                  value={readString(content.body || content.caption)}
                  onChange={(e) => onUpdateSlide?.({ body: e.target.value })}
                  placeholder="Escribe el contenido principal..."
                  className="min-h-[80px] w-full resize-none bg-transparent text-sm leading-relaxed text-[#E0E5EB] focus:outline-none"
                />
              </div>
              <div className="h-px bg-white/5" />
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#4E576A]">
                  Caption (Pie de foto)
                </p>
                <textarea
                  value={readString(content.caption)}
                  onChange={(e) => handleCaptionEdit(e.target.value)}
                  placeholder="Escribe el caption final..."
                  className="min-h-[60px] w-full resize-none bg-transparent text-sm leading-relaxed text-zinc-400 focus:outline-none"
                />
              </div>

              <div className="mt-4 border-t border-white/5 pt-4">
                <TagsEditor
                  tags={hashtags}
                  onChange={(tags) => handleTagsChange(platform, tags)}
                  onSuggest={() => handleSuggestTags(platform)}
                  isSuggesting={isSuggestingTags}
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

      if (platform === "x" && format === "tweet") {
        const tweet = readString(content.tweet) || readString(content.caption);
        const charCount = tweet.length;

        return (
          <div className="space-y-4">
            <div data-platform-preview={platform}>
              <XPostPreview content={tweet} />
            </div>
            <div className="rounded-[24px] border border-white/10 bg-[#101417] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[#4E576A] mb-3">Editar texto</p>
              <textarea
                value={tweet}
                onChange={(event) => handleSingleTweetEdit(event.target.value)}
                className="min-h-[120px] w-full resize-none bg-transparent text-sm leading-7 text-[#E0E5EB] focus:outline-none"
              />
              <div className="mt-3 flex justify-end">
                <span
                  className="text-xs font-medium"
                  style={{ color: getXTweetColor(charCount) }}>
                  {charCount} / 270
                </span>
              </div>
            </div>
          </div>
        );
      }

      if (platform === "x" && format === "thread") {
        const tweets = readXThreadTweets(content.tweets ?? content.thread);
        const hookStrength = (readString(content.hook_strength) ||
          readString(
            isRecord(result.export_metadata)
              ? result.export_metadata?.hook_strength
              : undefined,
          )) as XHookStrength;
        const hookNote = readString(content.hook_note);

        return (
          <div className="space-y-4">
            {(hookStrength === "medium" || hookStrength === "weak") && (
              <div className="rounded-[24px] border border-[#78350F] bg-[#78350F]/10 p-4">
                <p className="text-sm text-[#FCD34D]">
                  El hook podria ser mas fuerte. {hookNote}
                </p>
                <button
                  type="button"
                  onClick={() => void handleRegenerateHook()}
                  disabled={regeneratingHook}
                  className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#FCD34D]/30 px-4 py-2 text-sm text-[#FCD34D] disabled:opacity-60">
                  {regeneratingHook ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCcw className="h-4 w-4" />
                  )}
                  Regenerar solo el hook
                </button>
              </div>
            )}

            <div className="space-y-3">
              {tweets.map((tweet: XThreadTweet, idx: number) => (
                <div key={`thread-group-${tweet.number}`} className="space-y-3">
                  <XPostPreview 
                    content={tweet.content} 
                    mediaUrl={tweet.media_url ?? undefined}
                    isThread={true} 
                    threadIndex={idx + 1} 
                    totalInThread={tweets.length} 
                  />
                  <div className="rounded-2xl border border-white/8 bg-[#101417] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-[#4E576A]">
                        Editar Tweet {tweet.number}
                      </p>
                      <span
                        className="text-xs"
                        style={{ color: getXTweetColor(tweet.content.length) }}>
                        {tweet.content.length} / 270
                      </span>
                    </div>
                    <textarea
                      value={tweet.content}
                      onChange={(event) =>
                        handleThreadTweetEdit(tweet.number, event.target.value)
                      }
                      className="mt-3 min-h-[90px] w-full resize-none bg-transparent text-sm leading-7 text-[#E0E5EB] focus:outline-none"
                    />
                    <div className="mt-4">
                      <ContentImageSlot
                        buttonLabel="＋ Imagen"
                        collapsedByDefault
                        hint="Imagen opcional por tweet."
                        imageSource={tweet.media_source ?? null}
                        imageUrl={tweet.media_url ?? null}
                        label={`Imagen para tweet ${tweet.number}`}
                        onOpenPicker={() =>
                          setImagePickerTarget({
                            kind: "thread-item",
                            platform: "x",
                            tweetNumber: tweet.number,
                          })
                        }
                        onRemove={() => {
                          void applyGeneratedResultUpdate("x", (current) => ({
                            ...current,
                            content: {
                              ...current.content,
                              tweets: readXThreadTweets(
                                current.content.tweets ?? current.content.thread
                              ).map((item) =>
                                item.number === tweet.number
                                  ? {
                                      ...item,
                                      media_source: null,
                                      media_url: null,
                                    }
                                  : item
                              ),
                            },
                          }));
                        }}
                        onUpload={async (file) => {
                          await handleStructuredUpload(
                            {
                              kind: "thread-item",
                              platform: "x",
                              tweetNumber: tweet.number,
                            },
                            file
                          );
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }


    if (platform === "x" && format === "article") {
      return (
        <div className="space-y-4">
          <ContentImageSlot
            aspectRatio="landscape"
            hint="Portada sugerida 16:9 para el artículo."
            imageSource={
              (content.cover_image_source as ImageSource | null | undefined) ??
              null
            }
            imageUrl={readOptionalString(content.cover_image)}
            label="Portada del artículo"
            onOpenPicker={() =>
              setImagePickerTarget({ kind: "article-cover", platform: "x" })
            }
            onRemove={() => {
              void applyGeneratedResultUpdate("x", (current) => ({
                ...current,
                content: {
                  ...current.content,
                  cover_image: null,
                  cover_image_source: null,
                },
              }));
            }}
            onUpload={async (file) => {
              await handleStructuredUpload(
                { kind: "article-cover", platform: "x" },
                file
              );
            }}
          />
          <article className="rounded-[28px] border border-white/10 bg-[#101417] p-6">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-[#8D95A6]">
                {String(content.word_count ?? "")} palabras
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-[#8D95A6]">
                {String(content.read_time_minutes ?? "")} min de lectura
              </span>
            </div>
            <p
              className="mt-5 text-3xl font-medium text-[#E0E5EB]"
              style={{ fontFamily: "var(--font-brand-display)" }}>
              {readString(content.title)}
            </p>
            <p className="mt-3 text-base leading-7 text-[#8D95A6]">
              {readString(content.subtitle)}
            </p>
            <div className="mt-8">
              {renderMarkdownBody(readString(content.body))}
            </div>
          </article>
        </div>
      );
    }

    if (
      platform === "linkedin" &&
      (format === "document" || format === "carousel")
    ) {
      const slides = readLinkedInSlides(content.slides);

      return (
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-2">
            {slides.map((slide) => (
              <div
                key={`linkedin-slide-${slide.number}`}
                className="space-y-4 rounded-[24px] border border-white/10 bg-[#101417] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#B5BDCA]">
                    {slide.type}
                  </span>
                  <span className="text-xs text-[#4E576A]">
                    {slide.number}/{slides.length}
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {slide.title ? (
                    <p
                      className="text-xl font-medium text-[#E0E5EB]"
                      style={{ fontFamily: "var(--font-brand-display)" }}>
                      {slide.title}
                    </p>
                  ) : null}
                  {slide.subtitle ? (
                    <p className="text-sm leading-6 text-[#8D95A6]">
                      {slide.subtitle}
                    </p>
                  ) : null}
                  {slide.headline ? (
                    <p
                      className="text-lg font-medium text-[#E0E5EB]"
                      style={{ fontFamily: "var(--font-brand-display)" }}>
                      {slide.headline}
                    </p>
                  ) : null}
                  {slide.content ? (
                    <p className="text-sm leading-6 text-[#D5DBE5]">
                      {slide.content}
                    </p>
                  ) : null}
                  {slide.stat_or_example ? (
                    <div className="rounded-2xl border-l-4 border-[#462D6E] bg-[#212631] px-4 py-3 text-sm leading-6 text-[#E0E5EB]">
                      {slide.stat_or_example}
                    </div>
                  ) : null}
                  {slide.message ? (
                    <p className="text-base text-[#E0E5EB]">{slide.message}</p>
                  ) : null}
                  {slide.handle ? (
                    <p className="text-sm text-[#D3C2F1]">{slide.handle}</p>
                  ) : null}
                </div>
                <ContentImageSlot
                  aspectRatio="portrait"
                  buttonLabel="＋ Imagen"
                  collapsedByDefault
                  hint="Imagen opcional por diapositiva."
                  imageSource={slide.image_source ?? null}
                  imageUrl={slide.image_url ?? null}
                  label={`Imagen para slide ${slide.number}`}
                  onOpenPicker={() =>
                    setImagePickerTarget({
                      kind: "slides-item",
                      platform: "linkedin",
                      slideNumber: slide.number,
                    })
                  }
                  onRemove={() => {
                    void applyGeneratedResultUpdate("linkedin", (current) => ({
                      ...current,
                      content: {
                        ...current.content,
                        slides: readLinkedInSlides(current.content.slides).map(
                          (item) =>
                            item.number === slide.number
                              ? {
                                  ...item,
                                  image_source: null,
                                  image_url: null,
                                }
                              : item
                        ),
                      },
                    }));
                  }}
                  onUpload={async (file) => {
                    await handleStructuredUpload(
                      {
                        kind: "slides-item",
                        platform: "linkedin",
                        slideNumber: slide.number,
                      },
                      file
                    );
                  }}
                />
              </div>
            ))}
          </div>
          <div className="rounded-[24px] border border-white/10 bg-[#101417] p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-[#4E576A] mb-4">
              Caption del post
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#E0E5EB]">
              {readString(content.post_caption)}
            </p>
            
            <div className="mt-6 pt-6 border-t border-white/5">
              <TagsEditor 
                tags={hashtags} 
                onChange={(tags) => handleTagsChange(platform, tags)}
                onSuggest={() => handleSuggestTags(platform)}
                isSuggesting={isSuggestingTags}
              />
            </div>
          </div>
          
          <div className="hidden pointer-events-none opacity-0">
            {generatedResults.instagram?.content && (
              <ExportRenderer 
                ref={instagramExportRef}
                slides={readInstagramSlides(generatedResults.instagram.content.slides)}
                backgrounds={getCarouselEditorMeta(generatedResults.instagram).slideBackgrounds as any}
              />
            )}
          </div>
          
          <LinkedInPdfGenerator
            ref={linkedInPdfRef}
            slides={slides as LinkedInCarouselSlide[]}
          />
        </div>
      );
    }

    const caption = readString(content.caption);
    const exportReadTime = isRecord(result.export_metadata)
      ? result.export_metadata.read_time_minutes
      : undefined;
    const readTime =
      typeof exportReadTime === "number"
        ? exportReadTime
        : estimateReadTime(caption);
    const showImageShortcut = platform === "linkedin" && format === "image";

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-[#8D95A6]">
            {readTime} min de lectura
          </span>
          {platform === "linkedin" ? (
            <button
              type="button"
              onClick={() => setShowLinkedInPreview((current) => !current)}
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/5">
              {showLinkedInPreview
                ? "Ocultar vista previa LinkedIn"
                : "Vista previa LinkedIn"}
            </button>
          ) : null}
        </div>

        <div className="space-y-5">
          {platform === "linkedin" && (
            <div data-platform-preview={platform}>
              <LinkedInPostPreview 
                content={caption} 
                hashtags={hashtags} 
                image={selectedImage?.url}
                format={format === 'image' ? 'image' : (format === 'document' || format === 'carousel' ? 'document' : 'text')}
                slides={readLinkedInSlides(generatedResults["linkedin"]?.content.slides)}
              />
            </div>
          )}

          <div className="rounded-[24px] border border-white/10 bg-[#101417] p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-[#4E576A] mb-3">Editar texto</p>
            <textarea
              value={caption}
              onChange={(event) => handleCaptionEdit(event.target.value)}
              className="min-h-[160px] w-full resize-none bg-transparent text-sm leading-7 text-[#E0E5EB] focus:outline-none"
            />
          </div>
        </div>

        {showImageShortcut && (
          <div className="space-y-4">
            {!selectedImage && (
              <ImageTipsCard 
                brief={visualBrief} 
                loading={briefLoading} 
                onClick={() =>
                  setImagePickerTarget({ kind: "single-post", platform: activePlatform })
                }
              />
            )}
            
            {!selectedImage ? (
              <div className="rounded-[24px] border border-white/10 bg-[#101417] p-4">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-[#8D95A6]" />
                  <p className="text-sm font-medium text-[#E0E5EB]">
                    Imagen sugerida
                  </p>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#B5BDCA]">
                  {readString(content.visual_direction) || "Generando sugerencia visual..."}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    openVisualSearch(readString(content.visual_direction) || caption)
                  }
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/5">
                  Buscar imagen
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative aspect-video w-full overflow-hidden rounded-[24px] border border-white/10 bg-[#101417]">
                <img src={selectedImage.url} alt="" className="h-full w-full object-cover" />
                <button 
                  onClick={removeImage}
                  className="absolute right-4 top-4 rounded-full bg-black/40 p-2 text-white/80 backdrop-blur-md hover:bg-black/60 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderGeneratedContent = (platform: Platform) => {
    const result = generatedResults[platform];

    if (!result) {
      return (
        <div className="rounded-[28px] border border-dashed border-[#4E576A] p-6 text-sm leading-6 text-[#8D95A6]">
          Todavía no hay contenido generado para {formatPlatformLabel(platform)}
          .
        </div>
      );
    }

    const isCopied = copiedResultPlatform === platform;
    const isEnhancingWriting = enhancingWritingPlatform === platform;
    const canUndoEnhancement = Boolean(enhancementUndoState[platform]);
    const shouldHighlightEnhancedContent = Boolean(
      enhancementHighlightState[platform],
    );
    const scoreBaseline = enhancementScoreBaselines[platform] ?? null;
    const displayFormat =
      platform === "instagram" && isInstagramPreviewCarouselActive
        ? "carousel"
        : inferPostFormat(platform, result.content, result.format);

    return (
      <div className="space-y-4">
        <div className="rounded-[28px] border border-white/10 bg-[#212631]/55 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              {currentQuickGeneratedOutput?.sourceLabel && (
                <div className="mb-3 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-[#E0E5EB]">
                  {currentQuickGeneratedOutput.sourceLabel}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <PlatformBadge platform={platform} />
                <p className="text-xs uppercase tracking-[0.24em] text-[#4E576A]">
                  {result.angle}
                </p>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-[#C9D0DB]">
                  {getFormatLabel(platform, displayFormat)}
                </span>
                {currentQuickGeneratedOutput?.stanceUsed && (
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-[#C9D0DB]">
                    Postura usada: {currentQuickGeneratedOutput.stanceUsed}
                  </span>
                )}
              </div>
              <p
                className="mt-2 text-2xl font-medium text-[#E0E5EB]"
                style={{ fontFamily: "var(--font-brand-display)" }}>
                Resultado listo para editar o guardar
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleEditGeneratedContent(platform)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/5">
              <PenSquare className="h-4 w-4" />
              Editar
            </button>
            <button
              type="button"
              onClick={() => void copyResult(platform)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/5">
              {isCopied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {isCopied ? "Copiado" : "Copiar"}
            </button>
            <button
              type="button"
              onClick={() => void saveAsDraft(platform)}
              disabled={savingDraft || Boolean(savedPostIds[platform])}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/5 disabled:opacity-60">
              {savingDraft ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {savedPostIds[platform]
                ? "Borrador guardado"
                : "Guardar borrador"}
            </button>
            <button
              type="button"
              onClick={() => void handleScheduleDraft(platform)}
              disabled={savingDraft}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/5 disabled:opacity-60">
              {savingDraft ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CalendarDays className="h-4 w-4" />
              )}
              Agendar
            </button>
            <button
              type="button"
              onClick={() => void handleEnhanceWriting(platform)}
              disabled={isEnhancingWriting}
              className="inline-flex items-center gap-2 rounded-full border border-[#6C4CE4]/30 bg-[#6C4CE4]/10 px-4 py-2 text-sm text-[#EAE2FF] transition-colors hover:border-[#6C4CE4]/45 hover:bg-[#6C4CE4]/16 disabled:opacity-60">
              {isEnhancingWriting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mejorando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-[#CDB9FF]" />
                  ✦ Mejorar escritura
                </>
              )}
            </button>
          </div>

          {canUndoEnhancement ? (
            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-[18px] border border-[#6C4CE4]/20 bg-[#6C4CE4]/8 px-4 py-3">
              <p className="text-sm text-[#D9CCFF]">
                La versi&oacute;n anterior sigue disponible por unos segundos.
              </p>
              <button
                type="button"
                onClick={() => void handleRevertEnhancedWriting(platform)}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/5">
                Revertir cambio
              </button>
            </div>
          ) : null}

          {platform === "instagram" ? (
            <div className="mt-4 rounded-[24px] border border-[#6C4CE4]/18 bg-[linear-gradient(135deg,rgba(108,76,228,0.14),rgba(16,20,23,0.9))] p-4">
              <button
                type="button"
                onClick={() => openCarouselEditor(0)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-medium text-[#F5F7FB] transition-all hover:border-white/20 hover:bg-white/10">
                <Wand2 className="h-4 w-4 text-[#CDB9FF]" />
                Personalizar diseño completo
              </button>
              <p className="mt-2 text-center text-[12px] leading-5 text-[#AAB3C5]">
                Abre el Live Editor para ajustar tipografía, fondos y composición sin salir del contexto.
              </p>
            </div>
          ) : null}

          <motion.div
            className="relative mt-5"
            animate={
              shouldHighlightEnhancedContent
                ? {
                    backgroundColor: [
                      "rgba(108,76,228,0.12)",
                      "rgba(108,76,228,0.03)",
                      "rgba(108,76,228,0)",
                    ],
                    boxShadow: [
                      "0 0 0 rgba(108,76,228,0)",
                      "0 0 0 1px rgba(108,76,228,0.24)",
                      "0 0 0 rgba(108,76,228,0)",
                    ],
                  }
                : undefined
            }
            transition={{ duration: 1.2, ease: "easeOut" }}>
            {isEnhancingWriting ? (
              <motion.div
                className="pointer-events-none absolute inset-0 z-10 rounded-[28px]"
                style={{
                  backgroundImage:
                    "linear-gradient(110deg, rgba(108,76,228,0.02) 18%, rgba(205,185,255,0.12) 48%, rgba(108,76,228,0.02) 78%)",
                  backgroundSize: "200% 100%",
                }}
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%"],
                  opacity: [0.3, 0.65, 0.3],
                }}
                transition={{
                  duration: 1.35,
                  ease: "easeInOut",
                  repeat: Number.POSITIVE_INFINITY,
                }}
              />
            ) : null}
            <div className="relative z-0">
              {renderPostContentBody(platform, result)}
            </div>
          </motion.div>

          {!generating ? (
            <div className="mt-5">
              {(platform === "instagram" || platform === "linkedin") ? (
                <div className="mb-5">
                  <HookScore
                    platform={platform}
                    format={inferPostFormat(platform, result.content, result.format)}
                    content={result.content}
                    angle={result.angle}
                    onReplaceHook={(newHook) => {
                      updateGeneratedResult(platform, (current) => ({
                        ...current,
                        content: replaceFirstLine(
                          platform,
                          inferPostFormat(platform, current.content, current.format),
                          current.content,
                          newHook,
                        ),
                      }));
                    }}
                  />
                </div>
              ) : null}
              <ContentScore
                platform={platform}
                format={inferPostFormat(platform, result.content, result.format)}
                content={result.content}
                angle={result.angle}
                comparisonBaseline={scoreBaseline}
                onScoreDataChange={(scoreData) => {
                  setEditorialScoresByPlatform((current) => {
                    if (!scoreData && !current[platform]) {
                      return current;
                    }

                    if (scoreData && current[platform] === scoreData) {
                      return current;
                    }

                    const next = { ...current };

                    if (scoreData) {
                      next[platform] = scoreData;
                    } else {
                      delete next[platform];
                    }

                    return next;
                  });
                }}
                postId={result.post_id ?? undefined}
                onRebalance={(newContent) => {
                  updateGeneratedResult(platform, (current) => ({
                    ...current,
                    content: newContent,
                  }));
                }}
              />
            </div>
          ) : null}

          {currentQuickGeneratedOutput?.note && (
            <p className="mt-4 text-xs text-[#4E576A]">
              {currentQuickGeneratedOutput.note}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => void adaptToOtherPlatforms()}
                disabled={adapting}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#E0E5EB] disabled:opacity-60">
                {adapting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adaptando plataformas...
                  </>
                ) : (
                  <>
                    <RefreshCcw className="h-4 w-4" />
                    Adaptar a otras plataformas
                  </>
                )}
              </button>

              {(adapting || showAdaptSuccessPulse) && (
                <div className="flex flex-wrap gap-2">
                  {platforms.map((platform) => renderAdaptPlatformStatus(platform))}
                </div>
              )}
            </div>
          </div>
        </div>

        {renderExportBar(platform, result)}

        {savedPostIds[platform] ? (
          <PostFeedback postId={savedPostIds[platform]!} />
        ) : (
          <div className="rounded-[28px] border border-dashed border-[#4E576A] p-5 text-sm leading-6 text-[#8D95A6]">
            Guarda este resultado como borrador para activar feedback y
            seguimiento.
          </div>
        )}
      </div>
    );
  };

  const shouldShowGeneratedOutput =
    !quickActionOutput || quickActionOutput.kind === "generated";
  const visibleGeneratedPlatforms = shouldShowGeneratedOutput
    ? currentQuickGeneratedOutput
      ? currentQuickGeneratedOutput.platformOrder.filter((platform) =>
          Boolean(generatedResults[platform]),
        )
      : platforms.filter((platform) => Boolean(generatedResults[platform]))
    : [];
  const activeFaqPost =
    quickActionOutput?.kind === "faq"
      ? (quickActionOutput.posts[faqActiveIndex] ?? null)
      : null;
  const hasOutputPanel =
    Boolean(quickActionOutput) ||
    Object.values(generatedResults).some((value) => Boolean(value));

  return (
    <div className={cn(
      "animate-in fade-in slide-in-from-bottom-4 duration-300 pb-8",
      hasOutputPanel ? "grid gap-8 lg:grid-cols-[1fr_440px] xl:grid-cols-[1fr_540px] items-start" : "space-y-6"
    )}>
      <div className={cn(
        "space-y-8 transition-all duration-500",
        hasOutputPanel && "lg:sticky lg:top-24 z-20"
      )}>
        <section className="rounded-[32px] border border-white/10 bg-[#212631]/40 p-6 sm:p-7">

        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.28em] text-[#4E576A]">
                Compose
              </p>
              <h1
                className="text-4xl font-medium text-[#E0E5EB]"
                style={{ fontFamily: "var(--font-brand-display)" }}>
                Crea con contexto, no solo con prompts.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-[#8D95A6]">
                Entra por exploración si necesitas orientación, por desarrollo
                si ya tienes una intuición, o por directo si vienes con la pieza
                casi resuelta.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3 self-start">
              <button
                type="button"
                onClick={openLiveEditor}
                className="inline-flex items-center gap-2 rounded-full border border-[#6C4CE4]/25 bg-[#6C4CE4]/10 px-4 py-2 text-sm text-[#EAE2FF] transition-all duration-300 hover:border-[#6C4CE4]/45 hover:bg-[#6C4CE4]/16">
                <Wand2 className="h-4 w-4 text-[#CDB9FF]" />
                Live Editor
              </button>
              {mode && (
                <button
                  type="button"
                  onClick={() => setMode(null)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#E0E5EB] transition-all duration-300 hover:border-white/30 hover:bg-white/5">
                  <RefreshCcw className="h-4 w-4" />
                  Cambiar modo
                </button>
              )}
            </div>
          </div>

          {currentModeCard && (
            <div className="grid gap-3 sm:grid-cols-3">
              {modeCards.map((card) => {
                const Icon = card.icon;
                const isActive = card.key === currentModeCard.key;

                return (
                  <div
                    key={card.key}
                    className={`rounded-[24px] border p-4 transition-all duration-300 ${
                      isActive
                        ? "border-[#E0E5EB]/35 bg-[#2A3040]/85 shadow-[0_0_30px_rgba(224,229,235,0.08)]"
                        : "border-white/8 bg-[#101417]/55"
                    }`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                        <Icon
                          className={`h-4 w-4 ${isActive ? "text-[#E0E5EB]" : "text-[#8D95A6]"}`}
                        />
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${
                          isActive
                            ? "bg-white/10 text-[#E0E5EB]"
                            : "bg-white/5 text-[#4E576A]"
                        }`}>
                        {card.stepLabel}
                      </span>
                    </div>
                    <p
                      className={`mt-5 text-lg font-medium ${isActive ? "text-[#E0E5EB]" : "text-[#B5BDCA]"}`}
                      style={{ fontFamily: "var(--font-brand-display)" }}>
                      {card.label}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#8D95A6]">
                      {card.eyebrow}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-[#212631]/40 p-5 sm:p-6">
        <div className="space-y-4">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.24em] text-[#4E576A]">
              Acciones rápidas
            </p>
            <p className="mt-1 text-[11px] text-[#4E576A]">
              Genera contenido con un clic
            </p>
          </div>

          <div className="md:grid md:grid-cols-3 md:gap-3">
            <div className="flex gap-3 overflow-x-auto pb-2 md:contents">
              {[
                {
                  key: "plan" as const,
                  icon: Calendar,
                  label: "Planear contenido",
                  subtitle: "Organiza tu semana de publicaciones",
                  tooltip:
                    "Crea un plan de publicación semanal basado en tus pilares",
                },
                {
                  key: "repurpose" as const,
                  icon: RefreshCw,
                  label: "Repurpose",
                  subtitle: "Reutiliza ideas para otra plataforma",
                  tooltip:
                    "Convierte un post existente en contenido para otra plataforma",
                },
                {
                  key: "viral" as const,
                  icon: TrendingUp,
                  label: "Qué está viral",
                  subtitle: "Detecta tendencias con potencial inmediato",
                  tooltip:
                    "Analiza tendencias actuales y sugiere ángulos relevantes",
                },
                {
                  key: "caseStudy" as const,
                  icon: Briefcase,
                  label: "Caso de estudio",
                  subtitle: "Convierte resultados en prueba social",
                  tooltip:
                    "Transforma un resultado de cliente en contenido de autoridad",
                },
                {
                  key: "thoughtLeadership" as const,
                  icon: Lightbulb,
                  label: "Thought leadership",
                  subtitle: "Expresa una postura experta relevante",
                  tooltip:
                    "Genera una opinión experta sobre tu industria",
                },
                {
                  key: "faq" as const,
                  icon: MessageCircle,
                  label: "FAQ de clientes",
                  subtitle: "Responde dudas comunes con claridad",
                  tooltip:
                    "Convierte preguntas frecuentes en posts educativos",
                },
              ].map((chip) => {
                const Icon = chip.icon;
                const isRunning = runningQuickAction === chip.key;
                const isOpen = openQuickAction === chip.key;

                return (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => handleQuickActionChipClick(chip.key)}
                    disabled={isRunning}
                    title={chip.tooltip}
                    className={`flex min-w-[160px] shrink-0 items-start gap-3 rounded-[10px] border px-4 py-3 text-left transition-all md:min-w-0 ${
                      isOpen || isRunning
                        ? "border-[#E0E5EB] bg-[#1A1F28] opacity-70"
                        : "border-[#2A3040] bg-[#212631] hover:border-[#4E576A] hover:bg-[#1A1F28]"
                    }`}>
                    {isRunning ? (
                      <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 border-[#4E576A] border-t-[#E0E5EB] animate-spin" />
                    ) : (
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#E0E5EB]" />
                    )}
                    <span className="flex min-w-0 flex-col">
                      <span className="text-[13px] font-medium text-[#E0E5EB]">
                        {isRunning ? "Generando..." : chip.label}
                      </span>
                      <span className="mt-1 text-[11px] leading-[1.35] text-[#8E97A8]">
                        {chip.subtitle}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <AnimatePresence initial={false}>
            {openQuickAction && (
              <motion.div
                key={openQuickAction}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden">
                <div className="rounded-[24px] border border-white/10 bg-[#101417]/80 p-4 sm:p-5">
                  {openQuickAction === "plan" && (
                    <div className="space-y-4">
                      <label className="grid gap-2">
                        <span className="text-sm text-[#E0E5EB]">
                          ¿Cuántos días quieres planear?
                        </span>
                        <input
                          type="number"
                          min={3}
                          max={30}
                          value={planDays}
                          onChange={(event) =>
                            setPlanDays(
                              Math.min(
                                30,
                                Math.max(3, Number(event.target.value) || 7),
                              ),
                            )
                          }
                          className="w-full rounded-2xl border border-white/10 bg-[#171B22] px-4 py-3 text-sm text-[#E0E5EB] focus:outline-none focus:ring-2 focus:ring-white/10"
                        />
                      </label>
                      <div className="space-y-2">
                        <p className="text-sm text-[#E0E5EB]">Plataformas</p>
                        <div className="flex flex-wrap gap-2">
                          {platforms.map((platform) => {
                            const isSelected = planPlatforms.includes(platform);

                            return (
                              <button
                                key={platform}
                                type="button"
                                onClick={() =>
                                  setPlanPlatforms((current) =>
                                    isSelected
                                      ? current.filter(
                                          (item) => item !== platform,
                                        )
                                      : [...current, platform],
                                  )
                                }
                                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                                  isSelected
                                    ? "bg-white text-black"
                                    : "border border-white/10 text-[#B5BDCA] hover:border-white/20 hover:text-white"
                                }`}>
                                {formatPlatformLabel(platform)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void runPlanQuickAction()}
                        disabled={
                          planPlatforms.length === 0 ||
                          runningQuickAction === "plan"
                        }
                        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50">
                        Generar plan
                        <MoveRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {openQuickAction === "repurpose" && (
                    <div className="space-y-4">
                      {repurposePostsLoading ? (
                        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#171B22] px-4 py-4 text-sm text-[#B5BDCA]">
                          <span className="h-4 w-4 rounded-full border-2 border-[#4E576A] border-t-[#E0E5EB] animate-spin" />
                          Cargando tus posts recientes...
                        </div>
                      ) : repurposePostsLoaded &&
                        repurposePosts.length === 0 ? (
                        <div className="rounded-2xl border border-white/10 bg-[#171B22] px-4 py-4 text-sm text-[#B5BDCA]">
                          Aún no tienes posts guardados. Genera tu primer post
                          primero.
                        </div>
                      ) : (
                        <>
                          {selectedRepurposePostId && (
                            <div className="rounded-2xl border border-white/10 bg-[#171B22] p-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <PlatformBadge
                                  platform={
                                    repurposePosts.find(
                                      (post) =>
                                        post.id === selectedRepurposePostId,
                                    )?.platform ?? "linkedin"
                                  }
                                />
                                <span className="text-xs uppercase tracking-[0.22em] text-[#4E576A]">
                                  ¿Adaptar este post?
                                </span>
                              </div>
                              <p className="mt-3 text-sm leading-6 text-[#E0E5EB]">
                                {getContentPreview(
                                  repurposePosts.find(
                                    (post) =>
                                      post.id === selectedRepurposePostId,
                                  )?.platform ?? "linkedin",
                                  getDefaultFormat(
                                    repurposePosts.find(
                                      (post) =>
                                        post.id === selectedRepurposePostId,
                                    )?.platform ?? "linkedin",
                                  ),
                                  repurposePosts.find(
                                    (post) =>
                                      post.id === selectedRepurposePostId,
                                  )?.content ?? null,
                                )}
                              </p>
                              <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => void runRepurposeQuickAction()}
                                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black">
                                  Sí, adaptar
                                  <MoveRight className="h-4 w-4" />
                                </button>
                                <select
                                  value={selectedRepurposePostId}
                                  onChange={(event) =>
                                    setSelectedRepurposePostId(
                                      event.target.value,
                                    )
                                  }
                                  className="rounded-full border border-white/10 bg-[#101417] px-4 py-2 text-sm text-[#E0E5EB] focus:outline-none">
                                  {repurposePosts.map((post) => (
                                    <option key={post.id} value={post.id}>
                                      {formatPlatformLabel(post.platform)} ·{" "}
                                      {getContentPreview(
                                        post.platform,
                                        getDefaultFormat(post.platform),
                                        post.content,
                                        55,
                                      )}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {openQuickAction === "viral" && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {platforms.map((platform) => (
                          <button
                            key={platform}
                            type="button"
                            onClick={() => setViralPlatform(platform)}
                            className={`rounded-full px-4 py-2 text-sm transition-colors ${
                              viralPlatform === platform
                                ? "bg-white text-black"
                                : "border border-white/10 text-[#B5BDCA] hover:border-white/20 hover:text-white"
                            }`}>
                            {formatPlatformLabel(platform)}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => void runViralQuickAction()}
                        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black">
                        Buscar tendencias
                        <MoveRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {openQuickAction === "caseStudy" && (
                    <div className="grid gap-4">
                      <input
                        type="text"
                        value={caseStudyClient}
                        onChange={(event) =>
                          setCaseStudyClient(event.target.value)
                        }
                        placeholder="Cliente o proyecto — ej. Valtru Interiorismo"
                        className="rounded-2xl border border-white/10 bg-[#171B22] px-4 py-3 text-sm text-[#E0E5EB] placeholder:text-[#667085] focus:outline-none"
                      />
                      <input
                        type="text"
                        value={caseStudyService}
                        onChange={(event) =>
                          setCaseStudyService(event.target.value)
                        }
                        placeholder="Servicio entregado — ej. Sitio web + SEO"
                        className="rounded-2xl border border-white/10 bg-[#171B22] px-4 py-3 text-sm text-[#E0E5EB] placeholder:text-[#667085] focus:outline-none"
                      />
                      <textarea
                        value={caseStudyResult}
                        onChange={(event) =>
                          setCaseStudyResult(event.target.value)
                        }
                        placeholder="Resultado concreto — ej. Aumentó visitas orgánicas 3x en 2 meses"
                        className="min-h-[110px] rounded-2xl border border-white/10 bg-[#171B22] px-4 py-3 text-sm text-[#E0E5EB] placeholder:text-[#667085] focus:outline-none"
                      />
                      <div className="flex flex-wrap gap-2">
                        {platforms.map((platform) => (
                          <button
                            key={platform}
                            type="button"
                            onClick={() => setCaseStudyPlatform(platform)}
                            className={`rounded-full px-4 py-2 text-sm transition-colors ${
                              caseStudyPlatform === platform
                                ? "bg-white text-black"
                                : "border border-white/10 text-[#B5BDCA] hover:border-white/20 hover:text-white"
                            }`}>
                            {formatPlatformLabel(platform)}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => void runCaseStudyQuickAction()}
                        disabled={
                          !caseStudyClient.trim() ||
                          !caseStudyService.trim() ||
                          !caseStudyResult.trim()
                        }
                        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50">
                        Generar caso de estudio
                        <MoveRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {openQuickAction === "thoughtLeadership" && (
                    <div className="grid gap-4">
                      <input
                        type="text"
                        value={thoughtLeadershipTopic}
                        onChange={(event) =>
                          setThoughtLeadershipTopic(event.target.value)
                        }
                        placeholder="Tema o área — ej. IA en agencias, SEO en 2026, diseño web en México"
                        className="rounded-2xl border border-white/10 bg-[#171B22] px-4 py-3 text-sm text-[#E0E5EB] placeholder:text-[#667085] focus:outline-none"
                      />
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={thoughtLeadershipStance}
                          onChange={(event) =>
                            setThoughtLeadershipStance(event.target.value)
                          }
                          placeholder="Tu postura (opcional) — ej. La mayoría lo hace mal porque..."
                          className="w-full rounded-2xl border border-white/10 bg-[#171B22] px-4 py-3 text-sm text-[#E0E5EB] placeholder:text-[#667085] focus:outline-none"
                        />
                        <p className="text-xs text-[#4E576A]">
                          Déjalo vacío y la IA tomará una postura por ti
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {platforms.map((platform) => (
                          <button
                            key={platform}
                            type="button"
                            onClick={() =>
                              setThoughtLeadershipPlatform(platform)
                            }
                            className={`rounded-full px-4 py-2 text-sm transition-colors ${
                              thoughtLeadershipPlatform === platform
                                ? "bg-white text-black"
                                : "border border-white/10 text-[#B5BDCA] hover:border-white/20 hover:text-white"
                            }`}>
                            {formatPlatformLabel(platform)}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => void runThoughtLeadershipQuickAction()}
                        disabled={!thoughtLeadershipTopic.trim()}
                        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50">
                        Generar opinión
                        <MoveRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {openQuickAction === "faq" && (
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <textarea
                          value={faqQuestions}
                          onChange={(event) =>
                            setFaqQuestions(event.target.value)
                          }
                          placeholder="¿Qué te preguntan tus clientes? Pega varias preguntas, una por línea"
                          className="min-h-[140px] w-full rounded-2xl border border-white/10 bg-[#171B22] px-4 py-3 text-sm text-[#E0E5EB] placeholder:text-[#667085] focus:outline-none"
                        />
                        <p className="text-xs text-[#4E576A]">
                          Pega varias preguntas, una por línea
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {platforms.map((platform) => (
                          <button
                            key={platform}
                            type="button"
                            onClick={() => setFaqPlatform(platform)}
                            className={`rounded-full px-4 py-2 text-sm transition-colors ${
                              faqPlatform === platform
                                ? "bg-white text-black"
                                : "border border-white/10 text-[#B5BDCA] hover:border-white/20 hover:text-white"
                            }`}>
                            {formatPlatformLabel(platform)}
                          </button>
                        ))}
                      </div>
                      <label className="grid gap-2">
                        <span className="text-sm text-[#E0E5EB]">
                          ¿Cuántos posts?
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={faqCount}
                          onChange={(event) =>
                            setFaqCount(
                              Math.min(
                                5,
                                Math.max(1, Number(event.target.value) || 3),
                              ),
                            )
                          }
                          className="w-full rounded-2xl border border-white/10 bg-[#171B22] px-4 py-3 text-sm text-[#E0E5EB] focus:outline-none"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => void runFaqQuickAction()}
                        disabled={!faqQuestions.trim()}
                        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50">
                        Convertir en contenido
                        <MoveRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-5 border-t border-white/10" />
      </section>

      <AnimatePresence mode="wait" initial={false}>
        {!mode ? (
          <motion.div
            key="mode-selector"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="grid gap-4 transition-all duration-300 lg:grid-cols-3">
            {modeCards.map((card) => (
              <button
                key={card.key}
                type="button"
                onClick={() => enterMode(card.key)}
                className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-[#212631]/55 p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#E0E5EB]/55 hover:bg-[#2A3040]/82 hover:shadow-[0_18px_45px_rgba(0,0,0,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E0E5EB]/30">
                <div className="pointer-events-none absolute inset-0 rounded-[32px] opacity-0 transition-all duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                  <div className="absolute inset-[1px] rounded-[31px] border border-[#E0E5EB]/45 shadow-[0_0_0_1px_rgba(224,229,235,0.14),0_0_36px_rgba(224,229,235,0.16)]" />
                </div>

                <div className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-[#4E576A]">
                      {card.eyebrow}
                    </p>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#B5BDCA] transition-all duration-300 group-hover:border-white/20 group-hover:bg-white/10 group-hover:text-white">
                      {card.stepLabel}
                    </span>
                  </div>

                  <p
                    className="mt-8 text-3xl font-medium text-[#E0E5EB]"
                    style={{ fontFamily: "var(--font-brand-display)" }}>
                    {card.title}
                  </p>
                  <p className="mt-4 text-sm leading-6 text-[#8D95A6] transition-colors duration-300 group-hover:text-[#C8D0DB]">
                    {card.description}
                  </p>
                  <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all duration-300 group-hover:border-white/35 group-hover:bg-white/10">
                    Entrar
                    <MoveRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key={`mode-${mode}`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="space-y-6 transition-all duration-300">
            <section className="rounded-[32px] border border-white/10 bg-[#212631]/50 p-5 transition-all duration-300 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-[#8D95A6]">
                    <button
                      type="button"
                      onClick={() => setMode(null)}
                      className="transition-colors hover:text-white">
                      Crear
                    </button>
                    <ChevronRight className="h-3.5 w-3.5 text-[#4E576A]" />
                    <span className="text-[#E0E5EB]">
                      {mode === "explore"
                        ? "Explorar"
                        : mode === "idea"
                          ? "Desarrollar"
                          : "Directo"}
                    </span>
                  </div>
                  <p className="mt-4 text-xs uppercase tracking-[0.24em] text-[#4E576A]">
                    Plataforma
                  </p>
                  <h2
                    className="mt-2 text-2xl font-medium text-[#E0E5EB]"
                    style={{ fontFamily: "var(--font-brand-display)" }}>
                    {mode === "explore"
                      ? "Encuentra una dirección"
                      : mode === "idea"
                        ? "Desarrolla una idea"
                        : "Escribe con precisión"}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8D95A6]">
                    {mode === "explore"
                      ? "Elige plataforma y deja que la IA te proponga tres rutas concretas."
                      : mode === "idea"
                        ? "Parte de una intuición y conviértela en una pieza lista para salir."
                        : "Control total: plataforma, ángulo e idea visibles desde el inicio."}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-5">
                {renderPlatformTabs()}
                {renderFormatSelector()}

                {activePlatform === "instagram" &&
                  selectedFormats.instagram === "carousel" && (
                    <div className="grid gap-4 rounded-[24px] border border-white/10 bg-[#101417] p-4 md:grid-cols-3">
                      <label className="grid gap-2">
                        <span className="text-sm text-[#E0E5EB]">
                          ¿Cuantos slides?
                        </span>
                        <input
                          type="number"
                          min={3}
                          max={10}
                          value={instagramSlideCount}
                          onChange={(event) =>
                            setInstagramSlideCount(
                              Math.min(
                                10,
                                Math.max(3, Number(event.target.value) || 5),
                              ),
                            )
                          }
                          className="w-full rounded-2xl border border-white/10 bg-[#171B22] px-4 py-3 text-sm text-[#E0E5EB] focus:outline-none"
                        />
                      </label>
                      <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#171B22] px-4 py-3 text-sm text-[#E0E5EB]">
                        <span>Incluir slide de portada</span>
                        <input
                          type="checkbox"
                          checked={instagramIncludeCover}
                          onChange={(event) =>
                            setInstagramIncludeCover(event.target.checked)
                          }
                          className="h-4 w-4 accent-white"
                        />
                      </label>
                      <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#171B22] px-4 py-3 text-sm text-[#E0E5EB]">
                        <span>Incluir slide de CTA final</span>
                        <input
                          type="checkbox"
                          checked={instagramIncludeCta}
                          onChange={(event) =>
                            setInstagramIncludeCta(event.target.checked)
                          }
                          className="h-4 w-4 accent-white"
                        />
                      </label>
                    </div>
                  )}

                {activePlatform === "linkedin" &&
                  (selectedFormats.linkedin === "document" ||
                    selectedFormats.linkedin === "carousel") && (
                    <div className="grid gap-4 rounded-[24px] border border-white/10 bg-[#101417] p-4 md:max-w-sm">
                      <label className="grid gap-2">
                        <span className="text-sm text-[#E0E5EB]">
                          ¿Cuantas paginas?
                        </span>
                        <input
                          type="number"
                          min={5}
                          max={15}
                          value={linkedinSlideCount}
                          onChange={(event) =>
                            setLinkedinSlideCount(
                              Math.min(
                                15,
                                Math.max(5, Number(event.target.value) || 8),
                              ),
                            )
                          }
                          className="w-full rounded-2xl border border-white/10 bg-[#171B22] px-4 py-3 text-sm text-[#E0E5EB] focus:outline-none"
                        />
                      </label>
                    </div>
                  )}

                {mode === "explore" && (
                  <div className="space-y-4">
                    <p className="max-w-2xl text-sm leading-6 text-[#8D95A6]">
                      La IA propondrá tres ideas nuevas considerando tus
                      borradores sin procesar y evitando repetir temas
                      recientes.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <AIButton
                        key={`ideas-${ideasButtonState}`}
                        onClick={() => void requestSuggestedIdeas()}
                        state={ideasButtonState}
                        disabled={suggestingIdeas}
                        idleLabel={
                          suggestedIdeas.length > 0
                            ? "Sugerir otras 3"
                            : "Sugerir 3 ideas"
                        }
                        loadingPhases={IDEA_LOADING_PHASES}
                        successLabel="Ideas listas"
                        errorLabel="Reintentar ideas"
                        icon={Sparkles}
                        className="px-6 py-3 shadow-[0_10px_28px_rgba(224,229,235,0.16)] hover:shadow-[0_14px_36px_rgba(224,229,235,0.2)]"
                      />
                    </div>

                    {suggestedIdeas.length === 0 ? (
                      <div className="flex min-h-[240px] flex-col items-center justify-center rounded-[28px] border border-dashed border-zinc-700 bg-[#101417]/50 p-6 text-center text-sm leading-6 text-[#8D95A6]">
                        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5">
                          <Sparkles className="h-6 w-6 text-[#E0E5EB]" />
                        </div>
                        <p className="max-w-md">
                          Elige una plataforma y pide a la IA tres rutas para
                          desbloquear qué publicar.
                        </p>
                      </div>
                    ) : (
                      <IdeaSwipeDeck
                        key={suggestedIdeas
                          .map((suggestedIdea) =>
                            getSuggestedIdeaKey(suggestedIdea),
                          )
                          .join("|")}
                        activePlatform={activePlatform}
                        ideas={suggestedIdeas}
                        onDevelop={selectSuggestedIdea}
                        onSave={(idea) => {
                          void saveSuggestedIdea(idea);
                        }}
                        onSkip={() => {}}
                        onRequestMore={() => void requestSuggestedIdeas()}
                        savedKeys={savedSuggestedIdeaKeys}
                      />
                    )}
                  </div>
                )}

                {(mode === "idea" || mode === "direct") && (
                  <div className="space-y-5">
                    {mode === "idea" ? (
                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <span className="mb-2 text-xs font-semibold tracking-[0.28em] text-zinc-400">
                            IDEA BASE
                          </span>
                          <div className="relative">
                            <textarea
                              ref={ideaTextareaRef}
                              value={idea}
                              onChange={(event) => setIdea(event.target.value)}
                              maxLength={500}
                              placeholder={
                                ideaPlaceholders[ideaPlaceholderIndex]
                              }
                              className="min-h-[120px] w-full resize-none rounded-[28px] border border-white/10 bg-[#101417] px-4 py-4 pb-10 text-sm leading-7 text-[#E0E5EB] placeholder:text-[#667085] focus:outline-none focus:ring-2 focus:ring-[#E0E5EB]/10"
                            />
                            <div className="pointer-events-none absolute bottom-3 right-4 text-xs text-zinc-500">
                              {idea.length} / 500
                            </div>
                          </div>
                        </div>
                        {renderPillarSelector()}
                        <div className="flex flex-wrap gap-3">
                          <AIButton
                            key={`angles-${anglesButtonState}`}
                            onClick={() => void requestAngles()}
                            disabled={!idea.trim() || loadingAngles}
                            state={anglesButtonState}
                            idleLabel="Sugerir ángulos"
                            loadingPhases={ANGLE_LOADING_PHASES}
                            successLabel="Ángulos listos"
                            errorLabel="Reintentar ángulos"
                            icon={Lightbulb}
                            variant="secondary"
                          />
                          <AIButton
                            key={`generate-idea-${generateButtonState}`}
                            onClick={handleGenerateAction}
                            disabled={!canGenerate}
                            state={generateButtonState}
                            idleLabel={generationActionLabel}
                            loadingPhases={GENERATION_LOADING_PHASES}
                            successLabel="Ver resultado →"
                            errorLabel="Reintentar generación"
                            icon={Sparkles}
                          />
                        </div>

                        {angles.length > 0 && (
                          <div className="space-y-4">
                            {showAngleLibrary ? (
                              <AngleLibrary
                                activePlatform={activePlatform}
                                activeFormat={selectedFormats[activePlatform]}
                                selectedAngle={selectedAngle}
                                onSelect={(angleId) => setSelectedAngle(angleId)}
                              />
                            ) : (
                              <div className="grid gap-3 md:grid-cols-2">
                                {angles.map((angle) => (
                                  <button
                                    key={angle.type}
                                    type="button"
                                    onClick={() => setSelectedAngle(angle.type)}
                                    className={`rounded-[28px] border p-4 text-left transition-colors ${
                                      selectedAngle === angle.type
                                        ? "border-[#E0E5EB]/50 bg-[#101417]"
                                        : "border-white/10 bg-[#101417]/40 hover:border-white/20"
                                    }`}>
                                    <p className="text-xs uppercase tracking-[0.24em] text-[#4E576A]">
                                      {angle.type}
                                    </p>
                                    <p
                                      className="mt-3 text-lg font-medium text-[#E0E5EB]"
                                      style={{
                                        fontFamily: "var(--font-brand-display)",
                                      }}>
                                      {angle.hook}
                                    </p>
                                    <p className="mt-2 text-sm leading-6 text-[#8D95A6]">
                                      {angle.one_liner}
                                    </p>
                                  </button>
                                ))}
                              </div>
                            )}
                            <p className="text-sm text-[#8D95A6]">
                              ¿Prefieres elegir directamente?{" "}
                              <button
                                type="button"
                                onClick={() =>
                                  setShowAngleLibrary((current) => !current)
                                }
                                className="text-[#D3C2F1] underline decoration-[#462D6E]/70 underline-offset-4 transition-colors hover:text-[#E0E5EB]">
                                {showAngleLibrary
                                  ? "Ver sugerencias IA"
                                  : "Ver biblioteca"}
                              </button>
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <p className="text-xs uppercase tracking-[0.24em] text-[#4E576A]">
                            Ángulo
                          </p>
                          <p className="text-xs leading-5 text-[#6F7786]">
                            ¿No sabes qué elegir? Empieza con
                            &apos;Opinión&apos; o &apos;Historia&apos;
                          </p>
                        </div>
                        <AngleLibrary
                          activePlatform={activePlatform}
                          activeFormat={selectedFormats[activePlatform]}
                          selectedAngle={selectedAngle}
                          onSelect={(angleId) => setSelectedAngle(angleId)}
                        />
                        <div className="grid gap-2">
                          <span className="mb-2 text-xs font-semibold tracking-[0.28em] text-zinc-400">
                            IDEA BASE
                          </span>
                          <div className="relative">
                            <textarea
                              ref={ideaTextareaRef}
                              value={idea}
                              onChange={(event) => setIdea(event.target.value)}
                              maxLength={500}
                              placeholder={
                                ideaPlaceholders[ideaPlaceholderIndex]
                              }
                              className="min-h-[120px] w-full resize-none overflow-hidden rounded-[28px] border border-white/10 bg-[#101417] px-4 py-4 pb-10 text-sm leading-7 text-[#E0E5EB] placeholder:text-[#667085] focus:outline-none focus:ring-2 focus:ring-[#E0E5EB]/10"
                            />
                            <div className="pointer-events-none absolute bottom-3 right-4 text-xs text-zinc-500">
                              {idea.length} / 500
                            </div>
                          </div>
                        </div>
                        {renderPillarSelector()}
                        <div
                          className="inline-flex"
                          title={
                            !idea.trim() && !generating && !loadingIdea
                              ? "Escribe una idea primero"
                              : undefined
                          }>
                          <AIButton
                            key={`generate-direct-${generateButtonState}`}
                            onClick={handleGenerateAction}
                            disabled={!canGenerate}
                            state={generateButtonState}
                            idleLabel={generationActionLabel}
                            loadingPhases={GENERATION_LOADING_PHASES}
                            successLabel="Ver resultado →"
                            errorLabel="Reintentar generación"
                            icon={Sparkles}
                            className={
                              !canGenerate
                                ? "bg-white text-black opacity-40"
                                : ""
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {errorMessage && (
                  <div className="rounded-2xl border border-[#462D6E]/40 bg-[#462D6E]/10 px-4 py-3 text-sm text-[#E0E5EB]">
                    {errorMessage}
                  </div>
                )}
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {hasOutputPanel && (
        <section ref={outputSectionRef} className="space-y-4">
          {quickActionOutput?.kind === "plan" && (
            <div className="rounded-[28px] border border-white/10 bg-[#212631]/55 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-[#E0E5EB]">
                    {quickActionOutput.sourceLabel}
                  </div>
                  <p
                    className="mt-3 text-2xl font-medium text-[#E0E5EB]"
                    style={{ fontFamily: "var(--font-brand-display)" }}>
                    Plan listo para llevar al calendario
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    openCalendarForDay(
                      Math.min(
                        ...quickActionOutput.plan.map((item) => item.day),
                      ),
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/5">
                  Agregar todos
                  <CalendarDays className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 space-y-4">
                {Array.from(
                  quickActionOutput.plan.reduce((map, item) => {
                    const currentItems = map.get(item.day) ?? [];
                    currentItems.push(item);
                    map.set(item.day, currentItems);
                    return map;
                  }, new Map<number, QuickActionPlanItem[]>()),
                ).map(([day, items]) => (
                  <div
                    key={day}
                    className="rounded-[24px] border border-white/8 bg-[#101417] p-4">
                    <div className="mb-4 inline-flex rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-[#E0E5EB]">
                      Día {day}
                    </div>
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div
                          key={item.savedIdeaId}
                          className="rounded-2xl border border-white/8 bg-[#171B22] p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <PlatformBadge platform={item.platform} />
                            <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#B5BDCA]">
                              {item.angle}
                            </span>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-[#E0E5EB]">
                            {item.hook}
                          </p>
                          <p className="mt-2 text-xs leading-5 text-[#8D95A6]">
                            {item.why}
                          </p>
                          <button
                            type="button"
                            onClick={() => openCalendarForDay(item.day)}
                            className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/5">
                            Agregar al calendario
                            <CalendarDays className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {quickActionOutput?.kind === "viral" && (
            <div className="rounded-[28px] border border-white/10 bg-[#212631]/55 p-5">
              <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-[#E0E5EB]">
                {quickActionOutput.sourceLabel}
              </div>
              <p
                className="mt-3 text-2xl font-medium text-[#E0E5EB]"
                style={{ fontFamily: "var(--font-brand-display)" }}>
                Ideas para subirte a la conversación de hoy
              </p>

              <div className="mt-5 space-y-3">
                {quickActionOutput.trends.map((trend) => (
                  <div
                    key={trend.savedIdeaId}
                    className="rounded-[24px] border border-white/8 bg-[#101417] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.2em] ${
                          trend.urgency === "high"
                            ? "bg-[#7F1D1D] text-[#FCA5A5]"
                            : trend.urgency === "medium"
                              ? "bg-[#78350F] text-[#FCD34D]"
                              : "bg-[#1A3A2A] text-[#4ADE80]"
                        }`}>
                        {trend.urgency}
                      </span>
                      <PlatformBadge platform={trend.platform} />
                      <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#B5BDCA]">
                        {trend.angle}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#B5BDCA]">
                      {trend.trend_context}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[#E0E5EB]">
                      {trend.hook}
                    </p>
                    <button
                      type="button"
                      onClick={() => developTrend(trend)}
                      className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/5">
                      Desarrollar este
                      <MoveRight className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {quickActionOutput?.kind === "faq" && activeFaqPost && (
            <div className="space-y-4">
              <div className="rounded-[28px] border border-white/10 bg-[#212631]/55 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-[#E0E5EB]">
                      {quickActionOutput.sourceLabel}
                    </div>
                    <p
                      className="mt-3 text-2xl font-medium text-[#E0E5EB]"
                      style={{ fontFamily: "var(--font-brand-display)" }}>
                      FAQ convertidas en posts listos
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#E0E5EB] opacity-70">
                    <Check className="h-4 w-4" />
                    Guardar todos como borrador
                  </button>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {quickActionOutput.posts.map((post, index) => (
                    <button
                      key={post.savedPostId}
                      type="button"
                      onClick={() => setFaqActiveIndex(index)}
                      className={`rounded-full px-4 py-2 text-sm transition-colors ${
                        faqActiveIndex === index
                          ? "bg-white text-black"
                          : "text-[#8D95A6] hover:bg-white/5 hover:text-[#E0E5EB]"
                      }`}>
                      Post {index + 1}
                    </button>
                  ))}
                </div>

                <div className="mt-5 rounded-[24px] border border-white/8 bg-[#101417] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <PlatformBadge platform={activeFaqPost.platform} />
                    <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] text-[#B5BDCA]">
                      {activeFaqPost.question_used}
                    </span>
                  </div>
                  <div className="mt-4">
                    {renderPostContentBody(activeFaqPost.platform, {
                      angle: "FAQ",
                      content: activeFaqPost.content,
                      platform: activeFaqPost.platform,
                      raw: activeFaqPost.question_used,
                    })}
                  </div>
                </div>
              </div>

              <PostFeedback postId={activeFaqPost.savedPostId} />
            </div>
          )}

          {visibleGeneratedPlatforms.length > 0 && (
            <>
              <motion.div
                className="flex flex-wrap gap-2"
                initial={false}
                animate={
                  showAdaptSuccessPulse
                    ? {
                        opacity: [0.82, 1],
                        scale: [0.985, 1.01, 1],
                      }
                    : {
                        opacity: 1,
                        scale: 1,
                      }
                }
                transition={{ duration: 0.45, ease: "easeOut" }}
              >
                {visibleGeneratedPlatforms.map((platform) => (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => setActivePlatform(platform)}
                    className={`rounded-full px-4 py-2 text-sm transition-colors ${
                      platform === activePlatform
                        ? "bg-[#212631] text-[#E0E5EB]"
                        : "text-[#8D95A6] hover:bg-white/5 hover:text-[#E0E5EB]"
                    }`}>
                    {formatPlatformLabel(platform)}
                  </button>
                ))}
              </motion.div>

              {renderGeneratedContent(activePlatform)}
            </>
          )}
        </section>
      )}

      <AnimatePresence>
        {isTemplateModalOpen &&
          (() => {
            const editorPayload = getInstagramEditorPayload();
            const activeSlide = editorPayload?.slides[carouselEditorActiveIndex];

            if (!activeSlide) {
              return null;
            }

            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[32px] border border-white/10 bg-[#0A0D0F] p-8 shadow-2xl"
                >
                  <TemplateSelector
                    slideData={activeSlide}
                    currentSlideIndex={carouselEditorActiveIndex}
                    suggestedTemplateId={activeSlide.suggested_template}
                    onSelect={(template, applyToAll) => {
                      setPreSelectedTemplate(template);
                      setApplyTemplateToAll(applyToAll || false);
                      setIsTemplateModalOpen(false);
                      setIsCarouselEditorOpen(true);
                    }}
                    onKeepCurrent={() => {
                      setPreSelectedTemplate(null);
                      setIsTemplateModalOpen(false);
                      setIsCarouselEditorOpen(true);
                    }}
                  />
                </motion.div>
              </motion.div>
            );
          })()}
      </AnimatePresence>

      {isCarouselEditorOpen &&
        (() => {
          const editorPayload = getInstagramEditorPayload();

          if (!editorPayload) {
            return null;
          }

          return (
            <FabricEditor
              angle={editorPayload.angle}
              initialActiveSlideIndex={carouselEditorActiveIndex}
              initialBackgrounds={editorPayload.slideBackgrounds}
              initialEditedSlides={editorPayload.editedSlides}
              initialTemplate={preSelectedTemplate}
              initialTemplateApplyToAll={applyTemplateToAll}
              onClose={() => {
                setIsCarouselEditorOpen(false);
                setPreSelectedTemplate(null);
                setApplyTemplateToAll(false);
              }}
              onSave={handleCarouselEditorSave}
              slides={editorPayload.slides}
              postId={generatedResults.instagram?.post_id ?? undefined}
              userId={userId || ''}
              platform="instagram"
              caption={editorPayload.caption}
              hashtags={editorPayload.hashtags}
              initialActiveFilterId={editorPayload.activeFilterId}
              initialActiveFilterCSS={editorPayload.activeFilterCSS}
            />
          );
        })()}

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed right-4 bottom-4 z-50 rounded-2xl border border-white/10 bg-[#171B22] px-4 py-3 text-sm text-[#E0E5EB] shadow-[0_12px_36px_rgba(0,0,0,0.32)]">
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {assistanceVisible && (
        <div className="rounded-[28px] border border-white/10 bg-[#212631]/55 p-4 transition-all duration-300">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-[#E0E5EB]">
                ¿Primera vez creando contenido para{" "}
                {formatPlatformLabel(activePlatform)}?
              </p>
              <button
                type="button"
                onClick={() => setShowGuidancePanel((value) => !value)}
                className="mt-2 inline-flex items-center gap-2 text-sm text-[#8D95A6] transition-colors duration-300 hover:text-white">
                Te explico qué funciona mejor
                <ArrowRight
                  className={`h-4 w-4 transition-transform duration-300 ${showGuidancePanel ? "rotate-90" : ""}`}
                />
              </button>
            </div>
            <button
              type="button"
              onClick={dismissAssistance}
              className="text-xs text-zinc-500 transition-colors duration-300 hover:text-white">
              OCULTAR
            </button>
          </div>

          {showGuidancePanel && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-[#101417] p-4">
              <p
                className="text-lg font-medium text-[#E0E5EB]"
                style={{ fontFamily: "var(--font-brand-display)" }}>
                {currentGuidance.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#8D95A6]">
                Mejor para: {currentGuidance.bestFor}.
              </p>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-[#E0E5EB]">
                {currentGuidance.rules.map((rule) => (
                  <li key={rule}>• {rule}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Image Drawer */}
      <ImageDrawer 
        isOpen={isImageDrawerOpen}
        onClose={() => setImagePickerTarget(null)}
        onConfirm={handleImageConfirm}
        postContent={{
          platform: imagePickerTarget?.platform || activePlatform,
          angle: selectedAngle || "General",
          caption: getCaptionText(
            imagePickerTarget?.platform || activePlatform,
            inferPostFormat(
              imagePickerTarget?.platform || activePlatform,
              generatedResults[imagePickerTarget?.platform || activePlatform]?.content || {},
              generatedResults[imagePickerTarget?.platform || activePlatform]?.format || "tweet"
            ),
            generatedResults[imagePickerTarget?.platform || activePlatform]?.content || {}
          ),
          keywords: []
        }}
      />
    </div>
  );
}
