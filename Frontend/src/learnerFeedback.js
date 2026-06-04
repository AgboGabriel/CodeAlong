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

function hasAny(text, patterns = []) {
  return patterns.some((pattern) => text.includes(pattern));
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

    if (semanticProblem?.code === "POSSIBLE_UNDECLARED_IDENTIFIER" && !declaredSymbols.has(extractDiagnosticIdentifier(semanticProblem.message) || "")) {
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

export function buildLearnerFeedback({
  compileOutput = "",
  stderr = "",
  diagnostics = [],
  summary = {},
  ast = null,
  languageKey = "",
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

  const strengths = [];
  strengths.push(...intentGuidance.intent);
  if (!strengths.length && (summary.functions || 0) > 0) {
    strengths.push("A function-like structure was detected.");
  }
  if (!strengths.length && (summary.conditionals || 0) > 0) {
    strengths.push("Your solution includes decision-making logic.");
  }
  if (!strengths.length && (summary.loops || 0) > 0) {
    strengths.push("Your solution includes iteration logic.");
  }

  const nextSteps = [...intentGuidance.problems, ...compilerHints, ...astHints];

  return {
    strengths,
    nextSteps: [...new Set(nextSteps)],
    intent: intentGuidance.intent,
    problems: intentGuidance.problems,
    fixes: intentGuidance.fixes,
    compilerText,
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
