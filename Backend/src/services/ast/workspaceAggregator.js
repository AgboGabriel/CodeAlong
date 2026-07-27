import TopicMisconceptionRules from "./topicMisconceptionRules.js";

function extractTabConcepts(tabResult) {
  const summary = tabResult.normalizedAst?.summary || {};
  const analysis = tabResult.normalizedAst?.analysis || {};
  const patterns = analysis.detectedPatterns || {};

  return {
    tabId: tabResult.tabId,
    tabName: tabResult.tabName,
    functions: (summary.functions || 0) > 0,
    loops: (summary.loops || 0) > 0,
    conditionals: (summary.conditionals || 0) > 0,
    // Classes are "declaration" kind in normalizeTreeSitterAst
    classes: (summary.declarations || 0) > 0,
    // Recursion: function + conditional + the function calls itself (heuristic)
    recursion: detectRecursionHeuristic(tabResult.normalizedAst?.ast),
    arrays: detectArrayUsage(tabResult.normalizedAst?.ast),
    accumulatorPattern: (patterns.accumulators || []).length > 0,
    counterPattern: (patterns.counters || []).length > 0,
    flagVariables: (patterns.flagVariables || []).length > 0,
    functionNames: extractFunctionNames(tabResult.normalizedAst?.ast),
    identifierUses: extractIdentifierUses(tabResult.normalizedAst?.ast),
    diagnostics: tabResult.diagnostics || [],
  };
}

function detectRecursionHeuristic(ast) {
  if (!ast) return false;
  // A function node that contains a call to itself
  // Simplified: look for callable node containing a call_expression
  // with the same name as the function
  let found = false;
  walkAst(ast, (node) => {
    if (node.kind === "callable") {
      const funcName = extractFirstIdentifier(node);
      if (funcName) {
        walkAst(node, (child) => {
          if (child.type === "call_expression" &&
              (child.text || "").startsWith(funcName)) {
            found = true;
          }
        });
      }
    }
  });
  return found;
}

function detectArrayUsage(ast) {
  if (!ast) return false;
  let found = false;
  walkAst(ast, (node) => {
    if (node.type === "subscript_expression" ||
        node.type === "index_expression" ||
        node.type === "element_access_expression" ||
        node.type === "array_expression" ||
        node.type === "list" ||
        (node.text || "").includes("[")) {
      found = true;
    }
  });
  return found;
}

function extractFunctionNames(ast) {
  const names = [];
  if (!ast) return names;
  walkAst(ast, (node) => {
    if (node.kind === "callable") {
      const name = extractFirstIdentifier(node);
      if (name) names.push(name);
    }
  });
  return names;
}

function extractIdentifierUses(ast) {
  const names = [];
  if (!ast) return names;
  walkAst(ast, (node) => {
    if (node.type === "identifier" && node.text) {
      names.push(node.text);
    }
  });
  return names;
}

function extractFirstIdentifier(node) {
  for (const child of node.children || []) {
    if (child.type === "identifier") return child.text || "";
  }
  return "";
}

function walkAst(node, visit) {
  if (!node) return;
  visit(node);
  for (const child of node.children || []) {
    walkAst(child, visit);
  }
}

/**
 * Merges per-tab concepts into a single workspace-level inventory.
 */
