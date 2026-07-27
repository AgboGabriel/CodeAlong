function walkAst(node, visit, ancestry = []) {
  if (!node) return;
  visit(node, ancestry);
  for (const child of node.children || []) {
    walkAst(child, visit, [...ancestry, node]);
  }
}

function isDeclarationContext(nodeType = "") {
  return (
    nodeType.includes("declaration") ||
    nodeType.includes("declarator") ||
    nodeType.includes("parameter") ||
    nodeType.includes("function_definition") ||
    nodeType.includes("class_definition") ||
    nodeType.includes("struct_specifier")
  );
}

/**
 * Collects every identifier that appears anywhere inside a function's
 * parameter list, regardless of how deeply Tree-sitter nests it (plain
 * parameter, default parameter, typed parameter, rest parameter, etc).
 * This is a safety net for collectDeclaredIdentifiers below: the direct
 * parent-type check (isDeclarationContext) can miss identifiers that are
 * nested two or more levels inside a "parameters" node — e.g.
 * `function f(input = "Hello World")` wraps `input` inside a
 * `default_parameter` node, whose own parent is `formal_parameters`/
 * `parameters`, not the identifier's *immediate* parent.
 */
function collectParameterIdentifiers(astRoot) {
  const declared = new Set();

  function walkParams(node, insideParameters) {
    if (!node) return;

    const nodeType = node.type || "";
    const enteringParameters =
      insideParameters || nodeType.includes("parameter") || nodeType === "formal_parameters";

    if (enteringParameters && nodeType === "identifier" && node.text) {
      declared.add(node.text);
    }

    for (const child of node.children || []) {
      walkParams(child, enteringParameters);
    }
  }

  walkParams(astRoot, false);
  return declared;
}

function isReferenceContext(nodeType = "") {
  return (
    nodeType.includes("return") ||
    nodeType.includes("expression") ||
    nodeType.includes("argument") ||
    nodeType.includes("condition") ||
    nodeType.includes("initializer")
  );
}

function collectDeclaredIdentifiers(astRoot) {
  const declared = new Set();
  const declarationLocations = new Map(); // name -> first location

  walkAst(astRoot, (node, ancestry) => {
    if (node.type !== "identifier") return;
    const parent = ancestry[ancestry.length - 1];
    if (parent && isDeclarationContext(parent.type) && node.text) {
      declared.add(node.text);
      if (!declarationLocations.has(node.text)) {
        declarationLocations.set(node.text, node.startPosition || null);
      }
    }
  });

  for (const name of collectParameterIdentifiers(astRoot)) {
    declared.add(name);
  }

  return { declared, declarationLocations };
}

function collectDuplicateDeclarations(astRoot) {
  const seen = new Map(); // name -> first location
  const duplicates = [];

  walkAst(astRoot, (node, ancestry) => {
    if (node.type !== "identifier") return;
    const parent = ancestry[ancestry.length - 1];
    if (!parent || !isDeclarationContext(parent.type) || !node.text) return;
    // Skip parameters — they can shadow outer vars legitimately
    if (parent.type.includes("parameter")) return;

    const name = node.text;
    if (seen.has(name)) {
      duplicates.push({
        name,
        firstLocation: seen.get(name),
        secondLocation: node.startPosition || null,
      });
    } else {
      seen.set(name, node.startPosition || null);
    }
  });

  return duplicates;
}

export function buildSemanticDiagnostics(astRoot, languageKey) {
  if (
    !astRoot ||
    !["c", "cpp", "java", "csharp", "go", "rust", "javascript", "python"].includes(languageKey)
  ) {
    return [];
  }

  const { declared } = collectDeclaredIdentifiers(astRoot);
  const duplicates = collectDuplicateDeclarations(astRoot);
  const ignoreNames = new Set(["std", "cout", "cin", "System", "Console", "fmt", "main"]);
  const languageSpecificIgnores = {
    javascript: ["console", "window", "document", "Math", "JSON", "Array", "String", "Number", "Boolean", "Date", "setTimeout", "setInterval"],
    python: ["print", "len", "range", "str", "int", "float", "list", "dict", "set", "tuple"],
    cpp: ["endl"],
    java: ["System", "String"],
    csharp: ["Console", "String"],
    go: ["fmt"],
    rust: ["println", "print"],
  };

  for (const name of languageSpecificIgnores[languageKey] || []) {
    ignoreNames.add(name);
  }
  const diagnostics = [];
  const seen = new Set();

  walkAst(astRoot, (node, ancestry) => {
    if (node.type !== "identifier" || !node.text) return;

    const parent = ancestry[ancestry.length - 1];
    if (!parent || isDeclarationContext(parent.type) || !isReferenceContext(parent.type)) return;
    if (declared.has(node.text) || ignoreNames.has(node.text)) return;

    const key = `${node.text}:${node.startPosition?.line}:${node.startPosition?.column}`;
    if (seen.has(key)) return;
    seen.add(key);

    diagnostics.push({
      level: "warning",
      code: "POSSIBLE_UNDECLARED_IDENTIFIER",
      message: `Identifier "${node.text}" is used in ${parent.type} but no declaration was detected in the parsed structure.`,
      location: node.startPosition || null,
    });
  });

  // Duplicate declarations (e.g. const input = ... declared twice)
  // This is a syntax error in strict-mode JS and confusing in all languages.
  for (const dup of duplicates) {
    const key = `dup:${dup.name}`;
    if (!seen.has(key)) {
      seen.add(key);
      diagnostics.unshift({ // put at top — this is usually the real problem
        level: "error",
        code: "DUPLICATE_DECLARATION",
        // startPosition.line is already 1-based (normalizeTreeSitterAst adds 1
        // to row), so do NOT add 1 again — that was producing line numbers
        // off by one in the error message shown to the learner.
        message: `"${dup.name}" is declared more than once. The second declaration at line ${dup.secondLocation?.line ?? "?"} conflicts with the first at line ${dup.firstLocation?.line ?? "?"}. Remove or rename one of them.`,
        location: dup.secondLocation,
      });
    }
  }

  return diagnostics;
}

export default buildSemanticDiagnostics;