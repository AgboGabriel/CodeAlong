/**
 * Comprehensive Semantic Analysis Engine
 * Performs multi-level code analysis: variables, control flow, patterns, misconceptions
 */

import VariableTracker from "./variableTracker.js";

class SemanticAnalysisEngine {
  constructor(astRoot, languageKey) {
    this.astRoot = astRoot;
    this.languageKey = languageKey;
    this.variableTracker = new VariableTracker();
    this.functions = [];
    this.loops = [];
    this.conditionals = [];
    this.diagnostics = [];
  }

  /**
   * Main analysis pipeline
   */
  analyze() {
    this.walkAndTrackVariables();
    this.analyzeControlFlow();
    this.detectMissingReturns();
    this.detectInfiniteLoops();
    this.detectOffByOne();
    this.detectAssignmentInCondition();
    this.detectUnusedVariables();
    this.detectUsedBeforeAssignment();
    this.recognizePatterns();

    return {
      diagnostics: this.diagnostics,
      analysis: {
        variables: this.analyzeVariableQuality(),
        controlFlow: this.analyzeControlFlowQuality(),
        patterns: this.detectedPatterns,
      },
    };
  }

  /**
   * Walk AST and track variable declarations/assignments/uses
   */
  walkAndTrackVariables() {
    this.walkAst(this.astRoot, (node, ancestry) => {
      if (!node.type) return;

      // Track function/scope entry
      if (node.kind === "callable" || node.type.includes("function_definition")) {
        this.functions.push(node);
        this.variableTracker.pushScope("function");
      }

      // Track block scope
      if (node.kind === "block" || node.type.includes("block")) {
        this.variableTracker.pushScope("block");
      }

      // Track loop scope
      if (node.kind === "loop" || node.type.includes("loop")) {
        this.loops.push(node);
        this.variableTracker.pushScope("loop");
      }

      // Track conditionals
      if (node.kind === "conditional" || node.type.includes("if_statement")) {
        this.conditionals.push(node);
      }

      // Variable declarations
      if (this.isVariableDeclaration(node)) {
        const varName = this.extractVariableName(node);
        if (varName) {
          this.variableTracker.declareVariable(varName, {
            node,
            type: node.type,
            startLine: node.startPosition?.line,
            startColumn: node.startPosition?.column,
            // A declaration that already contains an initializer (e.g.
            // `const x = 5`, `let y = foo()`, or a default/typed function
            // parameter) is "assigned" at the point of declaration. This
            // prevents false USED_BEFORE_ASSIGNMENT diagnostics for normal
            // declare+initialize statements, which never separately call
            // recordAssignment().
            hasInitializer: this.declarationHasInitializer(node),
          });
        }
      }

      // Assignments
      if (this.isAssignment(node)) {
        const varName = this.extractAssignmentTarget(node);
        if (varName) {
          const operator = this.extractOperator(node);
          this.variableTracker.recordAssignment(varName, {
            node,
            operator,
            inCondition: this.isInCondition(node, ancestry),
            inLoop: ancestry.some((ancestor) => ancestor.kind === "loop" || ancestor.type?.includes("loop")),
            parentType: ancestry[ancestry.length - 1]?.type,
            startLine: node.startPosition?.line,
            startColumn: node.startPosition?.column,
          });
        }
      }

      // Variable uses/references
      if (node.type === "identifier" && !this.isDeclarationContext(node, ancestry)) {
        this.variableTracker.recordUse(node.text || "", {
          node,
          context: ancestry[ancestry.length - 1]?.type,
          startLine: node.startPosition?.line,
          startColumn: node.startPosition?.column,
        });
      }
    });

    // Pop remaining scopes
    while (this.variableTracker.currentScope.parent) {
      this.variableTracker.popScope();
    }
  }

  /**
   * Analyze control flow for issues
   */
  analyzeControlFlow() {
    for (const func of this.functions) {
      this.checkFunctionReturnPaths(func);
    }
    for (const loop of this.loops) {
      this.checkLoopTermination(loop);
    }
  }

  /**
   * Find functions without return statements (when expected)
   */
  detectMissingReturns() {
    for (const func of this.functions) {
      const hasReturn = this.nodeContainsReturn(func);
      const isVoidFunction = this.isVoidFunction(func);

      if (!hasReturn && !isVoidFunction) {
        this.diagnostics.push({
          level: "warning",
          code: "MISSING_RETURN_STATEMENT",
          message: `Function "${this.extractFunctionName(func)}" does not have a return statement but is expected to return a value.`,
          location: func.startPosition,
        });
      }
    }
  }

