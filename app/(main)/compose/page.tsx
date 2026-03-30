"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Copy,
  Layers3,
  Lightbulb,
  Loader2,
  MoveRight,
  PenSquare,
  RefreshCcw,
  Save,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PostFeedback } from '@/components/post-feedback';
import { AIButton, type AIButtonState } from '@/components/ui/AIButton';
import { PlatformBadge } from '@/components/ui/PlatformBadge';
import {
  formatPlatformLabel,
  getPlatformGuidance,
  platforms,
  type AngleSuggestion,
  type AssistanceLevel,
  type ComposeMode,
  type GeneratedContent,
  type Platform,
  type SuggestedIdea,
} from '@/lib/product';

const assistanceStateKey = 'noctra:compose:assistance'

const modeCards: Array<{
  description: string
  eyebrow: string
  icon: LucideIcon
  key: ComposeMode
  label: string
  stepLabel: string
  title: string
}> = [
  {
    key: 'explore',
    label: 'Explora',
    stepLabel: 'Modo 1',
    icon: Sparkles,
    title: 'No sé qué publicar',
    eyebrow: 'La IA sugiere ideas para ti',
    description: 'Empieza por exploración guiada según plataforma y contexto.',
  },
  {
    key: 'idea',
    label: 'Desarrolla',
    stepLabel: 'Modo 2',
    icon: Layers3,
    title: 'Tengo una idea',
    eyebrow: 'La desarrollo contigo',
    description: 'Trae una intuición cruda y conviértela en una pieza lista para publicar.',
  },
  {
    key: 'direct',
    label: 'Ejecuta',
    stepLabel: 'Modo 3',
    icon: PenSquare,
    title: 'Sé lo que quiero',
    eyebrow: 'Editor directo',
    description: 'Elige plataforma, ángulo y ejecuta sin pasos intermedios.',
  },
]

const directAngles = ['Tutorial', 'Opinión', 'Historia', 'Caso de estudio', 'Behind the scenes', 'Contrarian']

type StoredIdeaRow = {
  id: string
  platform: Platform | null
  raw_idea: string
}

type ProfileRow = {
  assistance_level: AssistanceLevel | null
}

type AssistanceState = {
  dismissed: boolean
  usageCount: number
}

function getSuggestedIdeaKey(suggestedIdea: SuggestedIdea) {
  return `${suggestedIdea.title}-${suggestedIdea.angle}`
}

function isPlatform(value: string | null): value is Platform {
  return value === 'instagram' || value === 'linkedin' || value === 'x'
}

function readAssistanceState(): AssistanceState {
  try {
    const raw = window.localStorage.getItem(assistanceStateKey)

    if (!raw) {
      return { dismissed: false, usageCount: 0 }
    }

    const parsed = JSON.parse(raw) as Partial<AssistanceState>

    return {
      dismissed: Boolean(parsed.dismissed),
      usageCount: typeof parsed.usageCount === 'number' ? parsed.usageCount : 0,
    }
  } catch {
    return { dismissed: false, usageCount: 0 }
  }
}

function writeAssistanceState(state: AssistanceState) {
  window.localStorage.setItem(assistanceStateKey, JSON.stringify(state))
}

function formatContentForClipboard(content: Record<string, unknown>) {
  if (Array.isArray(content.thread)) {
    return content.thread.filter((item): item is string => typeof item === 'string').join('\n\n')
  }

  const caption = typeof content.caption === 'string' ? content.caption : ''
  const hashtags = Array.isArray(content.hashtags)
    ? content.hashtags.filter((item): item is string => typeof item === 'string').join(' ')
    : ''

  return [caption, hashtags].filter(Boolean).join('\n\n')
}

function formatSuggestedIdeaForClipboard(suggestedIdea: SuggestedIdea) {
  return [
    suggestedIdea.title,
    suggestedIdea.hook,
    `Angulo: ${suggestedIdea.angle}`,
    `Por que ahora: ${suggestedIdea.why_now}`,
  ].join('\n\n')
}