function mergeConceptInventory(tabConcepts) {
  const inventory = {
    functions: false,
    loops: false,
    conditionals: false,
    classes: false,
    recursion: false,
    arrays: false,
    accumulatorPattern: false,
    counterPattern: false,
    flagVariables: false,
    functionCallsAcrossTabs: [],
    sharedVariableNames: [],
    sources: {},
  };

  const conceptKeys = [
    "functions", "loops", "conditionals", "classes",
    "recursion", "arrays", "accumulatorPattern", "counterPattern", "flagVariables",
  ];

  for (const tc of tabConcepts) {
    for (const key of conceptKeys) {
      if (tc[key]) {
        inventory[key] = true;
        if (!inventory.sources[key]) inventory.sources[key] = [];
        inventory.sources[key].push(tc.tabId);
      }
    }
  }

  // Cross-tab: find function names defined in one tab and used in another
  const allFunctionNames = new Set();
  for (const tc of tabConcepts) {
    for (const name of tc.functionNames || []) {
      allFunctionNames.add(name);
    }
  }

  for (const definedTab of tabConcepts) {
    for (const fnName of definedTab.functionNames || []) {
      for (const usingTab of tabConcepts) {
        if (usingTab.tabId === definedTab.tabId) continue;
        if ((usingTab.identifierUses || []).includes(fnName)) {
          inventory.functionCallsAcrossTabs.push({
            functionName: fnName,
            definedInTab: definedTab.tabId,
            usedInTab: usingTab.tabId,
          });
        }
      }
    }
  }

  return inventory;
}

/**
 * Infers what the learner was trying to do from the tab structure.
 */
function resolveWorkspaceIntent(tabConcepts, tabResults) {
  const nonEmpty = tabResults.filter(
    (t) => (t.normalizedAst?.summary?.nonEmptyLines || 0) > 1
  );

  if (nonEmpty.length === 0) return "exploratory_scratch";
  if (nonEmpty.length === 1) return "single_tab_focus";

  // Check if each tab demonstrates a distinct concept
  const conceptSets = tabConcepts
    .filter((tc) => nonEmpty.find((t) => t.tabId === tc.tabId))
    .map((tc) => ({
      tabId: tc.tabId,
      concepts: ["functions", "loops", "conditionals", "classes", "arrays"]
        .filter((k) => tc[k]),
    }));

  const overlapCount = conceptSets.reduce((acc, a) => {
    return acc + conceptSets.filter((b) =>
      b.tabId !== a.tabId &&
      a.concepts.some((c) => b.concepts.includes(c))
    ).length;
  }, 0);

  // Heavy overlap → experimenting with same concept
  if (overlapCount > conceptSets.length) return "experimenting_with_approaches";

  // Functions defined in one tab, used in another → separation of concerns
  const hasFunctionDefs = tabConcepts.some((tc) => tc.functionNames.length > 0);
  const hasCrossTabCalls = tabConcepts.some((tc, _, arr) =>
    tc.functionNames.some((fn) =>
      arr.some((other) =>
        other.tabId !== tc.tabId &&
        (other.identifierUses || []).includes(fn)
      )
    )
  );

  if (hasFunctionDefs && hasCrossTabCalls) return "separating_concerns";

  return "building_solution_incrementally";
}

/**
 * Builds per-concept confidence scores from the inventory and tab evidence.
 */
function scoreConceptDemonstration(inventory, tabConcepts, tabResults) {
  const allConcepts = [
    "functions", "loops", "conditionals", "classes",
    "recursion", "arrays", "accumulatorPattern", "counterPattern",
  ];

  return allConcepts.map((concept) => {
    const sources = inventory.sources[concept] || [];
    const demonstrated = sources.length > 0;

    // Confidence increases with: number of tabs showing it, non-empty lines
    let confidence = 0;
    const evidence = [];

    for (const tabId of sources) {
      const tc = tabConcepts.find((t) => t.tabId === tabId);
      const tr = tabResults.find((t) => t.tabId === tabId);
      const lines = tr?.normalizedAst?.summary?.nonEmptyLines || 0;

      // Base weight: demonstrated = 0.5, extra for non-trivial code
      const weight = Math.min(0.5, 0.3 + (lines / 100) * 0.2);
      confidence = Math.min(1.0, confidence + weight);

      evidence.push({
        tabId,
        tabName: tc?.tabName || tabId,
        description: `${concept} detected (${lines} non-empty lines)`,
        weight,
      });
    }

    return { concept, demonstrated, confidence, evidence };
  });
}