  /**
   * Detect potential infinite loops
   */
  detectInfiniteLoops() {
    for (const loop of this.loops) {
      const loopType = loop.type;
      
      // Check for while(true) or similar
      if (loopType.includes("while")) {
        const condition = this.extractLoopCondition(loop);
        if (condition && (condition.includes("true") || condition === "")) {
          const hasBreak = this.nodeContainsBreak(loop);
          if (!hasBreak) {
            this.diagnostics.push({
              level: "warning",
              code: "INFINITE_LOOP_DETECTED",
              message: "Loop condition is always true and contains no break statement. This may be an infinite loop.",
              location: loop.startPosition,
            });
          }
        }
      }

      // Check for for loops with no increment
      if (loopType.includes("for")) {
        const hasIncrement = this.loopHasIncrement(loop);
        if (!hasIncrement) {
          this.diagnostics.push({
            level: "info",
            code: "LOOP_NO_INCREMENT",
            message: "Loop has no visible increment/decrement. Verify the loop will terminate.",
            location: loop.startPosition,
          });
        }
      }
    }
  }

  /**
   * Detect off-by-one errors in loop bounds
   */
  detectOffByOne() {
    for (const loop of this.loops) {
      const bounds = this.extractLoopBounds(loop);
      if (!bounds) continue;

      const { start, end, increment, condition } = bounds;

      // Common off-by-one patterns
      // Pattern: i < array.length vs i <= array.length
      if (condition && condition.includes("<=") && condition.includes("length")) {
        this.diagnostics.push({
          level: "info",
          code: "OFF_BY_ONE_POTENTIAL",
          message: "Loop uses <= with array length. This may cause array out-of-bounds access. Use < instead.",
          location: loop.startPosition,
        });
      }

      // Pattern: i starts at 1 instead of 0 with array access
      if (start === 1 && condition && condition.includes("length")) {
        this.diagnostics.push({
          level: "info",
          code: "LOOP_START_INDEX_WARNING",
          message: "Loop starts at 1, which may skip the first element if accessing a zero-indexed array.",
          location: loop.startPosition,
        });
      }
    }
  }

  /**
   * Detect assignments in conditions (often a misconception)
   */
  detectAssignmentInCondition() {
    const issues = this.variableTracker.findAssignmentsInConditions();
    for (const issue of issues) {
      this.diagnostics.push({
        level: "warning",
        code: "ASSIGNMENT_IN_CONDITION",
        message: `Assignment to "${issue.name}" detected inside condition. This may be unintended. Use == for comparison or = for assignment outside the condition.`,
        location: issue.assignment.startLine,
      });
    }
  }

  /**
   * Detect unused variables
   */
  detectUnusedVariables() {
    const unused = this.variableTracker.findUnusedVariables();
    for (const variable of unused) {
      this.diagnostics.push({
        level: "info",
        code: "UNUSED_VARIABLE",
        message: `Variable "${variable.name}" is declared but never used.`,
        location: variable.declaration?.startPosition,
      });
    }
  }

  /**
   * Detect variables used before assignment
   */
  detectUsedBeforeAssignment() {
    const issues = this.variableTracker.findUsedBeforeAssignment();
    for (const issue of issues) {
      this.diagnostics.push({
        level: "error",
        code: "USED_BEFORE_ASSIGNMENT",
        message: `Variable "${issue.name}" is used before being assigned. Initialize it before use.`,
        location: issue.firstUse?.startPosition,
      });
    }
  }

  /**
   * Recognize common programming patterns
   */
  recognizePatterns() {
    this.detectedPatterns = {
      accumulators: [],
      counters: [],
      indexing: [],
      flagVariables: [],
      temporaryVariables: [],
    };

    const loopVars = this.variableTracker.findLoopVariables();
    for (const loopVar of loopVars) {
      if (loopVar.isAccumulator) {
        this.detectedPatterns.accumulators.push(loopVar.name);
      }
      if (loopVar.isCounter) {
        this.detectedPatterns.counters.push(loopVar.name);
      }
      if (loopVar.isIndexing) {
        this.detectedPatterns.indexing.push(loopVar.name);
      }
    }

    // Detect flag-like variables (booleans with meaningful names)
    const allVars = this.variableTracker.globalScope.allVariables(true);
    for (const variable of allVars) {
      if (this.isFlagLikeVariable(variable.name)) {
        this.detectedPatterns.flagVariables.push(variable.name);
      }
    }

    // Detect temp variables
    for (const variable of allVars) {
      if (this.isTemporaryVariable(variable.name)) {
        this.detectedPatterns.temporaryVariables.push(variable.name);
      }
    }
  }

