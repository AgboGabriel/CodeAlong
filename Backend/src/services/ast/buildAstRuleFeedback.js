function walkAst(node, visit, ancestry = []) {
  if (!node) {
    return;
  }

  visit(node, ancestry);

  for (const child of node.children || []) {
    walkAst(child, visit, [...ancestry, node]);
  }
}

function createDefaultExpectations() {
  return {
    requireFunction: false,
    requireConditional: false,
    requireLoop: false,
    requireBranching: false,
    minimumFunctions: 0,
    minimumConditionals: 0,
    minimumLoops: 0,
    minimumExpressions: 0,
    minimumDepth: 0,
    forbiddenNodeTypes: [],
  };
}

function mergeExpectations(analysisOptions = {}) {
  return {
    ...createDefaultExpectations(),
    ...(analysisOptions?.expectations || {}),
  };
}

function hasAncestorKind(ancestry, kind) {
  return ancestry.some((node) => node.kind === kind);
}

function hasAncestorType(ancestry, predicate) {
  return ancestry.some((node) => predicate(node.type));
}

function isLoopControlNode(nodeType) {
  return /(^|_)(break|continue)(_|$)/.test(nodeType);
}

function isReturnNode(nodeType) {
  return /(^|_)return(_|$)/.test(nodeType);
}

function isElseNode(nodeType) {
  return /(^|_)(else|elif|when)(_|$)/.test(nodeType);
}

function isConditionalNode(nodeType) {
  return /(^|_)(if|switch|case|else|elif|when|unless)(_|$)/.test(nodeType);
}

function buildExpectationSignals(metrics, expectationState, expectations) {
  const signals = [];

  if (expectations.requireFunction && metrics.functions === 0) {
    signals.push({
      level: "warning",
      code: "EXPECTED_FUNCTION_MISSING",
      message:
        "This exercise expects a function-like structure, but none was detected in the AST.",
    });
  }

  if (
    (expectations.requireConditional || expectations.minimumConditionals > 0) &&
    metrics.conditionals < Math.max(1, expectations.minimumConditionals)
  ) {
    signals.push({
      level: "warning",
      code: "EXPECTED_CONDITIONAL_MISSING",
      message:
        "The expected conditional structure was not detected. This can indicate a missing condition or weak decision logic.",
    });
  }

  if (
    (expectations.requireLoop || expectations.minimumLoops > 0) &&
    metrics.loops < Math.max(1, expectations.minimumLoops)
  ) {
    signals.push({
      level: "warning",
      code: "EXPECTED_LOOP_MISSING",
      message:
        "The expected loop structure was not detected. This can indicate an incomplete iteration pattern.",
    });
  }

  if (expectations.requireBranching && !expectationState.hasElseBranch) {
    signals.push({
      level: "info",
      code: "EXPECTED_BRANCHING_WEAK",
      message:
        "A branching structure was expected, but no explicit else-style branch was detected.",
    });
  }

  if (
    expectations.minimumFunctions > 0 &&
    metrics.functions < expectations.minimumFunctions
  ) {
    signals.push({
      level: "info",
      code: "FUNCTION_COUNT_BELOW_EXPECTATION",
      message: `Expected at least ${expectations.minimumFunctions} function-like structure(s), but detected ${metrics.functions}.`,
    });
  }

  if (
    expectations.minimumExpressions > 0 &&
    metrics.expressions < expectations.minimumExpressions
  ) {
    signals.push({
      level: "info",
      code: "EXPRESSION_COUNT_BELOW_EXPECTATION",
      message: `Expected at least ${expectations.minimumExpressions} expression node(s), but detected ${metrics.expressions}.`,
    });
  }

  if (
    expectations.minimumDepth > 0 &&
    metrics.maxDepth < expectations.minimumDepth
  ) {
    signals.push({
      level: "info",
      code: "STRUCTURE_TOO_SHALLOW",
      message: `Expected a structural depth of at least ${expectations.minimumDepth}, but detected ${metrics.maxDepth}.`,
    });
  }

  if (expectationState.forbiddenNodeHits.length > 0) {
    signals.push({
      level: "warning",
      code: "FORBIDDEN_NODE_TYPE_DETECTED",
      message: `Detected forbidden node type(s): ${[
        ...new Set(expectationState.forbiddenNodeHits),
      ].join(", ")}.`,
    });
  }

  return signals;
}

