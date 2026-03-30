/**
 * Strip markdown code-block wrappers from AI-generated JSON responses.
 *
 * Models sometimes wrap JSON output in ```json ... ``` or ``` ... ```.
 * This function strips those markers so JSON.parse can succeed.
 */
export function stripMarkdownJSON(text: string): string {
  return text
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim()
}
