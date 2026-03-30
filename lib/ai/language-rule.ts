const languageRule = `LANGUAGE RULE: Detect the language of the user's input and respond entirely in that language. If the idea or prompt is in Spanish, respond in Spanish. If in English, respond in English. If mixed, use the predominant language. Never switch languages mid-response. The UI language setting is irrelevant — only the user's input language matters.`;

export function withUserInputLanguageRule(systemPrompt: string) {
  return `${systemPrompt}\n\n${languageRule}`;
}
