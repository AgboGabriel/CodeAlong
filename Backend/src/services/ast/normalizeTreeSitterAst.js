function classifyNodeKind(nodeType) {
  if (!nodeType) {
    return "unknown";
  }

  const callableTypes = new Set([
    "function",
    "function_declaration",
    "function_definition",
    "function_expression",
    "function_item",
    "arrow_function",
    "method",
    "method_definition",
    "method_declaration",
    "constructor_declaration",
    "constructor",
    "lambda_expression",
  ]);

  const conditionalTypes = new Set([
    "if",
    "if_statement",
    "if_expression",
    "switch_statement",
    "switch_expression",
    "conditional_expression",
    "ternary_expression",
    "case_statement",
    "case_clause",
    "else_clause",
    "elif_clause",
    "when",
    "unless",
    "match_expression",
  ]);

  const loopTypes = new Set([
    "for",
    "for_statement",
    "for_in_statement",
    "foreach_statement",
    "enhanced_for_statement",
    "while",
    "while_statement",
    "do_statement",
    "loop_expression",
  ]);

  const declarationTypes = new Set([
    "class_definition",
    "class_declaration",
    "module",
    "namespace_definition",
    "namespace_declaration",
    "struct_item",
    "struct_specifier",
    "interface_declaration",
    "enum_declaration",
    "impl_item",
    "trait_item",
    "declaration",
  ]);

  if (
    callableTypes.has(nodeType) ||
    /(^|_)(function_definition|function_declaration|function_expression|method_definition|method_declaration|constructor_declaration|constructor)$/.test(
      nodeType
    )
  ) {
    return "callable";
  }

  if (
    conditionalTypes.has(nodeType) ||
    /(^|_)(if|switch|case|else|elif|when|unless)(_|$)/.test(nodeType)
  ) {
    return "conditional";
  }

  if (
    loopTypes.has(nodeType) ||
    /(^|_)(for|while|loop|foreach)(_|$)/.test(nodeType)
  ) {
    return "loop";
  }

  if (
    declarationTypes.has(nodeType) ||
    /(^|_)(class|module|namespace|struct|interface|enum|trait|impl)(_|$)/.test(nodeType)
  ) {
    return "declaration";
  }

  if (
    nodeType.endsWith("_expression") ||
    nodeType === "assignment_expression" ||
    nodeType === "binary_expression" ||
    nodeType === "unary_expression" ||
    nodeType === "call_expression"
  ) {
    return "expression";
  }

  if (nodeType.includes("statement")) {
    return "statement";
  }

  return "syntax";
}

function getNodeText(node, sourceCode, maxLength = 120) {
  if (!node || typeof node.startIndex !== "number" || typeof node.endIndex !== "number") {
    return null;
  }

  const text = sourceCode.slice(node.startIndex, node.endIndex).trim();

  if (!text) {
    return null;
  }

  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

export function normalizeTreeSitterNode(node, sourceCode) {
  if (!node) {
    return null;
  }

  return {
    type: node.type,
    kind: classifyNodeKind(node.type),
    text: getNodeText(node, sourceCode),
    startPosition: {
      line: node.startPosition.row + 1,
      column: node.startPosition.column,
    },
    endPosition: {
      line: node.endPosition.row + 1,
      column: node.endPosition.column,
    },
    metadata: {
      named: node.isNamed,
      childCount: node.namedChildCount,
      startIndex: node.startIndex,
      endIndex: node.endIndex,
    },
    children: node.namedChildren.map((childNode) =>
      normalizeTreeSitterNode(childNode, sourceCode)
    ),
  };
}

export default normalizeTreeSitterNode;
