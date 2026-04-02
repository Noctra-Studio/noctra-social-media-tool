import type { InstagramCarouselSlide } from "@/lib/social-content";

const BULLET_REGEX = /^(?:[-*•]\s+|\d+[.)]\s+)/;
const CTA_REGEX =
  /\b(guarda|guardalo|guárdalo|comenta|comentá|cuéntame|cuentame|escríbeme|escribeme|sígueme|sigueme|compártelo|compartelo|responde|te leo|agenda|descarga|dm|mensaje|link en bio|hablemos)\b/i;

export type InstagramSaturationEvaluation = {
  isSaturated: boolean;
  suggestedSlides: number;
  reason: string;
};

type SlidePointBuckets = string[][];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeLine(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function countWords(value: string) {
  return normalizeLine(value)
    .split(/\s+/)
    .filter(Boolean).length;
}

function stripBulletPrefix(value: string) {
  return normalizeLine(value.replace(BULLET_REGEX, ""));
}

function isBulletLine(value: string) {
  return BULLET_REGEX.test(value.trim());
}

function isLikelyCta(value: string) {
  return CTA_REGEX.test(value);
}

function trimToWordLimit(value: string, maxWords: number) {
  const words = normalizeLine(value).split(/\s+/).filter(Boolean);

  if (words.length <= maxWords) {
    return words.join(" ");
  }

  return `${words.slice(0, maxWords).join(" ")}…`;
}

function splitSentences(value: string) {
  return value
    .split(/(?<=[.!?])\s+/)
    .map(normalizeLine)
    .filter(Boolean);
}

function splitLongIdea(value: string) {
  const normalized = normalizeLine(value);

  if (!normalized) {
    return [];
  }

  if (countWords(normalized) <= 25) {
    return [normalized];
  }

  const sentences = splitSentences(normalized);

  if (sentences.length >= 2) {
    return sentences.map((sentence) => trimToWordLimit(sentence, 25));
  }

  const words = normalized.split(/\s+/).filter(Boolean);
  const pivot = Math.ceil(words.length / 2);

  return [
    trimToWordLimit(words.slice(0, pivot).join(" "), 25),
    trimToWordLimit(words.slice(pivot).join(" "), 25),
  ].filter(Boolean);
}

function classifySections(lines: string[]) {
  let previousKind: "paragraph" | "list" | "cta" | null = null;
  let sections = 0;

  lines.forEach((line, index) => {
    const isLastLine = index === lines.length - 1;
    const kind = isBulletLine(line)
      ? "list"
      : isLastLine && isLikelyCta(line)
        ? "cta"
        : "paragraph";

    if (kind !== previousKind) {
      sections += 1;
      previousKind = kind;
    }
  });

  return sections;
}

function collectIdeaBlocks(content: string) {
  const rawLines = content
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter(Boolean);

  const bulletIdeas = rawLines
    .filter((line) => isBulletLine(line))
    .map(stripBulletPrefix);

  const paragraphIdeas = rawLines
    .filter((line) => !isBulletLine(line))
    .flatMap((line) => splitSentences(line).length > 0 ? splitSentences(line) : [line]);

  return {
    bulletIdeas,
    lines: rawLines,
    paragraphIdeas,
    sectionCount: classifySections(rawLines),
    wordCount: countWords(content),
  };
}

function bucketIdeas(ideas: string[], bucketCount: number): SlidePointBuckets {
  if (bucketCount <= 0) {
    return [];
  }

  const expanded = ideas.flatMap((idea) => splitLongIdea(idea)).filter(Boolean);

  if (expanded.length === 0) {
    return Array.from({ length: bucketCount }, () => ["Idea clave"]);
  }

  const buckets: SlidePointBuckets = [];
  let cursor = 0;

  for (let index = 0; index < bucketCount; index += 1) {
    const remainingBuckets = bucketCount - index;
    const remainingIdeas = expanded.length - cursor;
    const targetSize =
      remainingIdeas > remainingBuckets ? 2 : 1;

    const bucket = expanded.slice(cursor, cursor + targetSize);
    buckets.push(bucket.length > 0 ? bucket : [expanded[expanded.length - 1]]);
    cursor += bucket.length;
  }

  if (cursor < expanded.length) {
    expanded.slice(cursor).forEach((idea) => {
      const smallestBucket = buckets.reduce(
        (candidate, bucket, index) =>
          bucket.length < buckets[candidate].length ? index : candidate,
        0,
      );

      if (buckets[smallestBucket].length < 2) {
        buckets[smallestBucket].push(idea);
      }
    });
  }

  return buckets.map((bucket) => bucket.slice(0, 2));
}

function buildSlide(
  baseSlide: InstagramCarouselSlide,
  overrides: Partial<InstagramCarouselSlide>,
): InstagramCarouselSlide {
  return {
    ...baseSlide,
    ...overrides,
  };
}

function getFallbackCta(caption: string) {
  const captionLines = caption
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter(Boolean);
  const detected = captionLines.find((line) => isLikelyCta(line));

  return detected ?? "Guárdalo y compártelo con tu equipo.";
}

export function evaluateInstagramSaturation(
  content: string,
): InstagramSaturationEvaluation {
  const { bulletIdeas, lines, paragraphIdeas, sectionCount, wordCount } =
    collectIdeaBlocks(content);
  const hasCta = lines.length > 1 && isLikelyCta(lines[lines.length - 1] ?? "");
  const hookOffset = paragraphIdeas.length > 0 ? 1 : 0;
  const ctaOffset = hasCta ? 1 : 0;
  const informationBlocks = Math.max(
    bulletIdeas.length > 0 ? bulletIdeas.length + paragraphIdeas.length : paragraphIdeas.length,
    1,
  );
  const ideaUnits = Math.max(
    bulletIdeas.length,
    informationBlocks - hookOffset - ctaOffset,
    1,
  );

  const reasons: string[] = [];

  if (bulletIdeas.length > 3) {
    reasons.push(`${bulletIdeas.length} puntos visuales`);
  }

  if (wordCount > 60) {
    reasons.push(`${wordCount} palabras en el arte`);
  }

  if (sectionCount > 2) {
    reasons.push(`${sectionCount} secciones distintas`);
  }

  const isSaturated = reasons.length > 0;

  return {
    isSaturated,
    suggestedSlides: isSaturated ? clamp(ideaUnits + 2, 3, 7) : 1,
    reason: isSaturated
      ? `Se ve saturado para un solo slide: ${reasons.join(", ")}.`
      : "El contenido cabe bien en un solo slide.",
  };
}

export function convertInstagramSingleToCarouselPreview(params: {
  baseSlide: InstagramCarouselSlide;
  body: string;
  caption: string;
  headline: string;
  slideCount: number;
}) {
  const { baseSlide, body, caption, headline, slideCount } = params;
  const { bulletIdeas, paragraphIdeas, lines } = collectIdeaBlocks(body);
  const requestedSlides = clamp(slideCount, 3, 7);
  const hasCta =
    lines.length > 1 && isLikelyCta(lines[lines.length - 1] ?? "");
  const rawCta =
    hasCta && lines.length > 0 ? lines[lines.length - 1] : getFallbackCta(caption);
  const hookText =
    normalizeLine(headline) ||
    paragraphIdeas[0] ||
    bulletIdeas[0] ||
    normalizeLine(body) ||
    "Idea principal";

  const contentIdeasSource =
    bulletIdeas.length > 0
      ? [...bulletIdeas, ...paragraphIdeas]
      : paragraphIdeas.length > 0
        ? paragraphIdeas
        : splitLongIdea(body);

  const contentIdeas =
    normalizeLine(headline).length === 0 && contentIdeasSource.length > 1
      ? contentIdeasSource.slice(1)
      : contentIdeasSource;
  const middleSlideCount = Math.max(requestedSlides - 2, 1);
  const ideaBuckets = bucketIdeas(
    contentIdeas.filter((idea) => idea !== rawCta),
    middleSlideCount,
  );

  const coverBody =
    normalizeLine(headline).length > 0
      ? trimToWordLimit(paragraphIdeas[0] ?? body, 20)
      : trimToWordLimit(
          contentIdeasSource.find((idea) => idea !== hookText) ?? body,
          20,
        );

  const slides: InstagramCarouselSlide[] = [
    buildSlide(baseSlide, {
      body: coverBody || trimToWordLimit(body, 20),
      headline: trimToWordLimit(hookText, 8),
      slide_number: 1,
      type: "cover",
    }),
    ...ideaBuckets.map((bucket, index) =>
      buildSlide(baseSlide, {
        body: bucket
          .map((idea) => `• ${trimToWordLimit(idea, 25)}`)
          .join("\n"),
        headline: trimToWordLimit(bucket[0] ?? "Idea clave", 8),
        slide_number: index + 2,
        type: "content",
      }),
    ),
    buildSlide(baseSlide, {
      body: trimToWordLimit(rawCta, 25),
      headline: "Siguiente paso",
      slide_number: requestedSlides,
      type: "cta",
    }),
  ];

  return slides.slice(0, requestedSlides).map((slide, index) =>
    buildSlide(slide, {
      slide_number: index + 1,
      type:
        index === 0
          ? "cover"
          : index === requestedSlides - 1
            ? "cta"
            : "content",
    }),
  );
}