function PlatformIcon({ platform, className }: { platform: Platform; className?: string }) {
  if (platform === 'instagram') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
        <rect x="3.75" y="3.75" width="16.5" height="16.5" rx="5.25" />
        <circle cx="12" cy="12" r="3.5" />
        <circle cx="17.3" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (platform === 'linkedin') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M6.26 8.28a1.52 1.52 0 1 0 0-3.04 1.52 1.52 0 0 0 0 3.04ZM4.96 9.84h2.6v8.35h-2.6V9.84Zm4.23 0h2.5v1.14h.04c.35-.66 1.2-1.35 2.48-1.35 2.66 0 3.15 1.75 3.15 4.02v4.54h-2.6v-4.03c0-.96-.02-2.2-1.34-2.2-1.35 0-1.56 1.05-1.56 2.13v4.1h-2.6V9.84Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="m5.53 4.5 5.09 6.82L5.5 19.5h1.88l4.08-6.2 4.63 6.2h4.41l-5.38-7.2 4.76-7.8H18l-3.75 5.86L9.91 4.5H5.53Zm2.78 1.5h.87l8.01 12h-.87l-8-12Z" />
    </svg>
  );
}

const ideaPlaceholders = [
  "Ej: 'Quiero hablar de como el contexto cambia la calidad del contenido cuando pasas de publicar por publicar a publicar con una tesis clara...'",
  "Ej: 'Tengo una idea sobre por que muchas marcas suenan iguales en redes aunque tengan ofertas muy distintas...'",
  "Ej: 'Quiero convertir un insight de una reunion con clientes en un post util, no en una opinion vaga...'",
]

