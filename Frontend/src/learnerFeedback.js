function normalizeText(value = "") {
  return String(value || "").trim();
}

function buildCompilerHints(compilerText, diagnostics = []) {
  const hints = [];
  const lowered = compilerText.toLowerCase();
  const undeclaredIdentifier = diagnostics.find(
    (item) => item.code === "POSSIBLE_UNDECLARED_IDENTIFIER"
  );

  if (undeclaredIdentifier) {
    const match = undeclaredIdentifier.message.match(/Identifier "(.+?)"/);
    const identifier = match?.[1];

    if (identifier === "o") {
      hints.push(
        "You may have typed the letter `o` instead of the number `0`. If you meant a successful return value, try `return 0;`."
      );
    } else if (identifier) {
      hints.push(
        `The name \`${identifier}\` is being used before the compiler can find a declaration for it. Check for a typo or define it before using it.`
      );
    }
  }

  if (
    lowered.includes("was not declared in this scope") ||
    lowered.includes("undeclared") ||
    lowered.includes("cannot find symbol") ||
    lowered.includes("nameerror") ||
    lowered.includes("is not defined")
  ) {
    hints.push(
      "A variable or name is being used before it has been declared, defined, or spelled correctly."
    );
  }

  if (lowered.includes("expected ';'")) {
    hints.push("A semicolon is missing near the location reported by the compiler.");
  }

  if (
    lowered.includes("expected primary-expression") ||
    lowered.includes("expected expression") ||
    lowered.includes("syntax error")
  ) {
    hints.push(
      "There is a syntax issue in the expression structure. Check the nearby line for a typo, missing symbol, or incomplete statement."
    );
  }

  if (
    lowered.includes("cannot convert") ||
    lowered.includes("incompatible types") ||
    lowered.includes("mismatched types") ||
    lowered.includes("cannot be converted")
  ) {
    hints.push(
      "The value being returned or assigned has the wrong type for what the code expects."
    );
  }

  if (lowered.includes("expected ')'")) {
    hints.push("A closing parenthesis is missing.");
  }

  if (lowered.includes("expected '}'") || lowered.includes("expected declaration before")) {
    hints.push("A closing brace may be missing, or the block structure may be unbalanced.");
  }

  return [...new Set(hints)];
}

function buildAstHints(diagnostics = []) {
  const hints = [];

  for (const item of diagnostics) {
    if (item.code === "WEAK_BRANCHING_LOGIC") {
      hints.push(
        "Your code makes a decision in one direction, but it may not handle the alternative path clearly."
      );
    }

    if (item.code === "EXPECTED_LOOP_MISSING") {
      hints.push("This task likely expects repetition, but no loop structure was detected.");
    }

    if (item.code === "EXPECTED_CONDITIONAL_MISSING") {
      hints.push("This task likely expects decision logic, but no conditional structure was detected.");
    }

    if (item.code === "MISPLACED_RETURN_STATEMENT") {
      hints.push("A return statement appears to be placed outside the function structure where it belongs.");
    }

    if (item.code === "MISPLACED_LOOP_CONTROL") {
      hints.push("A `break` or `continue` appears outside a loop.");
    }
  }

  return [...new Set(hints)];
}

export function buildLearnerFeedback({
  compileOutput = "",
  stderr = "",
  diagnostics = [],
  summary = {},
}) {
  const compilerText = normalizeText(compileOutput) || normalizeText(stderr);
  const compilerHints = buildCompilerHints(compilerText, diagnostics);
  const astHints = buildAstHints(diagnostics);

  const strengths = [];
  if ((summary.functions || 0) > 0) strengths.push("A function-like structure was detected.");
  if ((summary.conditionals || 0) > 0) strengths.push("Your solution includes decision-making logic.");
  if ((summary.loops || 0) > 0) strengths.push("Your solution includes iteration logic.");

  const nextSteps = [...compilerHints, ...astHints];

  return {
    strengths,
    nextSteps: [...new Set(nextSteps)],
    compilerText,
  };
}

export function formatLearnerFeedback({
  compileOutput = "",
  stderr = "",
  diagnostics = [],
  summary = {},
}) {
  const feedback = buildLearnerFeedback({
    compileOutput,
    stderr,
    diagnostics,
    summary,
  });

  const sections = [
    "Structural Summary",
    `Functions: ${summary.functions ?? 0}`,
    `Conditionals: ${summary.conditionals ?? 0}`,
    `Loops: ${summary.loops ?? 0}`,
  ];

  if (feedback.strengths.length > 0) {
    sections.push("", "What Looks Good", ...feedback.strengths.map((item) => `- ${item}`));
  }

  if (feedback.nextSteps.length > 0) {
    sections.push("", "What To Check Next", ...feedback.nextSteps.map((item) => `- ${item}`));
  }

  if (feedback.compilerText) {
    sections.push("", "Compiler Details", feedback.compilerText);
  }

  if (diagnostics.length > 0) {
    sections.push(
      "",
      "AST Details",
      ...diagnostics.map((item) => `- ${item.code}: ${item.message}`)
    );
  }

  return sections.join("\n");
}
