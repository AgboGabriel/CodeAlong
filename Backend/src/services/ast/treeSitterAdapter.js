import normalizeTreeSitterNode from "./normalizeTreeSitterAst.js";
import buildAstInsights from "./buildAstInsights.js";
import buildSemanticDiagnostics from "./buildSemanticDiagnostics.js";
import SemanticAnalysisEngine from "./semanticAnalysis.js";
import TopicMisconceptionRules from "./topicMisconceptionRules.js";

function isModuleNotFoundError(error) {
  return (
    error?.code === "ERR_MODULE_NOT_FOUND" ||
    /Cannot find package/i.test(error?.message || "")
  );
}

async function loadParserRuntime() {
  const module = await import("tree-sitter");
  return module.default || module;
}

async function loadGrammar(parserPackage) {
  const module = await import(parserPackage);
  return module.default || module;
}

function buildSuccessDiagnostics(language) {
  return [
    {
      level: "info",
      code: "AST_PARSE_SUCCESS",
      message: `${language.name} source code was parsed successfully with ${language.parserEngine}.`,
    },
  ];
}

function buildMissingPackageEnvelope(sourceCode, language, summary, error) {
  return {
    schemaVersion: "normalized-ast-v1",
    status: "parser_package_missing",
    language: {
      id: language.judge0Id,
      key: language.key,
      name: language.name,
      extension: language.extension,
      monacoLanguage: language.monacoLanguage,
    },
    parser: {
      engine: language.parserEngine,
      packageName: language.parserPackage,
      status: "missing_package",
    },
    summary,
    ast: null,
    diagnostics: [
      {
        level: "warning",
        code: "AST_PARSER_PACKAGE_MISSING",
        message: `Required parser package is not installed for ${language.name}. Install tree-sitter and ${language.parserPackage} to enable real AST parsing.`,
      },
      {
        level: "debug",
        code: "AST_PARSER_LOAD_ERROR",
        message: error.message,
      },
    ],
    reviewNotes: [
      "The AST service is ready to use a real parser.",
      "This response stayed in fallback mode because parser dependencies are not installed yet.",
    ],
    nextIntegrationSteps: [
      "Install the tree-sitter runtime and grammar packages.",
      "Retry the same AST endpoint after dependencies are available.",
    ],
  };
}

function buildParserFailureEnvelope(sourceCode, language, summary, error) {
  return {
    schemaVersion: "normalized-ast-v1",
    status: "parser_failed",
    language: {
      id: language.judge0Id,
      key: language.key,
      name: language.name,
      extension: language.extension,
      monacoLanguage: language.monacoLanguage,
    },
    parser: {
      engine: language.parserEngine,
      packageName: language.parserPackage,
      status: "failed",
    },
    summary,
    ast: null,
    diagnostics: [
      {
        level: "error",
        code: "AST_PARSE_FAILED",
        message: error.message || `Failed to parse ${language.name} source code.`,
      },
    ],
    reviewNotes: [
      "The parser runtime was reached, but parsing did not finish cleanly.",
    ],
    nextIntegrationSteps: [
      "Inspect the parser failure message.",
      "Confirm the submitted source matches the expected language grammar.",
    ],
  };
}