/**
 * Aggregates all diagnostics from all tabs and runs topic misconception rules.
 */
function aggregateMisconceptions(tabResults, topicTitle, languageKey) {
  const allDiagnostics = tabResults.flatMap((t) => t.diagnostics || []);
  // Deduplicate by code — same misconception in two tabs is one misconception
  const uniqueDiagnostics = [];
  const seenCodes = new Set();
  for (const d of allDiagnostics) {
    if (!seenCodes.has(d.code)) {
      seenCodes.add(d.code);
      uniqueDiagnostics.push(d);
    }
  }

  const ruleEngine = new TopicMisconceptionRules(topicTitle || "", languageKey || "");
  return ruleEngine.evaluateMisconceptions(uniqueDiagnostics, topicTitle || "");
}

/**
 * Builds the human-readable, concept-focused feedback object.
 */
function buildWorkspaceFeedback(inventory, conceptScores, intent, topicMisconceptions, tabResults, expectations = {}) {
  const strengths = [];
  const gaps = [];
  const suggestions = [];

  // Only treat functions/loops/conditionals as "expected" structures if the
  // challenge's structuralExpectations actually calls for them. Without
  // this gate, every trivial exercise (e.g. "print Hello World") gets told
  // it's "missing" a function, loop, and conditional — none of which were
  // ever required. requireX / minimumXCount > 0 are the same fields the
  // AST rule engine already uses in buildAstRuleFeedback.js.
  const expectedCoreConcepts = new Set();
  if (expectations.requireFunction || (expectations.minimumFunctions || 0) > 0) {
    expectedCoreConcepts.add("functions");
  }
  if (expectations.requireLoop || (expectations.minimumLoops || 0) > 0) {
    expectedCoreConcepts.add("loops");
  }
  if (expectations.requireConditional || (expectations.minimumConditionals || 0) > 0) {
    expectedCoreConcepts.add("conditionals");
  }

  // Strengths: demonstrated with reasonable confidence
  for (const score of conceptScores) {
    if (score.demonstrated && score.confidence >= 0.4) {
      const sourceTabNames = score.evidence
        .slice(0, 2)
        .map((e) => e.tabName)
        .join(" and ");

      strengths.push({
        concept: score.concept,
        message: `Your ${score.concept} usage looks solid${sourceTabNames ? ` (${sourceTabNames})` : ""}.`,
        tabReference: score.evidence[0]?.tabName,
      });
    }
  }

  // Gaps: not demonstrated at all
  for (const score of conceptScores) {
    if (!score.demonstrated) {
      // Only surface as a gap if it's a core concept the challenge actually
      // requires — never nag about a missing loop/function/conditional on
      // an exercise that doesn't call for one.
      if (expectedCoreConcepts.has(score.concept)) {
        gaps.push({
          concept: score.concept,
          message: `No ${score.concept} were detected anywhere in your workspace.`,
        });
      }
    }
  }

  // Suggestions from misconceptions
  for (const misconception of topicMisconceptions) {
    suggestions.push({
      concept: misconception.pattern,
      message: misconception.feedback,
    });
  }

  // Cross-tab relationship note
  let crossTabNote;
  if (inventory.functionCallsAcrossTabs.length > 0) {
    const example = inventory.functionCallsAcrossTabs[0];
    crossTabNote = `You defined "${example.functionName}" in one tab and used it in another — that's good modular thinking.`;
  } else if (intent === "building_solution_incrementally" && tabResults.length > 1) {
    crossTabNote = "You're spreading your solution across tabs. That works — just make sure each piece fits together when combined.";
  }

  // Summary — use the same confidence gate as strengths (>= 0.4) so the
  // summary line never claims a concept is meaningfully "shown" when it
  // only appeared once in a trivial, incidental way (e.g. `lines[0]` in a
  // 4-line Hello World script technically uses array indexing, but that's
  // not a notable pattern worth calling out).
  const demonstratedNames = conceptScores
    .filter((s) => s.demonstrated && s.confidence >= 0.4)
    .map((s) => s.concept);

  const summary = demonstratedNames.length > 0
    ? `Across your ${tabResults.length} tab(s), your workspace shows: ${demonstratedNames.join(", ")}.`
    : "Your workspace doesn't show any notable structural patterns yet — that's expected for short or simple solutions.";

  return { summary, strengths, gaps, suggestions, crossTabNote, misconceptions: topicMisconceptions };
}

