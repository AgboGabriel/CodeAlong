import crypto from "crypto";
import astModel from "../models/astModel.js";
import { getAstLanguageByJudge0Id, getAstLanguages } from "./astLanguageRegistry.js";
import parseWithTreeSitter from "./ast/treeSitterAdapter.js";
import aggregateWorkspace from "./ast/workspaceAggregator.js";

function buildSummary(sourceCode, language) {
  const lines = sourceCode.split(/\r?\n/);
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
  return {
    language: language.key,
    totalLines: lines.length,
    nonEmptyLines: nonEmptyLines.length,
    characterCount: sourceCode.length,
    sourceHash: crypto.createHash("sha256").update(sourceCode).digest("hex"),
  };
}

class AstService {
  getSupportedLanguages() {
    return getAstLanguages();
  }

  getBlueprint() {
    return {
      purpose: "Use structural code analysis to inspect how a learner constructed a solution, not only the final runtime output.",
      projectFit: {
        controller: "Accept AST requests, validate input, and return normalized structural analysis responses.",
        service: "Resolve the language, call the parser adapter, normalize the tree, and produce diagnostics and misconception signals.",
        model: "Persist AST analyses for later review, learner progression, and topic-level feedback.",
      },
      normalizedNodeShape: {
        type: "string", kind: "string", text: "string | null",
        startPosition: { line: "number", column: "number" },
        endPosition: { line: "number", column: "number" },
        children: "AstNode[]", metadata: "object",
      },
      recommendedPipeline: [
        "Receive source code and Judge0 language ID.",
        "Resolve parser adapter from the AST language registry.",
        "Parse source code into a language-specific syntax tree with Tree-sitter.",
        "Normalize parser nodes into a shared AST shape.",
        "Run rule-based misconception checks such as missing branch, weak loop, or incomplete function structure.",
        "Store the normalized tree and findings for topic mastery analysis.",
      ],
    };
  }

  async parseSource({
    sourceCode,
    languageId,
    userId = null,
    topicId = null,
    persist = false,
    analysisOptions = {},
  }) {
    if (!sourceCode?.trim()) throw new Error("source_code is required");
    if (!languageId) throw new Error("language_id is required");

    const language = getAstLanguageByJudge0Id(languageId);
    if (!language) throw new Error(`Unsupported language_id: ${languageId}`);

    const summary = buildSummary(sourceCode, language);
    const normalizedAst = await parseWithTreeSitter({ sourceCode, language, summary, analysisOptions });
    const diagnostics = normalizedAst.diagnostics || [];
    const resultSummary = normalizedAst.summary || summary;

    let savedAnalysis = null;
    if (persist) {
      savedAnalysis = await astModel.createAnalysis({
        userId, topicId,
        languageId: language.judge0Id,
        languageKey: language.key,
        parserEngine: language.parserEngine,
        parserStatus: normalizedAst.parser.status,
        sourceHash: resultSummary.sourceHash,
        summary: resultSummary,
        normalizedAst,
        diagnostics,
      });
    }

    return {
      success: true,
      normalizedAst,
      ...(savedAnalysis && { savedAnalysis }),
    };
  }
 
  
  async parseWorkspace({
    tabs,
    topicId = null,
    topicTitle = "",
    persist = false,
    analysisOptions = {},
  }) {
    if (!Array.isArray(tabs) || tabs.length === 0) {
      throw new Error("tabs array is required and must not be empty");
    }
 
    const tabResults = await Promise.all(
      tabs.map(async (tab) => {
        if (!tab.sourceCode?.trim()) {
          return {
            tabId: tab.tabId,
            tabName: tab.name || `Tab ${tab.tabId}`,
            languageId: tab.languageId,
            status: "empty",
            normalizedAst: null,
            diagnostics: [],
            summary: {},
          };
        }

        try {
          const result = await this.parseSource({
            sourceCode: tab.sourceCode,
            languageId: tab.languageId,
            userId: null,
            topicId,
            persist: false,
            analysisOptions: { ...analysisOptions, topicTitle },
          });

          return {
            tabId: tab.tabId,
            tabName: tab.name || `Tab ${tab.tabId}`,
            languageId: tab.languageId,
            status: "parsed",
            normalizedAst: result.normalizedAst,
            diagnostics: result.normalizedAst?.diagnostics || [],
            summary: result.normalizedAst?.summary || {},
          };
        } catch (error) {
          return {
            tabId: tab.tabId,
            tabName: tab.name || `Tab ${tab.tabId}`,
            languageId: tab.languageId,
            status: "parser_failed",
            normalizedAst: null,
            diagnostics: [{ level: "error", code: "TAB_PARSE_ERROR", message: error.message }],
            summary: {},
          };
        }
      })
    );

    const languageCounts = {};
    for (const tab of tabs) {
      const lang = getAstLanguageByJudge0Id(tab.languageId);
      if (lang) languageCounts[lang.key] = (languageCounts[lang.key] || 0) + 1;
    }
    const dominantLanguageKey =
      Object.entries(languageCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";

    const workspace = aggregateWorkspace({
      tabResults,
      topicId,
      topicTitle,
      languageKey: dominantLanguageKey,
      // Pass the challenge's structural expectations through so the
      // workspace-level "gaps" feedback only flags missing functions/
      // loops/conditionals when the exercise actually calls for them —
      // e.g. a "Hello World" challenge shouldn't be told it's missing a
      // loop just because it doesn't have one.
      expectations: analysisOptions?.expectations || {},
    });

    return { success: true, tabs: tabResults, workspace };
  }
  

  async getAnalysisHistory(userId, topicId = null, limit = 10) {
    if (!userId) throw new Error("User ID is required to fetch AST history");
    return astModel.findByUserAndTopic(userId, topicId, limit);
  }
}

export default new AstService();