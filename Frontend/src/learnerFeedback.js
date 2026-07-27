function normalizeText(value = "") {
  return String(value || "").trim();
}

function walkAst(node, visit, ancestry = []) {
  if (!node) return;
  visit(node, ancestry);
  for (const child of node.children || []) {
    walkAst(child, visit, [...ancestry, node]);
  }
}

function extractCallableName(text = "") {
  const source = String(text);
  const patterns = [
    /\bdef\s+([A-Za-z_]\w*)\s*\(/g,
    /\bfunction\s+([A-Za-z_]\w*)\s*\(/g,
    /\b([A-Za-z_]\w*)\s*=\s*(?:async\s*)?\(?[^=]*\)?\s*=>/g,
    /\b([A-Za-z_]\w*)\s*\([^{};]*\)\s*\{/g,
  ];

  for (const pattern of patterns) {
    const matches = [...source.matchAll(pattern)];
    if (matches.length > 0) {
      return matches[matches.length - 1][1];
    }
  }

  return null;
}

function extractClassName(text = "") {
  const match = String(text).match(/\bclass\s+([A-Za-z_]\w*)\b/);
  return match?.[1] || null;
}

function extractDiagnosticIdentifier(message = "") {
  const match = String(message).match(/Identifier "(.+?)"/);
  return match?.[1] || null;
}

function extractDuplicateIdentifier(message = "") {
  const match = String(message).match(/"(.+?)" is declared more than once/);
  return match?.[1] || null;
}

function hasAny(text, patterns = []) {
  return patterns.some((pattern) => text.includes(pattern));
}

function describeSimpleProgram(astRoot, languageKey = "") {
  if (!astRoot) return [];

  const facts = {
    readsInput: false,
    printsOutput: false,
    declaresValues: false,
    computesValue: false,
    usesLoop: false,
    usesConditional: false,
  };

  walkAst(astRoot, (node) => {
    const text = normalizeText(node.text).toLowerCase();
    if (!text) return;

    if (
      text.includes("cin >>") ||
      text.includes("scanf") ||
      text.includes("input(") ||
      text.includes("readline") ||
      text.includes("scanner") ||
      text.includes("fmt.scan")
    ) {
      facts.readsInput = true;
    }

    if (
      text.includes("cout") ||
      text.includes("printf") ||
      text.includes("print(") ||
      text.includes("println") ||
      text.includes("console.log") ||
      text.includes("system.out") ||
      text.includes("fmt.print")
    ) {
      facts.printsOutput = true;
    }

    if (node.kind === "declaration") facts.declaresValues = true;
    if (node.kind === "loop") facts.usesLoop = true;
    if (node.kind === "conditional") facts.usesConditional = true;

    if (
      node.kind === "expression" &&
      /[a-z0-9_)\]]\s*[+\-*/%]\s*[a-z0-9_(\[]/i.test(node.text || "")
    ) {
      facts.computesValue = true;
    }
  });

  const descriptions = [];
  if (facts.readsInput && facts.printsOutput && facts.computesValue) {
    descriptions.push("Your code reads input, computes a value, and prints the result.");
  } else if (facts.readsInput && facts.printsOutput) {
    descriptions.push("Your code reads input and prints a value.");
  } else if (facts.printsOutput && facts.computesValue) {
    descriptions.push("Your code computes a value and prints it.");
  } else if (facts.printsOutput) {
    descriptions.push("Your code prints output to the console.");
  } else if (facts.readsInput) {
    descriptions.push("Your code reads a value from input.");
  }

  if (facts.declaresValues) {
    descriptions.push("You declared named values to hold data while the program runs.");
  }
  if (facts.usesLoop) {
    descriptions.push("Your solution uses a loop to repeat work.");
  }
  if (facts.usesConditional) {
    descriptions.push("Your solution uses a conditional to choose between paths.");
  }

  return [...new Set(descriptions)];
}

function getLanguageProfile(languageKey = "") {
  switch (languageKey) {
    case "javascript":
      return {
        callableLabel: "function",
        callerName: "call",
        printCall: (expression) => `console.log(${expression});`,
        callSelf: (name) => `${name}();`,
        returnHint: "Use a `return` statement when you want to pass a value back.",
      };
    case "python":
      return {
        callableLabel: "function",
        callerName: "call",
        printCall: (expression) => `print(${expression})`,
        callSelf: (name) => `${name}()`,
        returnHint: "Use `return` for values and `print()` for output.",
      };
    case "cpp":
    case "c":
      return {
        callableLabel: "function",
        callerName: "call",
        printCall: (expression) => `cout << ${expression} << endl;`,
        callSelf: (name) => `${name}();`,
        returnHint: "Use `return` to send a value back, or `cout` to print it.",
      };
    case "java":
    case "csharp":
      return {
        callableLabel: "method",
        callerName: "call",
        printCall: (expression) =>
          languageKey === "csharp" ? `Console.WriteLine(${expression});` : `System.out.println(${expression});`,
        callSelf: (name) => `${name}();`,
        returnHint: "Use `return` for values and the language's print call for output.",
      };
    case "go":
      return {
        callableLabel: "function",
        callerName: "call",
        printCall: (expression) => `fmt.Println(${expression})`,
        callSelf: (name) => `${name}()`,
        returnHint: "Use `return` for values and `fmt.Println()` for output.",
      };
    case "rust":
      return {
        callableLabel: "function",
        callerName: "call",
        printCall: (expression) => `println!("{}", ${expression});`,
        callSelf: (name) => `${name}()`,
        returnHint: "Use `return` or an expression for values, and `println!` for output.",
      };
    default:
      return {
        callableLabel: "function",
        callerName: "call",
        printCall: (expression) => `print(${expression})`,
        callSelf: (name) => `${name}()`,
        returnHint: "Use a return statement for values and a print call for output.",
      };
  }
}

function findIgnoredReturnUsage(astRoot, methodName) {
  if (!astRoot || !methodName) return null;

  let ignoredCallText = null;
  const callPattern = new RegExp(`\\b${methodName}\\s*\\(`);
  const printPatterns = ["cout", "printf", "println", "console.log", "System.out", "print("];

  walkAst(astRoot, (node, ancestry) => {
    const text = normalizeText(node.text);
    if (!text || node.kind === "callable") return;
    if (!callPattern.test(text)) return;

    const surroundingText = [text, ...ancestry.map((entry) => normalizeText(entry.text))]
      .join(" ")
      .toLowerCase();

    if (!printPatterns.some((pattern) => surroundingText.includes(pattern.toLowerCase()))) {
      ignoredCallText = ignoredCallText || text;
    }
  });

  return ignoredCallText;
}

function collectDeclaredSymbols(astRoot) {
  const symbols = new Set();

  walkAst(astRoot, (node) => {
    const text = normalizeText(node.text);
    if (!text) return;

    if (node.kind === "callable") {
      const name = extractCallableName(text);
      if (name) symbols.add(name);
    }

    if (node.type?.includes("class")) {
      const className = extractClassName(text);
      if (className) symbols.add(className);
    }
  });

  return symbols;
}

function shouldSuppressUndeclaredDiagnostic(item, declaredSymbols) {
  if (item?.code !== "POSSIBLE_UNDECLARED_IDENTIFIER") return false;

  const identifier = extractDiagnosticIdentifier(item.message);
  if (!identifier) return false;

  return declaredSymbols.has(identifier) || identifier === "log";
}

function buildCompilerHints(compilerText, diagnostics = []) {
  const hints = [];
  const lowered = compilerText.toLowerCase();
  const duplicateDiag = diagnostics.find((d) => d.code === "DUPLICATE_DECLARATION");
  const duplicateNames = new Set(
    diagnostics
      .filter((item) => item.code === "DUPLICATE_DECLARATION")
      .map((item) => extractDuplicateIdentifier(item.message))
      .filter(Boolean)
  );
  const undeclaredIdentifier = diagnostics.find((item) => {
    if (item.code !== "POSSIBLE_UNDECLARED_IDENTIFIER") return false;
    const identifier = extractDiagnosticIdentifier(item.message);
    return !identifier || !duplicateNames.has(identifier);
  });

  if (duplicateDiag) {
    hints.push(duplicateDiag.message);
  }

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

  // Duplicate / redeclaration errors
  if (
    !duplicateDiag &&
    (lowered.includes("has already been declared") ||
      lowered.includes("already defined") ||
      lowered.includes("duplicate local variable") ||
      lowered.includes("redeclaration of"))
  ) {
    hints.push(
      "A variable is declared more than once with the same name. Remove the duplicate declaration or rename one of them."
    );
  } else if (
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

  if (
    lowered.includes("std::string") ||
    lowered.includes("string is not a member of std") ||
    lowered.includes("does not name a type") ||
    lowered.includes("unknown type name 'string'")
  ) {
    hints.push(
      "C++ cannot resolve `std::string` here. Add `#include <string>` near the top of the file."
    );
  }

  if (
    lowered.includes("control reaches end of non-void function") ||
    lowered.includes("no return statement in function returning non-void") ||
    lowered.includes("not all control paths return a value")
  ) {
    hints.push(
      "The function is supposed to return a value, but it ends without returning one. Add a `return` statement or change the function to `void`."
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
    if (item.code === "DUPLICATE_DECLARATION") {
      hints.push(item.message);
      hints.push(
        "Tip: delete the starter code lines you no longer need, or scroll to the top of the editor and remove the conflicting declaration."
      );
    }

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

function buildIntentGuidance({
  astRoot,
  compilerText = "",
  diagnostics = [],
  summary = {},
  languageKey = "",
}) {
  const lowered = compilerText.toLowerCase();
  const language = getLanguageProfile(languageKey);
  const declaredSymbols = collectDeclaredSymbols(astRoot);
  const classNames = [];
  const callableContexts = [];

  walkAst(astRoot, (node) => {
    const text = normalizeText(node.text);
    if (node.type?.includes("class") && text) {
      const className = extractClassName(text);
      if (className) classNames.push(className);
    }

    if (node.kind === "callable" && text) {
      const methodName = extractCallableName(text);
      const subtree = [];
      walkAst(node, (subNode) => {
        subtree.push(subNode);
      });

      callableContexts.push({
        name: methodName || null,
        text,
        nodes: subtree,
        node,
      });
    }
  });

  const className = classNames[0] || null;
  const preferredCallable =
    callableContexts.find((entry) => entry.name && entry.name !== "main") || callableContexts[0] || null;
  const methodName = preferredCallable?.name || null;
  const targetName =
    className && methodName
      ? `${className}::${methodName}()`
      : methodName
        ? `${methodName}()`
        : null;
  const callableText = preferredCallable?.text || "";
  const callableNodes = preferredCallable?.nodes || [];
  const usesStringType =
    /\bstd::string\b/i.test(callableText) ||
    /\bstring\b/i.test(callableText) ||
    callableNodes.some((node) => /\bstd::string\b/i.test(normalizeText(node.text)) || /\bstring\b/i.test(normalizeText(node.text)));
  const usesConsoleOutput =
    hasAny(callableText, ["cout", "printf", "println", "console.log", "System.out"]) ||
    callableNodes.some((node) =>
      hasAny(normalizeText(node.text), ["cout", "printf", "println", "console.log", "System.out"])
    );
  const hasReturnStatement = callableNodes.some((node) => node.type?.includes("return"));
  const ignoredReturnUsage =
    usesStringType && hasReturnStatement && methodName
      ? findIgnoredReturnUsage(astRoot, methodName)
      : false;
  const missingCallUsage =
    methodName && methodName !== "main"
      ? (() => {
          const callPattern = new RegExp(`\\b${methodName}\\s*\\(`);
          let foundCall = null;

          walkAst(astRoot, (node, ancestry) => {
            if (foundCall || !node?.text) return;
            if (preferredCallable?.node && ancestry.includes(preferredCallable.node)) return;

            const text = normalizeText(node.text);
            const nodeType = String(node.type || "");
            const isRealCallSite =
              nodeType.includes("call") ||
              nodeType.includes("expression") ||
              nodeType.includes("statement");
            const looksLikeDeclaration =
              nodeType.includes("function") ||
              nodeType.includes("declaration") ||
              nodeType.includes("definition") ||
              nodeType.includes("class") ||
              nodeType.includes("method");

            if (isRealCallSite && !looksLikeDeclaration && callPattern.test(text)) {
              foundCall = text;
            }
          });

          return foundCall;
        })()
      : null;

  const intent = [];
  const problems = [];
  const fixes = [];

  if (className) {
    intent.push(`You are defining a ${languageKey === "cpp" ? "C++ class" : "class"} named \`${className}\`.`);
  }

  if (targetName) {
    intent.push(`You are working on the ${language.callableLabel} \`${targetName}\`.`);
  }

  if (usesStringType) {
    intent.push(
      languageKey === "cpp"
        ? "That C++ method is meant to return text using `std::string`."
        : "That callable is meant to return text."
    );
  }

  if (usesConsoleOutput) {
    intent.push(
      languageKey === "javascript"
        ? "The function also prints a message with `console.log()`."
        : languageKey === "python"
          ? "The function also prints a message with `print()`."
          : languageKey === "cpp"
            ? "The function also prints a message with `cout`."
            : "The callable also prints a message to the console."
    );
  }

  const compilerShowsStringIssue =
    lowered.includes("std::string") ||
    lowered.includes("string is not a member of std") ||
    lowered.includes("does not name a type") ||
    lowered.includes("unknown type name 'string'");

  const compilerShowsMissingReturn =
    lowered.includes("control reaches end of non-void function") ||
    lowered.includes("no return statement in function returning non-void") ||
    lowered.includes("not all control paths return a value");

  if (usesStringType && !hasReturnStatement && compilerShowsMissingReturn) {
    problems.push(
      `\`${targetName || "the callable"}\` is declared to return a value, but no return statement exists in the body.`
    );
  } else if (usesStringType && !hasReturnStatement && methodName) {
    problems.push(
      `\`${targetName || "the callable"}\` looks like it should return text, but the body does not return anything.`
    );
  } else if (usesStringType && hasReturnStatement && ignoredReturnUsage) {
    problems.push(
      `The return value from \`${ignoredReturnUsage}\` is ignored instead of being shown or stored.`
    );
  }

  if (methodName && methodName !== "main" && !missingCallUsage && !compilerShowsMissingReturn) {
    problems.push(
      languageKey === "javascript"
        ? `\`${methodName}\` is defined, but it is never called with \`${language.callSelf(methodName)}\`.`
        : languageKey === "python"
          ? `\`${methodName}\` is defined, but it is never called. Add \`${language.callSelf(methodName)}\` to run it.`
          : languageKey === "cpp"
            ? `\`${targetName || methodName}\` is defined, but no call to it was found from \`main()\`.`
            : `\`${targetName || methodName}\` is defined, but no call to it was found in the rest of the file.`
    );
  }

  if (compilerShowsStringIssue) {
    problems.push("C++ cannot use `std::string` until `#include <string>` is added.");
    fixes.push("Add `#include <string>` at the top of the file.");
  }

  if (usesStringType && !hasReturnStatement) {
    if (languageKey === "javascript") {
      fixes.push(
        `If \`${targetName || "the function"}\` should return text, end it with a return statement. If it only prints, keep the ` +
          "console.log()" +
          " call instead of returning."
      );
    } else if (languageKey === "python") {
      fixes.push(
        `If \`${targetName || "the function"}\` should return text, end it with a return statement. If it only prints, use ${language.returnHint}.`
      );
    } else {
      fixes.push(
        `If \`${targetName || "the callable"}\` should return text, end it with a return statement that returns a value. If it only prints, change the return type to \`void\`.`
      );
    }
  }

  if (usesStringType && hasReturnStatement && ignoredReturnUsage) {
    fixes.push(
      `Print the returned value where it is called. For example: \`${language.printCall(ignoredReturnUsage)}\`.`
    );
  }

  if (methodName && methodName !== "main" && !missingCallUsage && !compilerShowsMissingReturn) {
    fixes.push(
      languageKey === "javascript"
        ? `Call it after the function definition with \`${methodName}();\`.`
        : languageKey === "python"
          ? `Call it after the function definition with \`${language.callSelf(methodName)}\`.`
          : languageKey === "cpp"
            ? `Call it from \`main()\` with \`${language.callSelf(methodName)}\`.`
            : `Call \`${methodName}()\` from \`main()\` or another entry point if you want it to run.`
    );
  }

  if (usesConsoleOutput && !usesStringType && summary.functions > 0) {
    intent.push(
      languageKey === "javascript"
        ? "The function prints with `console.log()`, so the output is going to the console."
        : languageKey === "python"
          ? "The function prints with `print()`, so the output is going to the console."
          : languageKey === "cpp"
            ? "The function prints with `cout`, so the output is going to the console."
            : "The code prints output, so the result is being sent to the console or terminal."
    );
  }

  if (!problems.length && compilerShowsMissingReturn) {
    problems.push("A return value is missing from a function that the compiler expects to produce one.");
  }

  if (!intent.length) {
    intent.push(...describeSimpleProgram(astRoot, languageKey));
  }

  if (!intent.length && summary.functions > 0) {
    intent.push("A function-like structure was detected.");
  }

  if (!intent.length && summary.conditionals > 0) {
    intent.push("Decision logic was detected.");
  }

  if (!intent.length && summary.loops > 0) {
    intent.push("Looping logic was detected.");
  }

  if (!problems.length && diagnostics.length > 0) {
    const semanticProblem = diagnostics.find((item) =>
      [
        "POSSIBLE_UNDECLARED_IDENTIFIER",
        "MISPLACED_RETURN_STATEMENT",
        "MISPLACED_LOOP_CONTROL",
      ].includes(item.code)
    );

    const dupDiag = diagnostics.find((d) => d.code === "DUPLICATE_DECLARATION");
    if (dupDiag) {
      problems.push(dupDiag.message);
      fixes.push(
        "Find the second declaration of the same variable and either delete it or rename it to something different."
      );
    } else if (semanticProblem?.code === "POSSIBLE_UNDECLARED_IDENTIFIER" && !declaredSymbols.has(extractDiagnosticIdentifier(semanticProblem.message) || "")) {
      problems.push("A name is being used before it has been declared or spelled correctly.");
    }
    if (semanticProblem?.code === "MISPLACED_RETURN_STATEMENT") {
      problems.push("A return statement appears outside the function that should own it.");
    }
    if (semanticProblem?.code === "MISPLACED_LOOP_CONTROL") {
      problems.push("A loop control statement appears outside a loop.");
    }
  }

  return {
    intent: [...new Set(intent)],
    problems: [...new Set(problems)],
    fixes: [...new Set(fixes)],
  };
}

/**
 * Builds human-readable strengths from the semantic analysis patterns
 * detected by SemanticAnalysisEngine (accumulators, counters, flags, etc.).
 * This is the "What you did well" layer that was previously missing.
 */
function buildPatternStrengths(analysis = {}, topicTitle = "") {
  const strengths = [];
  const patterns = analysis.detectedPatterns || {};
  const variables = analysis.variables || {};
  const controlFlow = analysis.controlFlow || {};

  // Accumulator pattern (sum += x, total += price, etc.)
  if ((patterns.accumulators || []).length > 0) {
    const names = patterns.accumulators.slice(0, 2).map((n) => `\`${n}\``).join(" and ");
    strengths.push(`You used an accumulator pattern with ${names} — that's the right approach for building up a running total.`);
  }

  // Counter pattern (i++, count += 1)
  if ((patterns.counters || []).length > 0) {
    const names = patterns.counters.slice(0, 2).map((n) => `\`${n}\``).join(" and ");
    strengths.push(`You used a counter variable (${names}) to track iterations — good technique.`);
  }

  // Indexing pattern (arr[i] style subscripting)
  if ((patterns.indexing || []).length > 0) {
    strengths.push("You used index-based access to reach into a collection — that's the right pattern here.");
  }

  // Flag variables (isActive, hasError, etc.)
  if ((patterns.flagVariables || []).length > 0) {
    const names = patterns.flagVariables.slice(0, 2).map((n) => `\`${n}\``).join(" and ");
    strengths.push(`You used boolean flag variable(s) (${names}) to track state — clear and readable.`);
  }

  // Good variable hygiene (low unused/used-before-assignment ratio)
  if (
    variables.totalVariables > 0 &&
    variables.unusedVariables === 0 &&
    variables.usedBeforeAssignment === 0 &&
    (variables.qualityScore || 0) >= 90
  ) {
    strengths.push("All your variables are declared and used correctly — clean variable hygiene.");
  }

  // Good control-flow quality
  if (
    controlFlow.totalFunctions > 0 &&
    controlFlow.functionsWithoutReturn === 0 &&
    controlFlow.potentialInfiniteLoops === 0
  ) {
    strengths.push("Your function(s) all have return statements and no obvious infinite loop risk.");
  }

  return strengths;
}

/**
 * Builds targeted hints from topic-specific misconception rules.
 * These are the educational "what to watch out for" messages that the
 * TopicMisconceptionRules engine matched against this topic's known pitfalls.
 */
function buildTopicMisconceptionHints(topicMisconceptions = []) {
  const hints = [];
  for (const misconception of topicMisconceptions) {
    if (misconception.feedback) {
      hints.push(misconception.feedback);
    }
    // Surface at most the first two hints per misconception to avoid overwhelming output
    for (const hint of (misconception.hints || []).slice(0, 2)) {
      hints.push(hint);
    }
  }
  return [...new Set(hints)];
}

export function buildLearnerFeedback({
  compileOutput = "",
  stderr = "",
  diagnostics = [],
  summary = {},
  ast = null,
  languageKey = "",
  // New parameters wired up by challenges.jsx Fix 4 — previously ignored
  analysis = {},
  topicMisconceptions = [],
  topicTitle = "",
}) {
  const compilerText = normalizeText(compileOutput) || normalizeText(stderr);
  const declaredSymbols = collectDeclaredSymbols(ast);
  const actionableDiagnostics = diagnostics.filter(
    (item) => !shouldSuppressUndeclaredDiagnostic(item, declaredSymbols)
  );
  const compilerHints = buildCompilerHints(compilerText, actionableDiagnostics);
  const astHints = buildAstHints(actionableDiagnostics);
  const intentGuidance = buildIntentGuidance({
    astRoot: ast,
    compilerText,
    diagnostics: actionableDiagnostics,
    summary,
    languageKey,
  });

  // ── Strengths ─────────────────────────────────────────────────────────────
  // Layer 1: what the code is trying to do (intent)
  const strengths = [];
  strengths.push(...intentGuidance.intent);

  // Layer 2: pattern-based strengths from SemanticAnalysisEngine
  // (accumulators, counters, indexing, flags, quality scores, etc.)
  const patternStrengths = buildPatternStrengths(analysis, topicTitle);
  strengths.push(...patternStrengths);

  // Layer 3: fall-through structural signals when nothing else fires
  if (!strengths.length && (summary.functions || 0) > 0) {
    strengths.push("A function-like structure was detected.");
  }
  if (!strengths.length && (summary.conditionals || 0) > 0) {
    strengths.push("Your solution includes decision-making logic.");
  }
  if (!strengths.length && (summary.loops || 0) > 0) {
    strengths.push("Your solution includes iteration logic.");
  }

  // ── Next steps ────────────────────────────────────────────────────────────
  // Structural problems + compiler hints + AST hints + topic misconceptions
  const topicHints = buildTopicMisconceptionHints(topicMisconceptions);
  const nextSteps = [
    ...intentGuidance.problems,
    ...compilerHints,
    ...astHints,
    ...topicHints,
  ];

  return {
    strengths: [...new Set(strengths)],
    nextSteps: [...new Set(nextSteps)],
    intent: intentGuidance.intent,
    problems: intentGuidance.problems,
    fixes: intentGuidance.fixes,
    compilerText,
    // Expose for consumers that want the raw topic-level feedback
    topicMisconceptions,
  };
}

export function formatLearnerFeedback({
  compileOutput = "",
  stderr = "",
  diagnostics = [],
  summary = {},
  ast = null,
  languageKey = "",
}) {
  const feedback = buildLearnerFeedback({
    compileOutput,
    stderr,
    diagnostics,
    summary,
    ast,
    languageKey,
  });

  const sections = [
    "Structural Summary",
    `Functions: ${summary.functions ?? 0}`,
    `Conditionals: ${summary.conditionals ?? 0}`,
    `Loops: ${summary.loops ?? 0}`,
  ];

  if (feedback.strengths.length > 0) {
    sections.push("", "What The Code Appears To Be Doing", ...feedback.strengths.map((item) => `- ${item}`));
  }

  if (feedback.problems?.length > 0) {
    sections.push("", "What Went Wrong", ...feedback.problems.map((item) => `- ${item}`));
  }

  if (feedback.fixes?.length > 0) {
    sections.push("", "Exact Fix", ...feedback.fixes.map((item) => `- ${item}`));
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