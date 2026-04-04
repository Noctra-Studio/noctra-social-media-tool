'use client'

import imageCompression from 'browser-image-compression'
import { startTransition, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  buildPillarDraft,
  createEmptyAudienceDraft,
  createInitialOnboardingState,
  inferCurrentOnboardingStep,
  pillarPalette,
  type OnboardingState,
  type PlatformAudienceDraft,
} from '@/lib/onboarding'
import { platforms, type Platform } from '@/lib/product'
import { useWorkspace } from '@/contexts/WorkspaceContext'

const LOGO_COMPRESSION_THRESHOLD = 1024 * 1024
const LOCAL_STORAGE_STEP_KEY = 'noctra:onboarding:step'

type ValidationErrors = Record<string, string>

type WorkspacePillarResponse = {
  color: string | null
  description: string | null
  id: string
  name: string
  sort_order: number | null
}

type WorkspaceAudienceResponse = {
  audience_description: string | null
  desired_outcomes: string[]
  id: string
  language_level: PlatformAudienceDraft['language_level'] | null
  pain_points: string[]
  platform: Platform
}

function clampStep(value: number) {
  return Math.max(1, Math.min(7, value))
}

function normalizePillars(
  pillars: Array<WorkspacePillarResponse | { color: string; description: string; name: string }> | null
) {
  if (!pillars || pillars.length === 0) {
    return [buildPillarDraft(0), buildPillarDraft(1)]
  }

  return pillars.map((pillar, index) => ({
    color: pillar.color || pillarPalette[index % pillarPalette.length],
    description: pillar.description || '',
    name: pillar.name || '',
  }))
}

function buildAudienceState(audiences: WorkspaceAudienceResponse[] | null) {
  const initialState = platforms.reduce<Record<Platform, PlatformAudienceDraft>>(
    (accumulator, platform) => {
      accumulator[platform] = createEmptyAudienceDraft()
      return accumulator
    },
    {} as Record<Platform, PlatformAudienceDraft>
  )

  for (const audience of audiences || []) {
    initialState[audience.platform] = {
      audience_description: audience.audience_description || '',
      desired_outcomes: audience.desired_outcomes || [],
      language_level: audience.language_level || 'mixed',
      pain_points: audience.pain_points || [],
    }
  }

  return initialState
}

function buildStorageKey(workspaceId: string) {
  return `${LOCAL_STORAGE_STEP_KEY}:${workspaceId}`
}

async function parseJsonResponse<T>(response: Response) {
  const payload = (await response.json()) as T & { error?: string }

  if (!response.ok) {
    throw new Error(payload.error || 'Request failed')
  }

  return payload
}

async function createSignedWorkspaceAssetUrl(
  storagePath: string,
  supabase: ReturnType<typeof createClient>
) {
  const { data, error } = await supabase.storage
    .from('workspace-assets')
    .createSignedUrl(storagePath, 60 * 60 * 24 * 7)

  if (error) {
    throw error
  }

  return data.signedUrl
}

async function maybeCompressLogo(file: File) {
  if (file.type === 'image/svg+xml' || file.size <= LOGO_COMPRESSION_THRESHOLD) {
    return file
  }

  return imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1800,
    useWebWorker: true,
  })
}

