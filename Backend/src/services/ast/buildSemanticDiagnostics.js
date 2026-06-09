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

  walkAst(astRoot, (node, ancestry) => {
    if (node.type !== "identifier") return;
    const parent = ancestry[ancestry.length - 1];
    if (parent && isDeclarationContext(parent.type) && node.text) {
      declared.add(node.text);
    }
  });

  return declared;
}

export function buildSemanticDiagnostics(astRoot, languageKey) {
  if (
    !astRoot ||
    !["c", "cpp", "java", "csharp", "go", "rust", "javascript", "python"].includes(languageKey)
  ) {
    return [];
  }

  const declared = collectDeclaredIdentifiers(astRoot);
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

  return diagnostics;
}

export default buildSemanticDiagnostics;
