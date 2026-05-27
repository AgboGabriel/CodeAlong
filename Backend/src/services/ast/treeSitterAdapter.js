import normalizeTreeSitterNode from "./normalizeTreeSitterAst.js";
import buildAstInsights from "./buildAstInsights.js";
import buildSemanticDiagnostics from "./buildSemanticDiagnostics.js";

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
      },
      diagnostics: [
        ...buildSuccessDiagnostics(language),
        ...insights.misconceptionSignals,
        ...semanticDiagnostics,
      ],
      reviewNotes: [
        "This AST was produced from a real parser and normalized into a shared backend shape.",
      ],
      nextIntegrationSteps: [
        "Add topic-specific structural rules on top of this normalized tree.",
        "Merge AST findings with Judge0 runtime feedback once the review is complete.",
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