function validateStep(step: number, state: OnboardingState): ValidationErrors {
  switch (step) {
    case 1:
      return state.brand_name.trim()
        ? {}
        : { brand_name: 'Necesitamos el nombre de tu marca para continuar.' }
    case 3: {
      const errors: ValidationErrors = {}

      if (!state.tone_of_voice.trim()) {
        errors.tone_of_voice = 'Selecciona el tono principal de tu marca.'
      }

      if (!state.brand_description.trim()) {
        errors.brand_description = 'Describe tu marca en 2-3 oraciones.'
      }

      return errors
    }
    case 4: {
      const errors: ValidationErrors = {}
      const validPillars = state.pillars.filter(
        (pillar) => pillar.name.trim() && pillar.description.trim()
      )

      if (!state.industry.trim()) {
        errors.industry = 'Indica la industria o sector de tu marca.'
      }

      if (!state.target_audience.trim()) {
        errors.target_audience = 'Describe a tu cliente ideal.'
      }

      if (!state.main_goal) {
        errors.main_goal = 'Selecciona el objetivo principal del contenido.'
      }

      if (validPillars.length < 2) {
        errors.pillars = 'Agrega al menos 2 pilares con nombre y descripción.'
      }

      return errors
    }
    case 5:
      return state.use_hashtags && !state.hashtag_style
        ? { hashtag_style: 'Selecciona la intensidad de hashtags.' }
        : {}
    default:
      return {}
  }
}