export async function parseWithTreeSitter({
  sourceCode,
  language,
  summary,
  analysisOptions = {},
}) {
  try {
    const Parser = await loadParserRuntime();
    const LanguageGrammar = await loadGrammar(language.parserPackage);

    const parser = new Parser();
    parser.setLanguage(LanguageGrammar);

    const tree = parser.parse(sourceCode);
    const normalizedRoot = normalizeTreeSitterNode(tree.rootNode, sourceCode);
    const insights = buildAstInsights(normalizedRoot, analysisOptions);
    const semanticDiagnostics = buildSemanticDiagnostics(normalizedRoot, language.key);

    // Run comprehensive semantic analysis
    const semanticAnalyzer = new SemanticAnalysisEngine(normalizedRoot, language.key);
    const comprehensiveAnalysis = semanticAnalyzer.analyze();

    // Apply topic-specific misconception rules
    const topicMisconceptionAnalyzer = new TopicMisconceptionRules(
      analysisOptions?.topicTitle || "",
      language.key
    );
    const topicMisconceptions = topicMisconceptionAnalyzer.evaluateMisconceptions(
      [...insights.misconceptionSignals, ...semanticDiagnostics, ...comprehensiveAnalysis.diagnostics],
      analysisOptions?.topicTitle || ""
    );

    // When a DUPLICATE_DECLARATION exists for a variable name, suppress
    // lower-quality USED_BEFORE_ASSIGNMENT and POSSIBLE_UNDECLARED_IDENTIFIER
    // diagnostics for that same name. The duplicate IS the real problem —
    // the secondary diagnostics are noise caused by the duplicate confusing
    // the tracker, and showing all three to a learner obscures the actual fix.
    const allRawDiagnostics = [
      ...insights.misconceptionSignals,
      ...semanticDiagnostics,
      ...comprehensiveAnalysis.diagnostics,
    ];

    const duplicatedNames = new Set(
      semanticDiagnostics
        .filter((d) => d.code === "DUPLICATE_DECLARATION")
        .map((d) => {
          // Extract the variable name from the message: `"name" is declared...`
          const match = d.message?.match(/^"([^"]+)"/);
          return match ? match[1] : null;
        })
        .filter(Boolean)
    );

    const SUPPRESSED_BY_DUPLICATE = new Set([
      "USED_BEFORE_ASSIGNMENT",
      "POSSIBLE_UNDECLARED_IDENTIFIER",
    ]);

    const filteredDiagnostics = allRawDiagnostics.filter((d) => {
      if (!SUPPRESSED_BY_DUPLICATE.has(d.code)) return true;
      // Suppress if the name mentioned in this diagnostic belongs to a
      // duplicate — the duplicate warning covers it more precisely.
      const nameMatch = d.message?.match(/"([^"]+)"/);
      if (!nameMatch) return true;
      return !duplicatedNames.has(nameMatch[1]);
    });

    return {
      schemaVersion: "normalized-ast-v1",
      status: "parsed",
      language: {
        id: language.judge0Id,
        key: language.key,
        name: language.name,
        extension: language.extension,
        monacoLanguage: language.monacoLanguage,
      },
      parser: {
        engine: language.parserEngine,
        packageName: language.parserPackage,
        status: "ready",
      },
      summary: {
        ...summary,
        ...insights.metrics,
      },
      ast: normalizedRoot,
      analysis: {
        expectationProfile: insights.expectationProfile,
        expectationState: insights.expectationState,
        variables: comprehensiveAnalysis.analysis?.variables || {},
        controlFlow: comprehensiveAnalysis.analysis?.controlFlow || {},
        detectedPatterns: comprehensiveAnalysis.analysis?.patterns || {},
      },
      diagnostics: [
        ...buildSuccessDiagnostics(language),
        ...filteredDiagnostics,
      ],
      topicMisconceptions: topicMisconceptions.length > 0 ? topicMisconceptions : undefined,
      reviewNotes: [
        "This AST was produced from a real parser with comprehensive semantic analysis.",
        "Includes variable tracking, control-flow analysis, and topic-specific misconception detection.",
      ],
      nextIntegrationSteps: [
        "Review identified misconceptions with the learner.",
        "Use topic-specific feedback to guide learning.",
        "Track patterns to identify consistent learning gaps.",
      ],
    };
  } catch (error) {
    if (isModuleNotFoundError(error)) {
      return buildMissingPackageEnvelope(sourceCode, language, summary, error);
    }

    return buildParserFailureEnvelope(sourceCode, language, summary, error);
  }
}

export default parseWithTreeSitter;