export default function ComposePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const ideaTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [mode, setMode] = useState<ComposeMode | null>(null);
  const [activePlatform, setActivePlatform] = useState<Platform>('instagram');
  const [idea, setIdea] = useState('');
  const [sourceIdeaId, setSourceIdeaId] = useState<string | null>(null);
  const [angles, setAngles] = useState<AngleSuggestion[]>([]);
  const [selectedAngle, setSelectedAngle] = useState<string | null>(null);
  const [generatedResults, setGeneratedResults] = useState<Partial<Record<Platform, GeneratedContent>>>({});
  const [loadingAngles, setLoadingAngles] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [adapting, setAdapting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [loadingIdea, setLoadingIdea] = useState(false);
  const [suggestingIdeas, setSuggestingIdeas] = useState(false);
  const [suggestedIdeas, setSuggestedIdeas] = useState<SuggestedIdea[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [assistanceLevel, setAssistanceLevel] = useState<AssistanceLevel>('balanced');
  const [assistanceDismissed, setAssistanceDismissed] = useState(false);
  const [assistanceUsageCount, setAssistanceUsageCount] = useState(0);
  const [showGuidancePanel, setShowGuidancePanel] = useState(false);
  const [savedPostIds, setSavedPostIds] = useState<Partial<Record<Platform, string>>>({});
  const [copiedSuggestedIdeaKey, setCopiedSuggestedIdeaKey] = useState<string | null>(null);
  const [savingSuggestedIdeaKey, setSavingSuggestedIdeaKey] = useState<string | null>(null);
  const [savedSuggestedIdeaKeys, setSavedSuggestedIdeaKeys] = useState<Record<string, string>>({});
  const [ideaPlaceholderIndex, setIdeaPlaceholderIndex] = useState(0);
  const [copiedResultPlatform, setCopiedResultPlatform] = useState<Platform | null>(null);
  const [ideasButtonState, setIdeasButtonState] = useState<AIButtonState>('idle');
  const [anglesButtonState, setAnglesButtonState] = useState<AIButtonState>('idle');
  const [generateButtonState, setGenerateButtonState] = useState<AIButtonState>('idle');

  const assistanceVisible =
    assistanceLevel !== 'expert' && !assistanceDismissed && assistanceUsageCount < 10;
  const currentGuidance = getPlatformGuidance(activePlatform);
  const currentModeCard = mode ? modeCards.find((card) => card.key === mode) ?? null : null;
  const currentResult = generatedResults[activePlatform];
  const canGenerate =
    Boolean(idea.trim()) && Boolean(selectedAngle) && !generating && !loadingIdea;

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
        .from('profiles')
        .select('assistance_level')
        .eq('id', user.id)
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
    setIdeasButtonState('idle');
  }, [activePlatform]);

  useEffect(() => {
    setAnglesButtonState('idle');
  }, [activePlatform, idea]);

  useEffect(() => {
    setGenerateButtonState('idle');
  }, [activePlatform, idea, selectedAngle]);

  useEffect(() => {
    const modeParam = searchParams.get('mode');
    const ideaId = searchParams.get('idea');
    const draftIdea = searchParams.get('draftIdea');
    const platformParam = searchParams.get('platform');

    if (isPlatform(platformParam)) {
      setActivePlatform(platformParam);
    }

    if (modeParam === 'explore' || modeParam === 'idea' || modeParam === 'direct') {
      setMode(modeParam);
    }

    if (draftIdea) {
      setIdea(draftIdea);
      setSourceIdeaId(null);
      setMode('idea');
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
          .from('content_ideas')
          .select('id, raw_idea, platform')
          .eq('id', ideaId)
          .maybeSingle();

        const storedIdea = data as StoredIdeaRow | null;

        if (error) {
          throw error;
        }

        if (!cancelled && storedIdea) {
          setIdea(storedIdea.raw_idea);
          setSourceIdeaId(storedIdea.id);
          if (storedIdea.platform) {
            setActivePlatform(storedIdea.platform);
          }
          setMode('idea');
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : 'No fue posible cargar la idea seleccionada.'
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
  }, [searchParams, supabase]);

  useEffect(() => {
    if (mode !== 'idea' && mode !== 'direct') {
      return;
    }

    const intervalId = window.setInterval(() => {
      setIdeaPlaceholderIndex((current) => (current + 1) % ideaPlaceholders.length);
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

    textarea.style.height = '0px';
    textarea.style.height = `${Math.max(textarea.scrollHeight, 120)}px`;
  }, [idea, mode]);

  const persistAssistanceState = (nextState: AssistanceState) => {
    setAssistanceDismissed(nextState.dismissed);
    setAssistanceUsageCount(nextState.usageCount);
    writeAssistanceState(nextState);
  };

  const dismissAssistance = () => {
    persistAssistanceState({ dismissed: true, usageCount: assistanceUsageCount });
  };

  const incrementAssistanceUsage = () => {
    const nextState = {
      dismissed: assistanceDismissed,
      usageCount: assistanceUsageCount + 1,
    };

    persistAssistanceState(nextState);
  };

  const requestSuggestedIdeas = async () => {
    setSuggestingIdeas(true);
    setIdeasButtonState('loading');
    setErrorMessage(null);

    try {
      const response = await fetch('/api/content/suggest-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: activePlatform }),
      });
      const data = (await response.json()) as { error?: string; ideas?: SuggestedIdea[] };

      if (!response.ok) {
        throw new Error(data.error || 'No fue posible sugerir ideas');
      }

      setSuggestedIdeas(data.ideas || []);
      setCopiedSuggestedIdeaKey(null);
      setSavedSuggestedIdeaKeys({});
      setIdeasButtonState('success');
    } catch (error) {
      setIdeasButtonState('error');
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible sugerir ideas');
    } finally {
      setSuggestingIdeas(false);
    }
  };

  const requestAngles = async () => {
    if (!idea.trim()) {
      return;
    }

    setLoadingAngles(true);
    setAnglesButtonState('loading');
    setErrorMessage(null);

    try {
      const response = await fetch('/api/content/angles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, platform: activePlatform }),
      });
      const data = (await response.json()) as { angles?: AngleSuggestion[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error || 'No fue posible sugerir ángulos');
      }

      setAngles(data.angles || []);
      setSelectedAngle(null);
      setAnglesButtonState('success');
    } catch (error) {
      setAnglesButtonState('error');
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible sugerir ángulos');
    } finally {
      setLoadingAngles(false);
    }
  };

  const generateContent = async () => {
    if (!idea.trim() || !selectedAngle) {
      return;
    }

    setGenerating(true);
    setGenerateButtonState('loading');
    setErrorMessage(null);

    try {
      const { data: brandVoice } = await supabase.from('brand_voice').select('*').limit(1).maybeSingle();

      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          angle: selectedAngle,
          brand_voice: brandVoice || {},
          idea,
          platform: activePlatform,
        }),
      });

      const data = (await response.json()) as GeneratedContent & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || 'No fue posible generar contenido');
      }

      setGeneratedResults((current) => ({ ...current, [activePlatform]: data }));
      incrementAssistanceUsage();
      setGenerateButtonState('success');
    } catch (error) {
      setGenerateButtonState('error');
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible generar contenido');
    } finally {
      setGenerating(false);
    }
  };

  const adaptToOtherPlatforms = async () => {
    if (!currentResult) {
      return;
    }

    setAdapting(true);
    setErrorMessage(null);

    try {
      const targetPlatforms = platforms.filter((platform) => platform !== activePlatform);
      const response = await fetch('/api/content/adapt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_platform: activePlatform,
          source_post: JSON.stringify(currentResult.content, null, 2),
          target_platforms: targetPlatforms,
        }),
      });

      const data = (await response.json()) as {
        adaptations?: Array<{ content: Record<string, unknown>; platform: Platform }>
        error?: string
      };

      if (!response.ok) {
        throw new Error(data.error || 'No fue posible adaptar contenido');
      }

      setGeneratedResults((current) => {
        const nextResults = { ...current };

        data.adaptations?.forEach((adaptation) => {
          nextResults[adaptation.platform] = {
            angle: selectedAngle || 'Adaptación',
            content: adaptation.content,
            platform: adaptation.platform,
            raw: idea,
          };
        });

        return nextResults;
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible adaptar contenido');
    } finally {
      setAdapting(false);
    }
  };

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
          throw new Error('Necesitas iniciar sesión para guardar el borrador.');
        }

        nextUserId = user.id;
        setUserId(user.id);
      }

      let ideaId = sourceIdeaId;

      if (ideaId) {
        const { error } = await supabase
          .from('content_ideas')
          .update({ platform, raw_idea: idea, status: 'drafted' })
          .eq('id', ideaId)
          .eq('user_id', nextUserId);

        if (error) {
          throw error;
        }
      } else {
        const { data, error } = await supabase
          .from('content_ideas')
          .insert([{ platform, raw_idea: idea, status: 'drafted', user_id: nextUserId }])
          .select('id')
          .single();

        const createdIdea = data as { id: string } | null;

        if (error || !createdIdea) {
          throw error || new Error('No fue posible crear la idea base');
        }

        ideaId = createdIdea.id;
        setSourceIdeaId(createdIdea.id);
      }

      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert([
          {
            angle: result.angle,
            content: result.content,
            idea_id: ideaId,
            platform,
            status: 'draft',
            user_id: nextUserId,
          },
        ])
        .select('id')
        .single();

      const createdPost = postData as { id: string } | null;

      if (postError || !createdPost) {
        throw postError || new Error('No fue posible guardar el borrador');
      }

      setSavedPostIds((current) => ({ ...current, [platform]: createdPost.id }));
      return createdPost.id;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible guardar el borrador');
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

    await navigator.clipboard.writeText(formatContentForClipboard(result.content));
    setCopiedResultPlatform(platform);

    window.setTimeout(() => {
      setCopiedResultPlatform((current) => (current === platform ? null : current));
    }, 1800);
  };

  const selectSuggestedIdea = (suggestedIdea: SuggestedIdea) => {
    setIdea(`${suggestedIdea.title}. ${suggestedIdea.hook}`);
    setSelectedAngle(null);
    setAngles([]);
    setMode('idea');
  };

  const copySuggestedIdea = async (suggestedIdea: SuggestedIdea) => {
    const suggestionKey = getSuggestedIdeaKey(suggestedIdea);

    await navigator.clipboard.writeText(formatSuggestedIdeaForClipboard(suggestedIdea));
    setCopiedSuggestedIdeaKey(suggestionKey);

    window.setTimeout(() => {
      setCopiedSuggestedIdeaKey((current) => (current === suggestionKey ? null : current));
    }, 1800);
  };

  const saveSuggestedIdea = async (suggestedIdea: SuggestedIdea) => {
    const suggestionKey = getSuggestedIdeaKey(suggestedIdea);

    if (savedSuggestedIdeaKeys[suggestionKey]) {
      return;
    }

    setSavingSuggestedIdeaKey(suggestionKey);
    setErrorMessage(null);

    try {
      let nextUserId = userId;

      if (!nextUserId) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('Necesitas iniciar sesión para guardar ideas.');
        }

        nextUserId = user.id;
        setUserId(user.id);
      }

      const rawIdea = `${suggestedIdea.title}. ${suggestedIdea.hook}`;
      const { data, error } = await supabase
        .from('content_ideas')
        .insert([
          {
            platform: activePlatform,
            raw_idea: rawIdea,
            status: 'raw',
            user_id: nextUserId,
          },
        ])
        .select('id')
        .single();

      const createdIdea = data as { id: string } | null;

      if (error || !createdIdea) {
        throw error || new Error('No fue posible guardar la idea sugerida.');
      }

      setSavedSuggestedIdeaKeys((current) => ({ ...current, [suggestionKey]: createdIdea.id }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible guardar la idea sugerida.');
    } finally {
      setSavingSuggestedIdeaKey((current) => (current === suggestionKey ? null : current));
    }
  };

  const enterMode = (nextMode: ComposeMode) => {
    setMode(nextMode);

    if (nextMode === 'direct' && !selectedAngle) {
      setSelectedAngle(directAngles[0]);
    }
  };

  const focusIdeaTextarea = () => {
    window.requestAnimationFrame(() => {
      const textarea = ideaTextareaRef.current;

      if (!textarea) {
        return;
      }

      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  const handleEditGeneratedContent = (platform: Platform) => {
    const result = generatedResults[platform];

    if (!result) {
      return;
    }

    setActivePlatform(platform);
    setSelectedAngle(result.angle);
    setMode(mode === 'direct' ? 'direct' : 'idea');
    setIdea(result.raw);
    focusIdeaTextarea();
  };

  const handleScheduleDraft = async (platform: Platform) => {
    const postId = await saveAsDraft(platform);

    if (!postId) {
      return;
    }

    router.push('/calendar');
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
              ? 'bg-white text-black'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <PlatformIcon platform={platform} className="h-4 w-4" />
          {formatPlatformLabel(platform)}
        </button>
      ))}
    </div>
  );

  const renderGeneratedContent = (platform: Platform) => {
    const result = generatedResults[platform];

    if (!result) {
      return (
        <div className="rounded-[28px] border border-dashed border-[#4E576A] p-6 text-sm leading-6 text-[#8D95A6]">
          Todavía no hay contenido generado para {formatPlatformLabel(platform)}.
        </div>
      );
    }

    const hashtags = Array.isArray(result.content.hashtags)
      ? result.content.hashtags.filter((item): item is string => typeof item === 'string')
      : [];
    const thread = Array.isArray(result.content.thread)
      ? result.content.thread.filter((item): item is string => typeof item === 'string')
      : [];
    const caption = typeof result.content.caption === 'string' ? result.content.caption : '';
    const isCopied = copiedResultPlatform === platform;

    return (
      <div className="space-y-4">
        <div className="rounded-[28px] border border-white/10 bg-[#212631]/55 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <PlatformBadge platform={platform} />
                <p className="text-xs uppercase tracking-[0.24em] text-[#4E576A]">{result.angle}</p>
              </div>
              <p
                className="mt-2 text-2xl font-medium text-[#E0E5EB]"
                style={{ fontFamily: 'var(--font-brand-display)' }}
              >
                Resultado listo para editar o guardar
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleEditGeneratedContent(platform)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/5"
            >
              <PenSquare className="h-4 w-4" />
              Editar
            </button>
            <button
              type="button"
              onClick={() => void copyResult(platform)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/5"
            >
              {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {isCopied ? 'Copiado' : 'Copiar'}
            </button>
            <button
              type="button"
              onClick={() => void saveAsDraft(platform)}
              disabled={savingDraft || Boolean(savedPostIds[platform])}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/5 disabled:opacity-60"
            >
              {savingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {savedPostIds[platform] ? 'Borrador guardado' : 'Guardar borrador'}
            </button>
            <button
              type="button"
              onClick={() => void handleScheduleDraft(platform)}
              disabled={savingDraft}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/5 disabled:opacity-60"
            >
              {savingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
              Agendar
            </button>
          </div>

          <div className="mt-5 space-y-4 text-sm leading-7 text-[#E0E5EB]">
            {caption && <p className="whitespace-pre-wrap">{caption}</p>}
            {thread.length > 0 && (
              <div className="space-y-3">
                {thread.map((tweet, index) => (
                  <div key={`${tweet.slice(0, 16)}-${index}`} className="rounded-2xl border border-white/8 bg-[#101417] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#4E576A]">Tweet {index + 1}</p>
                    <p className="mt-2 whitespace-pre-wrap">{tweet}</p>
                  </div>
                ))}
              </div>
            )}
            {hashtags.length > 0 && <p className="text-[#8D95A6]">{hashtags.join(' ')}</p>}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void adaptToOtherPlatforms()}
              disabled={adapting}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#E0E5EB] disabled:opacity-60"
            >
              {adapting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              Adaptar a otras plataformas
            </button>
          </div>
        </div>

        {savedPostIds[platform] ? (
          <PostFeedback postId={savedPostIds[platform]!} />
        ) : (
          <div className="rounded-[28px] border border-dashed border-[#4E576A] p-5 text-sm leading-6 text-[#8D95A6]">
            Guarda este resultado como borrador para activar feedback y seguimiento.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 pb-8 duration-300">
      <section className="rounded-[32px] border border-white/10 bg-[#212631]/40 p-6 sm:p-7">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.28em] text-[#4E576A]">Compose</p>
              <h1
                className="text-4xl font-medium text-[#E0E5EB]"
                style={{ fontFamily: 'var(--font-brand-display)' }}
              >
                Crea con contexto, no solo con prompts.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-[#8D95A6]">
                Entra por exploración si necesitas orientación, por desarrollo si ya tienes
                una intuición, o por directo si vienes con la pieza casi resuelta.
              </p>
            </div>
            {mode && (
              <button
                type="button"
                onClick={() => setMode(null)}
                className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-white/10 px-4 py-2 text-sm text-[#E0E5EB] transition-all duration-300 hover:border-white/30 hover:bg-white/5"
              >
                <RefreshCcw className="h-4 w-4" />
                Cambiar modo
              </button>
            )}
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
                        ? 'border-[#E0E5EB]/35 bg-[#2A3040]/85 shadow-[0_0_30px_rgba(224,229,235,0.08)]'
                        : 'border-white/8 bg-[#101417]/55'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                        <Icon className={`h-4 w-4 ${isActive ? 'text-[#E0E5EB]' : 'text-[#8D95A6]'}`} />
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${
                          isActive ? 'bg-white/10 text-[#E0E5EB]' : 'bg-white/5 text-[#4E576A]'
                        }`}
                      >
                        {card.stepLabel}
                      </span>
                    </div>
                    <p
                      className={`mt-5 text-lg font-medium ${isActive ? 'text-[#E0E5EB]' : 'text-[#B5BDCA]'}`}
                      style={{ fontFamily: 'var(--font-brand-display)' }}
                    >
                      {card.label}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#8D95A6]">{card.eyebrow}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <AnimatePresence mode="wait" initial={false}>
        {!mode ? (
          <motion.div
            key="mode-selector"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="grid gap-4 transition-all duration-300 lg:grid-cols-3"
          >
            {modeCards.map((card) => (
              <button
                key={card.key}
                type="button"
                onClick={() => enterMode(card.key)}
                className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-[#212631]/55 p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#E0E5EB]/55 hover:bg-[#2A3040]/82 hover:shadow-[0_18px_45px_rgba(0,0,0,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E0E5EB]/30"
              >
                <div className="pointer-events-none absolute inset-0 rounded-[32px] opacity-0 transition-all duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                  <div className="absolute inset-[1px] rounded-[31px] border border-[#E0E5EB]/45 shadow-[0_0_0_1px_rgba(224,229,235,0.14),0_0_36px_rgba(224,229,235,0.16)]" />
                </div>

                <div className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-[#4E576A]">{card.eyebrow}</p>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#B5BDCA] transition-all duration-300 group-hover:border-white/20 group-hover:bg-white/10 group-hover:text-white">
                      {card.stepLabel}
                    </span>
                  </div>

                  <p
                    className="mt-8 text-3xl font-medium text-[#E0E5EB]"
                    style={{ fontFamily: 'var(--font-brand-display)' }}
                  >
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
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-6 transition-all duration-300"
          >
            <section className="rounded-[32px] border border-white/10 bg-[#212631]/50 p-5 transition-all duration-300 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-[#8D95A6]">
                    <button
                      type="button"
                      onClick={() => setMode(null)}
                      className="transition-colors hover:text-white"
                    >
                      Crear
                    </button>
                    <ChevronRight className="h-3.5 w-3.5 text-[#4E576A]" />
                    <span className="text-[#E0E5EB]">
                      {mode === 'explore' ? 'Explorar' : mode === 'idea' ? 'Desarrollar' : 'Directo'}
                    </span>
                  </div>
                  <p className="mt-4 text-xs uppercase tracking-[0.24em] text-[#4E576A]">Plataforma</p>
                  <h2
                    className="mt-2 text-2xl font-medium text-[#E0E5EB]"
                    style={{ fontFamily: 'var(--font-brand-display)' }}
                  >
                    {mode === 'explore'
                      ? 'Encuentra una dirección'
                      : mode === 'idea'
                        ? 'Desarrolla una idea'
                        : 'Escribe con precisión'}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8D95A6]">
                    {mode === 'explore'
                      ? 'Elige plataforma y deja que la IA te proponga tres rutas concretas.'
                      : mode === 'idea'
                        ? 'Parte de una intuición y conviértela en una pieza lista para salir.'
                        : 'Control total: plataforma, ángulo e idea visibles desde el inicio.'}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-5">
                {renderPlatformTabs()}

                {mode === 'explore' && (
                  <div className="space-y-4">
                    <p className="max-w-2xl text-sm leading-6 text-[#8D95A6]">
                      La IA propondrá tres ideas nuevas considerando tus borradores sin
                      procesar y evitando repetir temas recientes.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <AIButton
                        onClick={() => void requestSuggestedIdeas()}
                        state={ideasButtonState}
                        disabled={suggestingIdeas}
                        idleLabel={suggestedIdeas.length > 0 ? 'Sugerir otras 3' : 'Sugerir 3 ideas'}
                        loadingLabel="Generando ideas"
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
                          Elige una plataforma y pide a la IA tres rutas para desbloquear qué
                          publicar.
                        </p>
                      </div>
                    ) : (
                      <div
                        key={suggestedIdeas.map((suggestedIdea) => getSuggestedIdeaKey(suggestedIdea)).join('|')}
                        className="grid gap-4 animate-fadeIn lg:grid-cols-3"
                      >
                        {suggestedIdeas.map((suggestedIdea) => {
                          const suggestionKey = getSuggestedIdeaKey(suggestedIdea);
                          const isSaved = Boolean(savedSuggestedIdeaKeys[suggestionKey]);
                          const isCopied = copiedSuggestedIdeaKey === suggestionKey;
                          const isSaving = savingSuggestedIdeaKey === suggestionKey;

                          return (
                            <div
                              key={suggestionKey}
                              className="rounded-[28px] border border-white/10 bg-[#101417] p-5 text-left transition-colors hover:border-[#E0E5EB]/40"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-xs uppercase tracking-[0.24em] text-[#4E576A]">
                                  {suggestedIdea.angle}
                                </p>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => void copySuggestedIdea(suggestedIdea)}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-[#8D95A6] transition-colors hover:border-white/20 hover:text-white"
                                  >
                                    {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                    {isCopied ? 'Copiado' : 'Copiar'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void saveSuggestedIdea(suggestedIdea)}
                                    disabled={isSaved || isSaving}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-[#8D95A6] transition-colors hover:border-white/20 hover:text-white disabled:opacity-60"
                                  >
                                    {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                    {isSaved ? 'Guardada' : 'Guardar como idea'}
                                  </button>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => selectSuggestedIdea(suggestedIdea)}
                                className="mt-3 block w-full text-left"
                              >
                                <p
                                  className="text-xl font-medium text-[#E0E5EB]"
                                  style={{ fontFamily: 'var(--font-brand-display)' }}
                                >
                                  {suggestedIdea.title}
                                </p>
                                <p className="mt-3 text-sm leading-6 text-[#E0E5EB]">{suggestedIdea.hook}</p>
                                <p className="mt-4 inline-flex rounded-full bg-[#462D6E]/15 px-3 py-1 text-xs text-[#D3C2F1]">
                                  {suggestedIdea.why_now}
                                </p>
                                <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-white underline-offset-2 hover:underline">
                                  Desarrollar esta idea
                                  <MoveRight className="h-4 w-4" />
                                </div>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {(mode === 'idea' || mode === 'direct') && (
                  <div className="space-y-5">
                    {mode === 'idea' ? (
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
                              placeholder={ideaPlaceholders[ideaPlaceholderIndex]}
                              className="min-h-[120px] w-full resize-none rounded-[28px] border border-white/10 bg-[#101417] px-4 py-4 pb-10 text-sm leading-7 text-[#E0E5EB] placeholder:text-[#667085] focus:outline-none focus:ring-2 focus:ring-[#E0E5EB]/10"
                            />
                            <div className="pointer-events-none absolute bottom-3 right-4 text-xs text-zinc-500">
                              {idea.length} / 500
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <AIButton
                            onClick={() => void requestAngles()}
                            disabled={!idea.trim() || loadingAngles}
                            state={anglesButtonState}
                            idleLabel="Sugerir ángulos"
                            loadingLabel="Pensando ángulos"
                            successLabel="Ángulos listos"
                            errorLabel="Reintentar ángulos"
                            icon={Lightbulb}
                            variant="secondary"
                          />
                          <AIButton
                            onClick={() => void generateContent()}
                            disabled={!canGenerate}
                            state={generateButtonState}
                            idleLabel="Generar contenido"
                            loadingLabel="Generando contenido"
                            successLabel="Contenido listo"
                            errorLabel="Reintentar generación"
                            icon={Sparkles}
                          />
                        </div>

                        {angles.length > 0 && (
                          <div className="grid gap-3 md:grid-cols-2">
                            {angles.map((angle) => (
                              <button
                                key={angle.type}
                                type="button"
                                onClick={() => setSelectedAngle(angle.type)}
                                className={`rounded-[28px] border p-4 text-left transition-colors ${
                                  selectedAngle === angle.type
                                    ? 'border-[#E0E5EB]/50 bg-[#101417]'
                                    : 'border-white/10 bg-[#101417]/40 hover:border-white/20'
                                }`}
                              >
                                <p className="text-xs uppercase tracking-[0.24em] text-[#4E576A]">{angle.type}</p>
                                <p
                                  className="mt-3 text-lg font-medium text-[#E0E5EB]"
                                  style={{ fontFamily: 'var(--font-brand-display)' }}
                                >
                                  {angle.hook}
                                </p>
                                <p className="mt-2 text-sm leading-6 text-[#8D95A6]">{angle.one_liner}</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <p className="text-xs uppercase tracking-[0.24em] text-[#4E576A]">Ángulo</p>
                          <p className="text-xs leading-5 text-[#6F7786]">
                            ¿No sabes qué elegir? Empieza con &apos;Opinión&apos; o &apos;Historia&apos;
                          </p>
                        </div>
                        <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1">
                          {directAngles.map((angle) => (
                            <button
                              key={angle}
                              type="button"
                              onClick={() => setSelectedAngle(angle)}
                              className={`shrink-0 cursor-pointer whitespace-nowrap rounded-full px-4 py-2 text-sm transition-all duration-200 ${
                                selectedAngle === angle
                                  ? 'bg-white font-medium text-black'
                                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                              }`}
                            >
                              {angle}
                            </button>
                          ))}
                        </div>
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
                              placeholder={ideaPlaceholders[ideaPlaceholderIndex]}
                              className="min-h-[120px] w-full resize-none overflow-hidden rounded-[28px] border border-white/10 bg-[#101417] px-4 py-4 pb-10 text-sm leading-7 text-[#E0E5EB] placeholder:text-[#667085] focus:outline-none focus:ring-2 focus:ring-[#E0E5EB]/10"
                            />
                            <div className="pointer-events-none absolute bottom-3 right-4 text-xs text-zinc-500">
                              {idea.length} / 500
                            </div>
                          </div>
                        </div>
                        <div
                          className="inline-flex"
                          title={!idea.trim() && !generating && !loadingIdea ? 'Escribe una idea primero' : undefined}
                        >
                          <AIButton
                            onClick={() => void generateContent()}
                            disabled={!canGenerate}
                            state={generateButtonState}
                            idleLabel="Generar contenido"
                            loadingLabel="Generando contenido"
                            successLabel="Contenido listo"
                            errorLabel="Reintentar generación"
                            icon={Sparkles}
                            className={!canGenerate ? 'bg-white text-black opacity-40' : ''}
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

            {(Object.keys(generatedResults).length > 0 || currentResult) && (
              <section className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {platforms
                    .filter((platform) => generatedResults[platform])
                    .map((platform) => (
                      <button
                        key={platform}
                        type="button"
                        onClick={() => setActivePlatform(platform)}
                        className={`rounded-full px-4 py-2 text-sm transition-colors ${
                          platform === activePlatform
                            ? 'bg-[#212631] text-[#E0E5EB]'
                            : 'text-[#8D95A6] hover:bg-white/5 hover:text-[#E0E5EB]'
                        }`}
                      >
                        {formatPlatformLabel(platform)}
                      </button>
                    ))}
                </div>

                {renderGeneratedContent(activePlatform)}
              </section>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {assistanceVisible && (
        <div className="rounded-[28px] border border-white/10 bg-[#212631]/55 p-4 transition-all duration-300">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-[#E0E5EB]">
                ¿Primera vez creando contenido para {formatPlatformLabel(activePlatform)}?
              </p>
              <button
                type="button"
                onClick={() => setShowGuidancePanel((value) => !value)}
                className="mt-2 inline-flex items-center gap-2 text-sm text-[#8D95A6] transition-colors duration-300 hover:text-white"
              >
                Te explico qué funciona mejor
                <ArrowRight className={`h-4 w-4 transition-transform duration-300 ${showGuidancePanel ? 'rotate-90' : ''}`} />
              </button>
            </div>
            <button
              type="button"
              onClick={dismissAssistance}
              className="text-xs text-zinc-500 transition-colors duration-300 hover:text-white"
            >
              OCULTAR
            </button>
          </div>

          {showGuidancePanel && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-[#101417] p-4">
              <p
                className="text-lg font-medium text-[#E0E5EB]"
                style={{ fontFamily: 'var(--font-brand-display)' }}
              >
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
    </div>
  );
}
