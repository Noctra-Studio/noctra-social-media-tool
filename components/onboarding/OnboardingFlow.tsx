'use client'
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import {
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  ImagePlus,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { TagInput } from '@/components/ui/tag-input'
import { useOnboarding } from '@/hooks/useOnboarding'
import {
  assistanceOptions,
  hashtagStyleOptions,
  industrySuggestions,
  mainGoalOptions,
  onboardingStepLabels,
  platformAudienceLevels,
  textLengthOptions,
  toneOfVoiceOptions,
} from '@/lib/onboarding'
import { formatPlatformLabel, platforms, type Platform } from '@/lib/product'
import { ProgressBar } from '@/components/onboarding/ProgressBar'

type OnboardingFlowProps = {
  firstName: string
}

function getFieldClass(hasError = false, isTextarea = false) {
  return `${
    isTextarea ? 'min-h-[120px]' : 'min-h-[52px]'
  } w-full rounded-[18px] border px-4 py-3.5 text-[14px] text-white placeholder:text-white/25 focus:outline-none transition-colors ${
    hasError
      ? 'border-[#E25B5B] bg-[#E25B5B]/[0.07]'
      : 'border-white/[0.08] bg-white/[0.03] focus:border-[#6B47CC]/60 focus:bg-white/[0.05]'
  }`
}

function Switch({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (nextValue: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex min-h-[44px] w-full items-center justify-between rounded-[22px] border border-white/[0.07] bg-white/[0.02] px-4 py-4 text-left transition hover:border-white/20"
    >
      <span className="text-sm text-white/85">{label}</span>
      <span
        className={`relative h-7 w-12 rounded-full transition-colors ${
          checked ? 'bg-[#6B47CC]' : 'bg-white/15'
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </span>
    </button>
  )
}

function StepHeader({
  eyebrow,
  subtitle,
  title,
}: {
  eyebrow: string
  subtitle: string
  title: string
}) {
  return (
    <div className="mb-8 space-y-2">
      <p className="text-[10px] uppercase tracking-[0.38em] text-white/30">{eyebrow}</p>
      <h1
        className="text-3xl font-medium leading-snug text-white sm:text-[2.25rem]"
        style={{ fontFamily: 'var(--font-brand-display)' }}
      >
        {title}
      </h1>
      <p className="max-w-xl text-[14px] leading-[1.7] text-white/50">{subtitle}</p>
    </div>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return <p className="mt-2 text-sm text-[#FF8E8E]">{message}</p>
}

export function OnboardingFlow({ firstName }: OnboardingFlowProps) {
  const router = useRouter()
  const {
    addPillar,
    currentStep,
    goBack,
    isBootstrapping,
    isReady,
    isSaving,
    logoPreviewUrl,
    removePillar,
    saveError,
    saveStep,
    setAudience,
    setBrandField,
    setCurrentStep,
    setLogoSelection,
    setPillar,
    setPostingFrequency,
    setReferencePost,
    state,
    validationErrors,
    workspace,
  } = useOnboarding()
  const [activePlatform, setActivePlatform] = useState<Platform>('instagram')

  const workspaceName = workspace?.workspace.name || state.brand_name || 'tu workspace'
  const configuredPlatforms = useMemo(
    () =>
      platforms
        .filter((platform) => (state.posting_frequency[platform] || 0) > 0)
        .map((platform) => formatPlatformLabel(platform))
        .join(' · '),
    [state.posting_frequency]
  )

  const dropzone = useDropzone({
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/svg+xml': ['.svg'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    onDropAccepted(files) {
      setLogoSelection(files[0] ?? null)
    },
  })
  const dropzoneError = dropzone.fileRejections[0]?.errors[0]?.message

  async function handleNext() {
    const wasSaved = await saveStep(currentStep)

    if (!wasSaved) {
      return
    }
  }

  function renderStep() {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <StepHeader
              eyebrow="Paso 1 · Empecemos"
              title={`Hola, ${firstName}. ¿Cómo se llama tu marca?`}
              subtitle="6 pasos para que la IA entienda tu marca y genere contenido que suene exactamente como tú."
            />

            <div className="space-y-2">
              <input
                type="text"
                value={state.brand_name}
                onChange={(event) => setBrandField('brand_name', event.target.value)}
                placeholder="Ej: Valtru Interiorismo"
                className={getFieldClass(Boolean(validationErrors.brand_name))}
                autoFocus
              />
              <FieldError message={validationErrors.brand_name} />
              <p className="px-1 text-[12px] text-white/30">
                Aparecerá en tus exportaciones y reportes.
              </p>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-6">
            <StepHeader
              eyebrow="Paso 2 · Identidad visual"
              title="Sube el logo de tu marca"
              subtitle="Lo usaremos en carruseles y exportaciones. PNG, JPG, SVG o WEBP · máx 5MB. Puedes omitirlo y añadirlo después."
            />

            <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
              <button
                type="button"
                {...dropzone.getRootProps()}
                className={`group rounded-[22px] border border-dashed p-8 text-left transition ${
                  dropzone.isDragActive
                    ? 'border-[#6B47CC] bg-[#6B47CC]/10'
                    : 'border-white/[0.1] hover:border-[#6B47CC]/60 hover:bg-white/[0.02]'
                }`}
              >
                <input {...dropzone.getInputProps()} />
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <ImagePlus className="h-5 w-5 text-white/50" />
                  </div>
                  <div>
                    <p className="text-[13px] text-white/70">
                      {dropzone.isDragActive ? 'Suelta aquí' : 'Arrastra o haz clic para seleccionar'}
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/25">
                      PNG · JPG · SVG · WEBP
                    </p>
                  </div>
                </div>
              </button>

              <div className="flex flex-col gap-3 rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-4">
                <p className="text-[10px] uppercase tracking-[0.24em] text-white/30">Preview</p>
                <div className="flex flex-1 items-center justify-center rounded-[16px] border border-white/[0.06] bg-black/20 p-4">
                  {logoPreviewUrl ? (
                    <img
                      src={logoPreviewUrl}
                      alt="Vista previa del logo"
                      className="max-h-20 w-auto object-contain"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full border border-white/10 bg-white/[0.03]" />
                  )}
                </div>
                {dropzoneError ? (
                  <p className="text-[12px] text-[#FF8E8E]">{dropzoneError}</p>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="text-[13px] text-white/35 transition hover:text-white/60"
            >
              Omitir por ahora →
            </button>
          </div>
        )
      case 3:
        return (
          <div className="space-y-6">
            <StepHeader
              eyebrow="Paso 3 · Voz de marca"
              title="¿Cómo suena tu marca?"
              subtitle="La IA escribirá como tú. Cuéntanos sobre tu personalidad y tono."
            />

            <div className="grid gap-5">
              <div>
                <p className="mb-3 text-[13px] font-medium text-white/75">Tono de comunicación</p>
                <div className="flex flex-wrap gap-2">
                  {toneOfVoiceOptions.map((option) => {
                    const active = state.tone_of_voice === option

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setBrandField('tone_of_voice', option)}
                        className={`min-h-[44px] rounded-full border px-4 py-2 text-[13px] transition ${
                          active
                            ? 'border-[#6B47CC] bg-[#6B47CC]/20 text-white'
                            : 'border-white/[0.08] bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white/80'
                        }`}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>
                <FieldError message={validationErrors.tone_of_voice} />
              </div>

              <label className="block">
                <span className="text-sm font-medium text-white/90">
                  Describe tu marca en 2-3 oraciones
                </span>
                <textarea
                  value={state.brand_description}
                  onChange={(event) => setBrandField('brand_description', event.target.value)}
                  placeholder="Somos un estudio de interiorismo enfocado en transformar espacios..."
                  className={`mt-3 ${getFieldClass(Boolean(validationErrors.brand_description), true)}`}
                />
                <FieldError message={validationErrors.brand_description} />
              </label>

              <div>
                <p className="text-sm font-medium text-white/90">Valores de marca</p>
                <div className="mt-3">
                  <TagInput
                    value={state.brand_values}
                    maxTags={5}
                    placeholder="Escribe un valor y presiona Enter"
                    onChange={(value) => setBrandField('brand_values', value)}
                  />
                </div>
                <p className="mt-2 text-sm text-white/45">
                  Ejemplos: Calidad, Transparencia, Innovación, Resultados, Confianza
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-white/90">
                  Palabras que NUNCA debe usar la IA
                </p>
                <div className="mt-3">
                  <TagInput
                    value={state.forbidden_words}
                    maxTags={10}
                    placeholder="Escribe una palabra y presiona Enter"
                    onChange={(value) => setBrandField('forbidden_words', value)}
                  />
                </div>
                <p className="mt-2 text-sm text-white/45">
                  Jerga, términos de la competencia o palabras que no representan tu marca.
                </p>
              </div>

              <div className="grid gap-3">
                <div>
                  <p className="text-sm font-medium text-white/90">
                    2-3 posts reales que representen tu voz
                  </p>
                  <p className="mt-1 text-sm text-white/45">Opcional</p>
                </div>
                {state.reference_posts.map((post, index) => (
                  <label key={`reference-post-${index}`} className="block">
                    <span className="text-sm text-white/65">Ejemplo de post {index + 1}</span>
                    <textarea
                      value={post}
                      onChange={(event) => setReferencePost(index, event.target.value)}
                      placeholder="Pega aquí un post real que te haya gustado cómo quedó"
                      className={`mt-3 ${getFieldClass(false, true)}`}
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        )
      case 4:
        return (
          <div className="space-y-6">
            <StepHeader
              eyebrow="Paso 4 · Estrategia"
              title="¿Qué quieres lograr con tu contenido?"
              subtitle="Define el enfoque, la audiencia y los temas que la IA priorizará."
            />

            <div className="grid gap-5">
              <label className="block">
                <span className="text-sm font-medium text-white/90">Industria o sector</span>
                <input
                  list="industry-suggestions"
                  type="text"
                  value={state.industry}
                  onChange={(event) => setBrandField('industry', event.target.value)}
                  placeholder="Ej: Bienes raíces, Tecnología, Educación, Salud..."
                  className={`mt-3 ${getFieldClass(Boolean(validationErrors.industry))}`}
                />
                <datalist id="industry-suggestions">
                  {industrySuggestions.map((suggestion) => (
                    <option key={suggestion} value={suggestion} />
                  ))}
                </datalist>
                <FieldError message={validationErrors.industry} />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-white/90">Describe a tu cliente ideal</span>
                <textarea
                  value={state.target_audience}
                  onChange={(event) => setBrandField('target_audience', event.target.value)}
                  placeholder="Emprendedores de 30-45 años en Querétaro que buscan mejorar su presencia digital..."
                  className={`mt-3 ${getFieldClass(Boolean(validationErrors.target_audience), true)}`}
                />
                <FieldError message={validationErrors.target_audience} />
              </label>

              <div>
                <p className="text-sm font-medium text-white/90">Objetivo principal</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {mainGoalOptions.map((option) => {
                    const active = state.main_goal === option.value

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setBrandField('main_goal', option.value)}
                        className={`rounded-[24px] border p-4 text-left transition ${
                          active
                            ? 'border-[#6B47CC] bg-[#6B47CC]/16'
                            : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                        }`}
                      >
                        <p className="text-xl">{option.icon}</p>
                        <p className="mt-3 text-sm font-medium text-white">{option.label}</p>
                        <p className="mt-2 text-sm leading-6 text-white/55">{option.description}</p>
                      </button>
                    )
                  })}
                </div>
                <FieldError message={validationErrors.main_goal} />
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/[0.02] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white/90">
                      ¿Sobre qué temas va a hablar tu cuenta?
                    </p>
                    <p className="mt-1 text-sm text-white/45">Máx. 4 pilares</p>
                  </div>
                  {state.pillars.length < 4 ? (
                    <button
                      type="button"
                      onClick={addPillar}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:border-white/20 hover:text-white"
                    >
                      <Plus className="h-4 w-4" />
                      Añadir pilar
                    </button>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-4">
                  {state.pillars.map((pillar, index) => (
                    <div
                      key={`pillar-${index}`}
                      className="rounded-[24px] border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="h-4 w-4 rounded-full"
                            style={{ backgroundColor: pillar.color }}
                          />
                          <p className="text-sm text-white/70">Pilar {index + 1}</p>
                        </div>
                        {state.pillars.length > 2 ? (
                          <button
                            type="button"
                            onClick={() => removePillar(index)}
                            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/10 text-white/55 transition hover:border-white/20 hover:text-white"
                            aria-label={`Eliminar pilar ${index + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>

                      <div className="mt-4 grid gap-3">
                        <input
                          type="text"
                          value={pillar.name}
                          onChange={(event) => setPillar(index, { name: event.target.value })}
                          placeholder="Ej: Casos de éxito"
                          className={getFieldClass(false)}
                        />
                        <textarea
                          value={pillar.description}
                          onChange={(event) =>
                            setPillar(index, { description: event.target.value })
                          }
                          placeholder="Breve descripción de este pilar y qué tipo de ángulos debería producir."
                          className={getFieldClass(false, true)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <FieldError message={validationErrors.pillars} />
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/[0.02] p-5">
                <p className="text-sm font-medium text-white/90">
                  ¿Cuántas veces por semana planeas publicar en cada plataforma?
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {platforms.map((platform) => (
                    <label key={platform} className="block rounded-[24px] border border-white/10 p-4">
                      <span className="text-sm text-white/75">{formatPlatformLabel(platform)}</span>
                      <input
                        type="number"
                        min={0}
                        max={14}
                        value={state.posting_frequency[platform]}
                        onChange={(event) =>
                          setPostingFrequency(platform, Number(event.target.value || 0))
                        }
                        className={`mt-3 ${getFieldClass(false)}`}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      case 5:
        return (
          <div className="space-y-6">
            <StepHeader
              eyebrow="Paso 5 · Asistencia"
              title="¿Cuánto control quieres sobre el contenido?"
              subtitle="Elige cómo quieres trabajar con la IA día a día."
            />

            <div className="grid gap-4 lg:grid-cols-3">
              {assistanceOptions.map((option) => {
                const active = state.assistance_level === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setBrandField('assistance_level', option.value)}
                    className={`relative rounded-[28px] border p-5 text-left transition ${
                      active
                        ? 'border-[#6B47CC] bg-[#6B47CC]/18'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                    }`}
                  >
                    {option.badge ? (
                      <span className="absolute right-4 top-4 rounded-full border border-[#6B47CC] bg-[#6B47CC]/18 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/85">
                        {option.badge}
                      </span>
                    ) : null}
                    <p className="text-2xl">{option.icon}</p>
                    <p className="mt-4 text-lg text-white">{option.label}</p>
                    <p className="mt-2 text-sm leading-6 text-white/55">{option.description}</p>
                  </button>
                )
              })}
            </div>

            <div className="grid gap-4 rounded-[30px] border border-white/10 bg-white/[0.02] p-5">
              <div className="space-y-2">
                <p className="text-sm font-medium text-white/90">Preferencias de estilo</p>
                <p className="text-sm text-white/45">
                  Esto nos ayuda a generar borradores más cercanos a cómo escribes hoy.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Switch
                  checked={state.preferred_emojis}
                  label="¿Usar emojis en los posts?"
                  onChange={(nextValue) => setBrandField('preferred_emojis', nextValue)}
                />
                <Switch
                  checked={state.use_hashtags}
                  label="¿Incluir hashtags?"
                  onChange={(nextValue) => setBrandField('use_hashtags', nextValue)}
                />
                <Switch
                  checked={state.always_include_cta}
                  label="¿Incluir llamada a la acción siempre?"
                  onChange={(nextValue) => setBrandField('always_include_cta', nextValue)}
                />
              </div>

              {state.use_hashtags ? (
                <div>
                  <p className="text-sm font-medium text-white/90">Intensidad de hashtags</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {hashtagStyleOptions.map((option) => {
                      const active = state.hashtag_style === option.value

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setBrandField('hashtag_style', option.value)}
                          className={`rounded-[22px] border p-4 text-left transition ${
                            active
                              ? 'border-[#6B47CC] bg-[#6B47CC]/16'
                              : 'border-white/10 bg-black/20 hover:border-white/20'
                          }`}
                        >
                          <p className="text-sm font-medium text-white">{option.label}</p>
                          <p className="mt-2 text-sm leading-6 text-white/50">{option.description}</p>
                        </button>
                      )
                    })}
                  </div>
                  <FieldError message={validationErrors.hashtag_style} />
                </div>
              ) : null}

              <div>
                <p className="text-sm font-medium text-white/90">Longitud preferida del texto</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {textLengthOptions.map((option) => {
                    const active = state.text_length_pref === option.value

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setBrandField('text_length_pref', option.value)}
                        className={`rounded-[22px] border px-4 py-3 text-left text-sm transition ${
                          active
                            ? 'border-[#6B47CC] bg-[#6B47CC]/16 text-white'
                            : 'border-white/10 bg-black/20 text-white/65 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-white/90">Texto de tu CTA habitual</span>
                <input
                  type="text"
                  value={state.cta_style}
                  onChange={(event) => setBrandField('cta_style', event.target.value)}
                  placeholder="Ej: Escríbenos por WhatsApp, Agenda una llamada gratuita"
                  className={`mt-3 ${getFieldClass(false)}`}
                />
              </label>
            </div>
          </div>
        )
      case 6:
        return (
          <div className="space-y-6">
            <StepHeader
              eyebrow="Paso 6 · Plataformas"
              title="Afina el contenido por plataforma"
              subtitle="Opcional pero poderoso — cada red tiene una audiencia distinta. Puedes completarlo después."
            />

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {platforms.map((platform) => {
                  const active = activePlatform === platform

                  return (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => setActivePlatform(platform)}
                      className={`min-h-[44px] rounded-full border px-4 py-2 text-sm transition ${
                        active
                          ? 'border-[#6B47CC] bg-[#6B47CC]/16 text-white'
                          : 'border-white/10 text-white/65 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {formatPlatformLabel(platform)}
                    </button>
                  )
                })}
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/[0.02] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-lg text-white">{formatPlatformLabel(activePlatform)}</p>
                    <p className="mt-1 text-sm text-white/45">
                      Ajusta el matiz de audiencia para esta red.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4">
                  <label className="block">
                    <span className="text-sm font-medium text-white/90">¿Quién te lee aquí?</span>
                    <textarea
                      value={state.audiences[activePlatform].audience_description}
                      onChange={(event) =>
                        setAudience(activePlatform, {
                          audience_description: event.target.value,
                        })
                      }
                      className={`mt-3 ${getFieldClass(false, true)}`}
                    />
                  </label>

                  <div>
                    <span className="text-sm font-medium text-white/90">
                      ¿Qué problema tienen?
                    </span>
                    <div className="mt-3">
                      <TagInput
                        value={state.audiences[activePlatform].pain_points}
                        placeholder="Agrega un pain point"
                        onChange={(value) =>
                          setAudience(activePlatform, { pain_points: value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-sm font-medium text-white/90">
                      ¿Qué buscan lograr?
                    </span>
                    <div className="mt-3">
                      <TagInput
                        value={state.audiences[activePlatform].desired_outcomes}
                        placeholder="Agrega un outcome"
                        onChange={(value) =>
                          setAudience(activePlatform, { desired_outcomes: value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-sm font-medium text-white/90">Nivel técnico</span>
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      {platformAudienceLevels.map((level) => {
                        const active = state.audiences[activePlatform].language_level === level
                        const label =
                          level === 'non-technical'
                            ? 'No técnico'
                            : level === 'technical'
                              ? 'Técnico'
                              : 'Mixto'

                        return (
                          <button
                            key={`${activePlatform}-${level}`}
                            type="button"
                            onClick={() => setAudience(activePlatform, { language_level: level })}
                            className={`rounded-[22px] border px-4 py-3 text-sm transition ${
                              active
                                ? 'border-[#6B47CC] bg-[#6B47CC]/16 text-white'
                                : 'border-white/10 bg-black/20 text-white/65 hover:border-white/20 hover:text-white'
                            }`}
                          >
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="text-sm text-white/55 transition hover:text-white"
              >
                Omitir este paso
              </button>
            </div>
          </div>
        )
      default:
        return (
          <div className="space-y-8">
            <div className="rounded-[32px] border border-[#6B47CC]/45 bg-[radial-gradient(circle_at_top,_rgba(107,71,204,0.35),_rgba(16,20,23,0.9)_55%)] p-6 shadow-[0_30px_120px_rgba(10,12,16,0.45)] sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white/80">
                <Sparkles className="h-4 w-4 text-[#D0B3FF]" />
                Configuración completada
              </div>
              <div className="mt-6 space-y-3">
                <h1
                  className="text-4xl text-white sm:text-5xl"
                  style={{ fontFamily: 'var(--font-brand-display)' }}
                >
                  ¡Tu workspace está listo 🎉
                </h1>
                <p className="max-w-2xl text-base leading-7 text-white/70">
                  La IA ahora conoce tu marca, tu voz y tu estrategia. Estás listo para crear
                  contenido.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[26px] border border-white/10 bg-white/[0.02] p-5">
                <div className="flex items-center gap-2 text-[#9CF3C6]">
                  <BadgeCheck className="h-4 w-4" />
                  <span className="text-sm">Marca configurada</span>
                </div>
                <p className="mt-3 text-lg text-white">{state.brand_name || workspaceName}</p>
              </div>
              <div className="rounded-[26px] border border-white/10 bg-white/[0.02] p-5">
                <div className="flex items-center gap-2 text-[#9CF3C6]">
                  <BadgeCheck className="h-4 w-4" />
                  <span className="text-sm">Tono</span>
                </div>
                <p className="mt-3 text-lg text-white">{state.tone_of_voice || 'Profesional'}</p>
              </div>
              <div className="rounded-[26px] border border-white/10 bg-white/[0.02] p-5">
                <div className="flex items-center gap-2 text-[#9CF3C6]">
                  <BadgeCheck className="h-4 w-4" />
                  <span className="text-sm">Objetivo</span>
                </div>
                <p className="mt-3 text-lg text-white">
                  {mainGoalOptions.find((option) => option.value === state.main_goal)?.label ||
                    'Estrategia lista'}
                </p>
              </div>
              <div className="rounded-[26px] border border-white/10 bg-white/[0.02] p-5">
                <div className="flex items-center gap-2 text-[#9CF3C6]">
                  <BadgeCheck className="h-4 w-4" />
                  <span className="text-sm">Plataformas</span>
                </div>
                <p className="mt-3 text-lg text-white">{configuredPlatforms || 'Instagram · LinkedIn · X'}</p>
              </div>
            </div>

            {logoPreviewUrl ? (
              <div className="rounded-[28px] border border-white/10 bg-white/[0.02] p-6">
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/35">Logo</p>
                <div className="mt-4 flex h-36 items-center justify-center rounded-[24px] border border-white/10 bg-black/20 p-6">
                  <img
                    src={logoPreviewUrl}
                    alt="Logo del workspace"
                    className="max-h-20 w-auto object-contain"
                  />
                </div>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => router.push('/compose')}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#6B47CC] px-6 py-3.5 text-sm font-medium text-white transition hover:bg-[#7C55E0]"
            >
              Crear mi primer post
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )
    }
  }

  if (!isReady || isBootstrapping) {
    return (
      <main className="min-h-screen bg-[#101417] px-4 py-8 text-white sm:px-6">
        <div className="mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center rounded-[36px] border border-white/10 bg-white/[0.04] shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex items-center gap-3 text-white/65">
            <Loader2 className="h-5 w-5 animate-spin" />
            Preparando tu onboarding...
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#101417] px-4 py-8 text-white sm:px-8 sm:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.05),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(107,71,204,0.18),_transparent_36%)]" />

      <div className="relative mx-auto max-w-3xl">
        {/* Progress header */}
        <ProgressBar currentStep={currentStep} />

        {/* Step card */}
        <div className="mt-8 rounded-[32px] border border-white/[0.08] bg-[#0D1116]/60 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-10">
          {/* Animated step content */}
          <div
            key={currentStep}
            className="animate-in fade-in slide-in-from-bottom-3 duration-300"
          >
            {renderStep()}
          </div>

          {saveError ? (
            <div className="mt-6 rounded-[20px] border border-[#E25B5B]/40 bg-[#E25B5B]/[0.08] px-4 py-3 text-sm text-[#FFB8B8]">
              {saveError}
            </div>
          ) : null}

          {currentStep <= onboardingStepLabels.length ? (
            <div className="mt-8 flex items-center justify-between border-t border-white/[0.07] pt-6">
              <div>
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-sm text-white/55 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Atrás
                  </button>
                ) : (
                  <p className="text-[11px] text-white/25">Los datos se guardan al continuar.</p>
                )}
              </div>

              <button
                type="button"
                onClick={handleNext}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-full bg-[#6B47CC] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#7C55E0] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {currentStep === 6 ? 'Finalizar setup' : 'Continuar'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  )
}
