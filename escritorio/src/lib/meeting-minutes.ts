import { parseDbArray } from "./db-json";

type MeetingParticipant = {
  id: string;
  name: string;
  type: string;
  agentId?: string;
};

type MeetingMinutesRecord = {
  topic?: string;
  participants?: unknown;
  keyTopics?: unknown;
  conclusions?: string | null;
  transcript?: string | null;
};

const UNSUPPORTED_LANGUAGE_REGEX = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]/;

function containsUnsupportedLanguage(value: string | null | undefined): boolean {
  return Boolean(value && UNSUPPORTED_LANGUAGE_REGEX.test(value));
}

function shortenText(text: string, maxLength: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}...`;
}

function extractTranscriptParagraphs(transcript: string | null | undefined): string[] {
  if (!transcript) return [];

  return transcript
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !line.startsWith("#"))
    .filter((line) => !line.startsWith("---"))
    .filter((line) => !line.startsWith("- **"))
    .filter((line) => !/^### \[\d+\]/.test(line))
    .filter((line) => !UNSUPPORTED_LANGUAGE_REGEX.test(line))
    .filter((line) => /[A-Za-zÀ-ÿ]/.test(line));
}

function buildFallbackKeyTopics(topic: string | undefined, transcript: string | null | undefined): string[] {
  const paragraphs = extractTranscriptParagraphs(transcript);
  const fromTranscript = paragraphs
    .slice(0, 3)
    .map((line) => shortenText(line, 120))
    .filter(Boolean);

  if (fromTranscript.length > 0) return fromTranscript;
  if (topic?.trim()) return [`Discussão principal: ${topic.trim()}`];
  return [];
}

function buildFallbackConclusions(topic: string | undefined, transcript: string | null | undefined): string | null {
  const paragraphs = extractTranscriptParagraphs(transcript);
  if (paragraphs.length > 0) {
    return shortenText(paragraphs.slice(0, 2).join(" "), 320);
  }

  if (topic?.trim()) {
    return `O resumo original precisou ser normalizado para português. Tema registrado: ${topic.trim()}.`;
  }

  return null;
}

export function normalizeMeetingMinutesRecord<T extends MeetingMinutesRecord>(record: T) {
  const parsedKeyTopics = parseDbArray<string>(record.keyTopics).filter((topic): topic is string => typeof topic === "string");
  const shouldNormalizeLanguage = parsedKeyTopics.some((topic) => containsUnsupportedLanguage(topic))
    || containsUnsupportedLanguage(record.conclusions);

  return {
    ...record,
    participants: parseDbArray<MeetingParticipant>(record.participants),
    keyTopics: shouldNormalizeLanguage
      ? buildFallbackKeyTopics(record.topic, record.transcript)
      : parsedKeyTopics,
    conclusions: shouldNormalizeLanguage
      ? buildFallbackConclusions(record.topic, record.transcript)
      : record.conclusions ?? null,
  };
}
