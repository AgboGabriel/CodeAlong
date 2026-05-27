import buildAstRuleFeedback from "./buildAstRuleFeedback.js";

function walkAst(node, visit) {
  if (!node) {
    return;
  }

  visit(node);

  for (const child of node.children || []) {
    walkAst(child, visit);
  }
}

export function buildAstInsights(astRoot, analysisOptions = {}) {
  const metrics = {
    totalNodes: 0,
    functions: 0,
    conditionals: 0,
    loops: 0,
    declarations: 0,
    expressions: 0,
    maxDepth: 0,
  };

  function visit(node, depth = 1) {
    metrics.totalNodes += 1;
    metrics.maxDepth = Math.max(metrics.maxDepth, depth);

    if (node.kind === "callable") {
      metrics.functions += 1;
    }
    if (node.kind === "conditional") {
      metrics.conditionals += 1;
    }
    if (node.kind === "loop") {
      metrics.loops += 1;
    }
    if (node.kind === "declaration") {
      metrics.declarations += 1;
    }
    if (node.kind === "expression") {
      metrics.expressions += 1;
    }

    for (const child of node.children || []) {
      visit(child, depth + 1);
    }
  }

  visit(astRoot);
  const ruleFeedback = buildAstRuleFeedback(astRoot, metrics, analysisOptions);

  return {
    metrics,
    misconceptionSignals: ruleFeedback.misconceptionSignals,
    expectationProfile: ruleFeedback.expectationProfile,
    expectationState: ruleFeedback.expectationState,
  };
}

export default buildAstInsights;
