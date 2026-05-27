import { getAstLanguages } from "./astLanguageRegistry.js";

const LANGUAGE_ALIASES = {
  javascript: ["javascript", "java script", "js", "node", "node.js", "nodejs"],
  python: ["python", "py"],
  java: ["java"],
  cpp: ["c++", "cpp", "cplusplus"],
  c: ["c", "c language"],
  csharp: ["c#", "csharp", "c sharp", ".net", "dotnet"],
  go: ["go", "golang"],
  ruby: ["ruby"],
  rust: ["rust"],
};

const GENERIC_TOPIC_WORDS = new Set([
  "variables",
  "variable",
  "loops",
  "loop",
  "functions",
  "function",
  "arrays",
  "array",
  "classes",
  "class",
  "objects",
  "object",
  "conditionals",
  "conditions",
  "syntax",
  "basics",
  "fundamentals",
  "introduction",
  "intro",
  "setup",
  "install",
  "installation",
  "compiler",
  "ide",
]);

function normalizeText(value = "") {
  return String(value || "").toLowerCase();
}

function stripVersionName(name) {
  return normalizeText(name).replace(/\(.*?\)/g, "").trim();
}

export function getLanguageAliases(languageKeyOrName) {
  const normalized = normalizeText(languageKeyOrName);
  const matchedLanguage = getAstLanguages().find((language) => {
    const aliases = LANGUAGE_ALIASES[language.key] || [];
    return (
      language.key === normalized ||
      language.monacoLanguage === normalized ||
      stripVersionName(language.name) === normalized ||
      aliases.includes(normalized)
    );
  });

  if (!matchedLanguage) {
    return [];
  }

  return LANGUAGE_ALIASES[matchedLanguage.key] || [matchedLanguage.key];
}

export function inferLanguageFromText(...parts) {
  const text = normalizeText(parts.filter(Boolean).join(" "));
  const matches = [];

  for (const language of getAstLanguages()) {
    const aliases = LANGUAGE_ALIASES[language.key] || [];
    const score = aliases.reduce((total, alias) => {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(`(^|[^a-z0-9+#.])${escaped}([^a-z0-9+#.]|$)`, "i");
      return total + (pattern.test(text) ? 1 : 0);
    }, 0);

    if (score > 0) {
      matches.push({
        key: language.key,
        name: stripVersionName(language.name),
        aliases,
        score,
      });
    }
  }

  return matches.sort((a, b) => b.score - a.score)[0] || null;
}

export function isGenericTopicTitle(topicTitle = "") {
  const words = normalizeText(topicTitle)
    .split(/[^a-z0-9+#]+/)
    .filter(Boolean);

  return words.length > 0 && words.every((word) => GENERIC_TOPIC_WORDS.has(word));
}

export function textMentionsLanguage(text, languageKeyOrName) {
  const aliases = getLanguageAliases(languageKeyOrName);
  const normalizedText = normalizeText(text);

  return aliases.some((alias) => {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(^|[^a-z0-9+#.])${escaped}([^a-z0-9+#.]|$)`, "i");
    return pattern.test(normalizedText);
  });
}

export function textMentionsDifferentSupportedLanguage(text, expectedLanguageKey) {
  const normalizedText = normalizeText(text);

  for (const language of getAstLanguages()) {
    if (language.key === expectedLanguageKey) {
      continue;
    }

    const aliases = LANGUAGE_ALIASES[language.key] || [];
    const hasMatch = aliases.some((alias) => {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(`(^|[^a-z0-9+#.])${escaped}([^a-z0-9+#.]|$)`, "i");
      return pattern.test(normalizedText);
    });

    if (hasMatch) {
      return true;
    }
  }

  return false;
}