  /**
   * Analyze overall variable quality
   */
  analyzeVariableQuality() {
    const unused = this.variableTracker.findUnusedVariables();
    const usedBeforeAssignment = this.variableTracker.findUsedBeforeAssignment();
    const allVars = this.variableTracker.globalScope.allVariables(true);

    return {
      totalVariables: allVars.length,
      unusedVariables: unused.length,
      usedBeforeAssignment: usedBeforeAssignment.length,
      qualityScore: this.computeVariableQualityScore(
        allVars.length,
        unused.length,
        usedBeforeAssignment.length
      ),
    };
  }

  /**
   * Analyze control flow quality
   */
  analyzeControlFlowQuality() {
    const withoutReturns = this.functions.filter((f) => !this.nodeContainsReturn(f));
    const potentialInfinite = this.loops.filter((l) => this.couldBeInfinite(l));

    return {
      totalFunctions: this.functions.length,
      functionsWithoutReturn: withoutReturns.length,
      totalLoops: this.loops.length,
      potentialInfiniteLoops: potentialInfinite.length,
      qualityScore: this.computeControlFlowQualityScore(
        this.functions.length,
        withoutReturns.length,
        this.loops.length,
        potentialInfinite.length
      ),
    };
  }

  // ============ Helper Methods ============

  walkAst(node, visit, ancestry = []) {
    if (!node) return;
    visit(node, ancestry);
    for (const child of node.children || []) {
      this.walkAst(child, visit, [...ancestry, node]);
    }
  }

  isVariableDeclaration(node) {
    return (
      node.kind === "declaration" ||
      node.type.includes("declaration") ||
      node.type.includes("declarator") ||
      node.type.includes("parameter")
    );
  }

  isAssignment(node) {
    return (
      node.type.includes("assignment") ||
      node.type === "augmented_assignment" ||
      (node.type === "expression" && 
       node.text && 
       /[+\-*/%]?=|(\+\+|--)/.test(node.text))
    );
  }

  isDeclarationContext(node, ancestry) {
    const parent = ancestry[ancestry.length - 1];
    return parent && (
      parent.type.includes("declaration") ||
      parent.type.includes("parameter")
    );
  }