export function useOnboarding() {
  const supabase = useMemo(() => createClient(), [])
  const { isLoading: workspaceLoading, workspace } = useWorkspace()
  const workspaceId = workspace?.workspace.id ?? null
  const [currentStep, setCurrentStep] = useState(1)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [state, setState] = useState<OnboardingState>(() => createInitialOnboardingState(null))
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const logoObjectUrlRef = useRef<string | null>(null)
  const debounceTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (logoObjectUrlRef.current) {
        URL.revokeObjectURL(logoObjectUrlRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (workspaceLoading) {
      return
    }

    if (!workspaceId) {
      setIsBootstrapping(false)
      return
    }

    const currentWorkspaceId = workspaceId
    let cancelled = false

    async function loadOnboardingState() {
      setIsBootstrapping(true)
      setSaveError(null)
      setValidationErrors({})

      const baseState = createInitialOnboardingState(workspace?.config)

      try {
        const [pillarsResponse, audiencesResponse] = await Promise.all([
          fetch('/api/workspace/pillars', { cache: 'no-store' }),
          fetch('/api/workspace/audiences', { cache: 'no-store' }),
        ])

        const pillarsPayload = await parseJsonResponse<{ pillars: WorkspacePillarResponse[] }>(
          pillarsResponse
        )
        const audiencesPayload = await parseJsonResponse<{ audiences: WorkspaceAudienceResponse[] }>(
          audiencesResponse
        )

        const nextState: OnboardingState = {
          ...baseState,
          audiences: buildAudienceState(audiencesPayload.audiences),
          pillars: normalizePillars(pillarsPayload.pillars),
        }

        if (nextState.logo_storage_path) {
          try {
            nextState.logo_url = await createSignedWorkspaceAssetUrl(
              nextState.logo_storage_path,
              supabase
            )
          } catch {
            nextState.logo_url = nextState.logo_url
          }
        }

        if (cancelled) {
          return
        }

        setState(nextState)

        // Always use the inferred step from actual saved data.
        // localStorage Math.max was causing stale skips (e.g. "Omitir logo"
        // persisted step=3, which then overrode inferred=2 on next load).
        const inferredStep = inferCurrentOnboardingStep(nextState)
        setCurrentStep(clampStep(inferredStep))
        setLogoFile(null)
        setLogoPreviewUrl(nextState.logo_url)
      } catch (error) {
        if (!cancelled) {
          setSaveError(
            error instanceof Error
              ? error.message
              : 'No fue posible cargar tu progreso de onboarding.'
          )
          setState({
            ...baseState,
            pillars: normalizePillars(null),
          })
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false)
        }
      }
    }

    void loadOnboardingState()

    return () => {
      cancelled = true
    }
  }, [supabase, workspace?.config, workspaceId, workspaceLoading])

  function updateState(updater: (current: OnboardingState) => OnboardingState) {
    setState((current) => updater(current))
    setSaveError(null)
  }

  function persistStep(step: number) {
    if (typeof window === 'undefined' || !workspaceId) {
      return
    }

    window.localStorage.setItem(buildStorageKey(workspaceId), String(step))
  }

  function clearPersistedStep() {
    if (typeof window === 'undefined' || !workspaceId) {
      return
    }

    window.localStorage.removeItem(buildStorageKey(workspaceId))
  }

  function setBrandField<K extends keyof OnboardingState>(field: K, value: OnboardingState[K]) {
    updateState((current) => ({ ...current, [field]: value }))
  }

  function setPostingFrequency(platform: Platform, value: number) {
    updateState((current) => ({
      ...current,
      posting_frequency: {
        ...current.posting_frequency,
        [platform]: value,
      },
    }))
  }

  function setReferencePost(index: number, value: string) {
    updateState((current) => {
      const nextPosts = [...current.reference_posts]
      nextPosts[index] = value

      return {
        ...current,
        reference_posts: nextPosts,
      }
    })
  }

  function setPillar(index: number, patch: Partial<OnboardingState['pillars'][number]>) {
    updateState((current) => ({
      ...current,
      pillars: current.pillars.map((pillar, currentIndex) =>
        currentIndex === index ? { ...pillar, ...patch } : pillar
      ),
    }))
  }

  function addPillar() {
    updateState((current) => {
      if (current.pillars.length >= 4) {
        return current
      }

      return {
        ...current,
        pillars: [...current.pillars, buildPillarDraft(current.pillars.length)],
      }
    })
  }

  function removePillar(index: number) {
    updateState((current) => {
      if (current.pillars.length <= 2) {
        return current
      }

      return {
        ...current,
        pillars: current.pillars.filter((_, currentIndex) => currentIndex !== index),
      }
    })
  }

  function setAudience(platform: Platform, patch: Partial<PlatformAudienceDraft>) {
    updateState((current) => ({
      ...current,
      audiences: {
        ...current.audiences,
        [platform]: {
          ...current.audiences[platform],
          ...patch,
        },
      },
    }))
  }

  function setLogoSelection(file: File | null) {
    if (logoObjectUrlRef.current) {
      URL.revokeObjectURL(logoObjectUrlRef.current)
      logoObjectUrlRef.current = null
    }

    setLogoFile(file)

    if (!file) {
      setLogoPreviewUrl(state.logo_url)
      return
    }

    const objectUrl = URL.createObjectURL(file)
    logoObjectUrlRef.current = objectUrl
    setLogoPreviewUrl(objectUrl)
  }

  function goBack() {
    const nextStep = clampStep(currentStep - 1)
    setSaveError(null)
    setValidationErrors({})
    startTransition(() => setCurrentStep(nextStep))
    persistStep(nextStep)
  }

  async function debouncedRun<T>(callback: () => Promise<T>) {
    await new Promise<void>((resolve) => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = window.setTimeout(() => {
        debounceTimerRef.current = null
        resolve()
      }, 220)
    })

    return callback()
  }

  async function saveStep(step = currentStep) {
    const errors = validateStep(step, state)

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return false
    }

    setValidationErrors({})
    setIsSaving(true)
    setSaveError(null)

    try {
      await debouncedRun(async () => {
        switch (step) {
          case 1: {
            await parseJsonResponse(
              await fetch('/api/workspace/config', {
                body: JSON.stringify({ brand_name: state.brand_name }),
                headers: {
                  'Content-Type': 'application/json',
                },
                method: 'PATCH',
              })
            )
            break
          }
          case 2: {
            if (!logoFile) {
              break
            }

            const preparedFile = await maybeCompressLogo(logoFile)
            const formData = new FormData()
            formData.append('file', preparedFile)

            const payload = await parseJsonResponse<{
              logo_url: string
              storage_path: string
            }>(
              await fetch('/api/workspace/upload-logo', {
                body: formData,
                method: 'POST',
              })
            )

            setState((current) => ({
              ...current,
              logo_storage_path: payload.storage_path,
              logo_url: payload.logo_url,
            }))
            setLogoPreviewUrl(payload.logo_url)
            setLogoFile(null)
            break
          }
          case 3: {
            await parseJsonResponse(
              await fetch('/api/workspace/config', {
                body: JSON.stringify({
                  brand_description: state.brand_description,
                  brand_values: state.brand_values,
                  forbidden_words: state.forbidden_words,
                  reference_posts: state.reference_posts.filter((post) => post.trim()),
                  tone_of_voice: state.tone_of_voice,
                }),
                headers: {
                  'Content-Type': 'application/json',
                },
                method: 'PATCH',
              })
            )
            break
          }
          case 4: {
            const validPillars = state.pillars
              .map((pillar) => ({
                color: pillar.color,
                description: pillar.description.trim(),
                name: pillar.name.trim(),
              }))
              .filter((pillar) => pillar.name && pillar.description)

            await Promise.all([
              parseJsonResponse(
                await fetch('/api/workspace/config', {
                  body: JSON.stringify({
                    industry: state.industry,
                    main_goal: state.main_goal,
                    posting_frequency: state.posting_frequency,
                    target_audience: state.target_audience,
                  }),
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  method: 'PATCH',
                })
              ),
              parseJsonResponse(
                await fetch('/api/workspace/pillars', {
                  body: JSON.stringify({
                    pillars: validPillars,
                  }),
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  method: 'POST',
                })
              ),
            ])
            break
          }
          case 5: {
            await parseJsonResponse(
              await fetch('/api/workspace/config', {
                body: JSON.stringify({
                  always_include_cta: state.always_include_cta,
                  assistance_level: state.assistance_level,
                  cta_style: state.cta_style,
                  hashtag_style: state.use_hashtags ? state.hashtag_style : 'none',
                  preferred_emojis: state.preferred_emojis,
                  text_length_pref: state.text_length_pref,
                  use_hashtags: state.use_hashtags,
                }),
                headers: {
                  'Content-Type': 'application/json',
                },
                method: 'PATCH',
              })
            )
            break
          }
          case 6: {
            const audiences = platforms
              .map((platform) => ({
                ...state.audiences[platform],
                platform,
              }))
              .filter(
                (audience) =>
                  audience.audience_description.trim() ||
                  audience.pain_points.length ||
                  audience.desired_outcomes.length
              )

            await Promise.all([
              parseJsonResponse(
                await fetch('/api/workspace/audiences', {
                  body: JSON.stringify({ audiences }),
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  method: 'POST',
                })
              ),
              parseJsonResponse(
                await fetch('/api/workspace/config', {
                  body: JSON.stringify({ onboarding_completed: true }),
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  method: 'PATCH',
                })
              ),
            ])

            setState((current) => ({
              ...current,
              onboarding_completed: true,
            }))
            break
          }
          default:
            break
        }
      })

      const nextStep = step >= 6 ? 7 : step + 1
      persistStep(nextStep)

      if (nextStep === 7) {
        clearPersistedStep()
      }

      startTransition(() => setCurrentStep(nextStep))

      return true
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'No fue posible guardar este paso.'
      )

      return false
    } finally {
      setIsSaving(false)
    }
  }

  function skipToStep(nextStep: number) {
    const clampedStep = clampStep(nextStep)
    setValidationErrors({})
    setSaveError(null)
    startTransition(() => setCurrentStep(clampedStep))
    // Don't persist — skipping doesn't save data, and localStorage
    // override on next load caused wrong starting step.
  }

  return {
    currentStep,
    goBack,
    isBootstrapping,
    isReady: !workspaceLoading && !isBootstrapping && Boolean(workspaceId),
    isSaving,
    logoFile,
    logoPreviewUrl,
    saveError,
    saveStep,
    setAudience,
    setBrandField,
    setCurrentStep: skipToStep,
    setLogoSelection,
    setPillar,
    setPostingFrequency,
    setReferencePost,
    state,
    validationErrors,
    workspace,
    addPillar,
    removePillar,
  }
}