export function buildAstRuleFeedback(astRoot, metrics, analysisOptions = {}) {
  const expectations = mergeExpectations(analysisOptions);
  const expectationState = {
    hasElseBranch: false,
    returnOutsideCallable: false,
    loopControlOutsideLoop: false,
    forbiddenNodeHits: [],
    rootLevelReturns: 0,
    rootLevelConditionals: 0,
  };

  walkAst(astRoot, (node, ancestry) => {
    if (isElseNode(node.type)) {
      expectationState.hasElseBranch = true;
    }

    if (isReturnNode(node.type) && !hasAncestorKind(ancestry, "callable")) {
      expectationState.returnOutsideCallable = true;
      if (ancestry.length <= 1) {
        expectationState.rootLevelReturns += 1;
      }
    }

    if (isLoopControlNode(node.type) && !hasAncestorKind(ancestry, "loop")) {
      expectationState.loopControlOutsideLoop = true;
    }

    if (
      expectations.forbiddenNodeTypes.includes(node.type) ||
      expectations.forbiddenNodeTypes.includes(node.kind)
    ) {
      expectationState.forbiddenNodeHits.push(node.type);
    }

    if (
      ancestry.length <= 1 &&
      isConditionalNode(node.type) &&
      !hasAncestorType(ancestry, (type) => isConditionalNode(type))
    ) {
      expectationState.rootLevelConditionals += 1;
    }
  });

  const misconceptionSignals = [];

  // Only emit generic structural signals when the code is complex enough
  // that their absence is meaningful. Short scripts (< 8 nodes, no expectations
  // set) are almost always simple I/O solutions — don't spam the learner.
  const isComplexEnough = metrics.totalNodes >= 8;
  // Include ALL expectation flags — requireBranching, minimumDepth, and
  // minimumExpressions were previously missing, so exercises that only set
  // those flags would silently fall through with no structural feedback.
  const hasStructuralExpectations =
    expectations.requireFunction ||
    expectations.requireLoop ||
    expectations.requireConditional ||
    expectations.requireBranching ||
    expectations.minimumFunctions > 0 ||
    expectations.minimumLoops > 0 ||
    expectations.minimumConditionals > 0 ||
    expectations.minimumExpressions > 0 ||
    expectations.minimumDepth > 0;

  if (isComplexEnough && hasStructuralExpectations && metrics.functions === 0) {
    misconceptionSignals.push({
      level: "info",
      code: "NO_FUNCTION_STRUCTURE_DETECTED",
      message:
        "No function-like structure was detected. This exercise expects one — check that you've defined the required function.",
    });
  }

  // Only flag missing control flow when the exercise explicitly requires it
  if (hasStructuralExpectations && metrics.conditionals === 0 && metrics.loops === 0) {
    misconceptionSignals.push({
      level: "info",
      code: "LOW_CONTROL_FLOW_COMPLEXITY",
      message:
        "No loops or conditional branches were detected, but this exercise expects them. Make sure your solution includes the required logic.",
    });
  }

  if (expectations.requireBranching && metrics.conditionals > 0 && !expectationState.hasElseBranch) {
    misconceptionSignals.push({
      level: "info",
      code: "WEAK_BRANCHING_LOGIC",
      message:
        "Conditional logic was detected, but no explicit else-style branch was found. This exercise expects branching to cover both paths.",
    });
  }

  if (expectationState.loopControlOutsideLoop) {
    misconceptionSignals.push({
      level: "warning",
      code: "MISPLACED_LOOP_CONTROL",
      message:
        "A break or continue statement appears outside a loop structure. This can indicate wrongly placed control flow.",
    });
  }

  if (expectationState.returnOutsideCallable) {
    misconceptionSignals.push({
      level: "warning",
      code: "MISPLACED_RETURN_STATEMENT",
      message:
        "A return-style statement appears outside a function-like structure. This can indicate wrongly placed statements or an incomplete solution pattern.",
    });
  }

  // Only flag incomplete pattern when expectations demand structure
  if (
    hasStructuralExpectations &&
    metrics.totalNodes > 8 &&
    metrics.functions === 0 &&
    metrics.conditionals === 0 &&
    metrics.loops === 0
  ) {
    misconceptionSignals.push({
      level: "info",
      code: "INCOMPLETE_SOLUTION_PATTERN",
      message:
        "The solution has syntax but lacks the structure this exercise calls for — check the instructions for required functions, loops, or conditionals.",
    });
  }

  const expectationSignals = buildExpectationSignals(
    metrics,
    expectationState,
    expectations
  );

  return {
    expectationProfile: expectations,
    expectationState,
    misconceptionSignals: [...misconceptionSignals, ...expectationSignals],
  };
}

export default buildAstRuleFeedback;