  /**
   * True only when `node` sits inside the actual parenthesized condition
   * clause of an if/while/for/switch — e.g. `if (x = 5)`.
   *
   * Previously this matched ANY descendant of an "if_statement" node,
   * which incorrectly flagged ordinary assignments inside the if/else
   * *body* (e.g. `if (cond) { x = true; } else { x = false; }`) as
   * "assignment in condition". We now require the nearest condition-like
   * ancestor in the chain to actually be the condition clause itself
   * (Tree-sitter typically names this node type "condition", "parenthesized_expression"
   * directly under the if/while/for, or similar — never the consequence/
   * alternative block).
   */
  isInCondition(node, ancestry) {
    // Walk ancestry from nearest to farthest. Stop as soon as we hit a
    // block/consequence/alternative node — if we reach one of those before
    // finding an actual condition node, the assignment is in the BODY, not
    // the condition, and should not be flagged.
    for (let i = ancestry.length - 1; i >= 0; i -= 1) {
      const ancestorType = ancestry[i].type || "";

      // Reached the statement body before finding a condition clause —
      // this assignment is in the if/while/for BODY, not its condition.
      if (
        ancestorType.includes("consequence") ||
        ancestorType.includes("alternative") ||
        ancestorType.includes("else_clause") ||
        ancestorType.includes("block") ||
        ancestorType.includes("statement_block")
      ) {
        return false;
      }

      // Found the actual condition clause.
      if (
        ancestorType === "condition" ||
        ancestorType === "parenthesized_expression" ||
        ancestorType.endsWith("_condition") ||
        ancestorType.includes("condition_clause")
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Detects whether a declaration node already includes an initializer,
   * e.g. `const x = 5`, `let y = foo()`, or a default/typed function
   * parameter like `function f(input = "Hello")`.
   *
   * IMPORTANT: in our normalized Tree-sitter output (see
   * normalizeTreeSitterAst.js), `children` only contains NAMED children —
   * anonymous tokens like the literal `=` sign are stripped out. So we
   * can never reliably find a literal "=" child node; instead we infer an
   * initializer from node shape and text, with multiple fallbacks so a
   * `null`/truncated `.text` (which getNodeText() can return for very
   * short or empty slices) never causes a false negative.
   */
  declarationHasInitializer(node) {
    const nodeType = node.type || "";

    // Function parameters are always "initialized" from the caller's
    // perspective by the time the function body runs — including default
    // parameters, typed parameters, and plain parameters.
    if (nodeType.includes("parameter")) {
      return true;
    }

    // A declarator node (e.g. `variable_declarator`) with an "=" anywhere
    // in its own text has an initializer right there in the same
    // statement. This is the primary, most reliable signal.
    if (node.text && node.text.includes("=")) {
      return true;
    }

    // Fallback 1: a declarator with 2+ named children is virtually always
    // `identifier = value` shaped (the "=" token itself is an anonymous
    // node and won't appear in `children`, but the value expression will).
    // A bare declaration with no initializer (`let x;`) has exactly 1
    // named child — just the identifier.
    if (
      (nodeType.includes("declarator") || nodeType.includes("declaration")) &&
      Array.isArray(node.children) &&
      node.children.length >= 2
    ) {
      return true;
    }

    // Fallback 2: look for an explicit "=" text on a direct child, in case
    // a parser/version does expose it as a named node.
    for (const child of node.children || []) {
      if (child.text === "=" || (child.text && child.text.startsWith("="))) {
        return true;
      }
    }

    return false;
  }

  extractVariableName(node) {
    if (node.type === "identifier") return node.text || "";
    // Look for first identifier child
    for (const child of node.children || []) {
      if (child.type === "identifier") return child.text || "";
    }
    return "";
  }

  extractAssignmentTarget(node) {
    // For most cases, first identifier is the target
    for (const child of node.children || []) {
      if (child.type === "identifier") return child.text || "";
    }
    return "";
  }

  extractOperator(node) {
    const text = node.text || "";
    const match = text.match(/([+\-*/%]?=|(\+\+|--))/);
    return match ? match[1] : "=";
  }

  extractFunctionName(func) {
    for (const child of func.children || []) {
      if (child.type === "identifier") return child.text || "unknown";
    }
    return "unknown";
  }

  extractLoopCondition(loop) {
    for (const child of loop.children || []) {
      if (child.type.includes("condition")) {
        return child.text || "";
      }
    }
    return "";
  }

  extractLoopBounds(loop) {
    // Simplified bounds extraction
    const text = loop.text || "";
    // This is a simplified pattern for common loops
    const match = text.match(/for\s*\(\s*(\w+)\s*=\s*(\d+);\s*\w+\s*([<>]=?)\s*(\w+)/);
    if (match) {
      return {
        start: parseInt(match[2]),
        condition: match[3],
        end: match[4],
      };
    }
    return null;
  }

  nodeContainsReturn(node) {
    let hasReturn = false;
    this.walkAst(node, (child) => {
      if (child.type && child.type.includes("return")) {
        hasReturn = true;
      }
    });
    return hasReturn;
  }

  nodeContainsBreak(node) {
    let hasBreak = false;
    this.walkAst(node, (child) => {
      if (child.type && child.type.includes("break")) {
        hasBreak = true;
      }
    });
    return hasBreak;
  }

  loopHasIncrement(loop) {
    const text = loop.text || "";
    return /(\+\+|--|\+=|-=)/.test(text);
  }

  isVoidFunction(func) {
    const text = func.text || "";
    return /void\s+\w+\s*\(|function\s+\w+|def\s+\w+/.test(text);
  }

  isFlagLikeVariable(name) {
    return /^(is|has|should|can|was|were)/.test(name.toLowerCase()) ||
           /^(enabled|disabled|active|inactive|visible|hidden)/.test(name.toLowerCase());
  }

  isTemporaryVariable(name) {
    return /^(temp|tmp|t|x|temp\d+)$/.test(name.toLowerCase());
  }

  checkFunctionReturnPaths(func) {
    // Simplified check for now
  }

  checkLoopTermination(loop) {
    // Simplified check for now
  }

  couldBeInfinite(loop) {
    const condition = this.extractLoopCondition(loop);
    const hasBreak = this.nodeContainsBreak(loop);
    return condition === "true" && !hasBreak;
  }

  computeVariableQualityScore(total, unused, usedBefore) {
    if (total === 0) return 100;
    const unusedPenalty = (unused / total) * 30;
    const usedBeforePenalty = (usedBefore / total) * 50;
    return Math.max(0, 100 - unusedPenalty - usedBeforePenalty);
  }

  computeControlFlowQualityScore(functions, noReturn, loops, infinite) {
    let score = 100;
    if (functions > 0) {
      score -= (noReturn / functions) * 30;
    }
    if (loops > 0) {
      score -= (infinite / loops) * 40;
    }
    return Math.max(0, score);
  }
}

export default SemanticAnalysisEngine;