/**
 * Builds the mastery signals ready for BKT consumption.
 */
function buildMasterySignals(conceptScores, tabResults, topicId, topicMisconceptions) {
  const demonstrated = conceptScores
    .filter((s) => s.demonstrated && s.confidence >= 0.4)
    .map((s) => s.concept);

  const missed = conceptScores
    .filter((s) => !s.demonstrated && ["functions", "loops", "conditionals"].includes(s.concept))
    .map((s) => s.concept);

  const misconceptionCodes = tabResults
    .flatMap((t) => t.diagnostics || [])
    .map((d) => d.code)
    .filter((code, idx, arr) => arr.indexOf(code) === idx);

  const nonEmptyTabCount = tabResults.filter(
    (t) => (t.normalizedAst?.summary?.nonEmptyLines || 0) > 1
  ).length;

  // Overall confidence: average of demonstrated concept scores
  const demonstratedScores = conceptScores.filter((s) => s.demonstrated);
  const overallConfidence = demonstratedScores.length > 0
    ? demonstratedScores.reduce((sum, s) => sum + s.confidence, 0) / demonstratedScores.length
    : 0;

  return {
    topicId: topicId || null,
    demonstratedConcepts: demonstrated,
    missedConcepts: missed,
    misconceptionCodes,
    overallConfidence,
    tabCount: tabResults.length,
    nonEmptyTabCount,
  };
}

/**
 * Main aggregation entry point.
 * Call this after all tabs have been individually parsed by astService.parseSource().
 */
export function aggregateWorkspace({
  tabResults,
  topicId = null,
  topicTitle = "",
  languageKey = "",
  expectations = {},
}) {
  // Accept any tab marked "parsed" — ast may be null if tree-sitter package is missing
  // but diagnostics are still present. Downstream functions guard against null ast.
  const parsedResults = tabResults.filter((t) => t.status === "parsed");

  if (parsedResults.length === 0) {
    return {
      conceptInventory: {},
      workspaceIntent: "exploratory_scratch",
      conceptScores: [],
      feedback: {
        summary: "No parseable code found in your workspace yet.",
        strengths: [],
        gaps: [],
        suggestions: [],
        misconceptions: [],
      },
      masterySignals: {
        topicId,
        demonstratedConcepts: [],
        missedConcepts: [],
        misconceptionCodes: [],
        overallConfidence: 0,
        tabCount: tabResults.length,
        nonEmptyTabCount: 0,
      },
      topicMisconceptions: [],
    };
  }

  const tabConcepts = parsedResults.map(extractTabConcepts);
  const conceptInventory = mergeConceptInventory(tabConcepts);
  const workspaceIntent = resolveWorkspaceIntent(tabConcepts, parsedResults);
  const conceptScores = scoreConceptDemonstration(conceptInventory, tabConcepts, parsedResults);
  const topicMisconceptions = aggregateMisconceptions(parsedResults, topicTitle, languageKey);
  const feedback = buildWorkspaceFeedback(
    conceptInventory, conceptScores, workspaceIntent, topicMisconceptions, parsedResults, expectations
  );
  const masterySignals = buildMasterySignals(
    conceptScores, parsedResults, topicId, topicMisconceptions
  );

  return {
    conceptInventory,
    workspaceIntent,
    conceptScores,
    feedback,
    masterySignals,
    topicMisconceptions,
  };
}

export default aggregateWorkspace;