/**
 * Variable Tracking Engine
 * Maintains scope chains, tracks variable declarations, assignments, and uses
 * with location information for data-flow and control-flow analysis
 */

class Scope {
  constructor(parent = null, type = "global") {
    this.parent = parent;
    this.type = type; // "global", "function", "block", "loop"
    this.variables = new Map(); // name -> { declaration, assignments: [], uses: [], initialized: bool }
    this.children = [];
    if (parent) {
      parent.children.push(this);
    }
  }

  declareVariable(name, declaration) {
    if (this.variables.has(name)) {
      const existing = this.variables.get(name);
      existing.redeclarations = (existing.redeclarations || 0) + 1;
      return existing;
    }
    const variable = {
      name,
      declaration,
      assignments: [],
      uses: [],
      initialized: false,
      scopes: [this], // which scopes see this declaration
    };
    this.variables.set(name, variable);
    return variable;
  }

  recordAssignment(name, assignment) {
    let variable = this.variables.get(name);
    if (!variable) {
      // Check parent scopes
      let current = this.parent;
      while (current && !variable) {
        variable = current.variables.get(name);
        current = current.parent;
      }
      if (variable) {
        variable.assignments.push(assignment);
        variable.initialized = true;
        return variable;
      }
      // Unknown variable assignment
      variable = this.declareVariable(name, null);
    }
    variable.assignments.push(assignment);
    variable.initialized = true;
    return variable;
  }

  recordUse(name, use) {
    let variable = this.variables.get(name);
    if (!variable) {
      let current = this.parent;
      while (current && !variable) {
        variable = current.variables.get(name);
        current = current.parent;
      }
      if (variable) {
        variable.uses.push(use);
        return variable;
      }
      // Unknown variable use (likely undeclared)
      variable = this.declareVariable(name, null);
    }
    variable.uses.push(use);
    return variable;
  }

  lookup(name) {
    let variable = this.variables.get(name);
    if (variable) return variable;
    if (this.parent) return this.parent.lookup(name);
    return null;
  }

  allVariables(includeChildren = false) {
    const vars = Array.from(this.variables.values());
    if (includeChildren) {
      for (const child of this.children) {
        vars.push(...child.allVariables(true));
      }
    }
    return vars;
  }
}

class VariableTracker {
  constructor() {
    this.globalScope = new Scope(null, "global");
    this.currentScope = this.globalScope;
    this.scopes = [this.globalScope];
    this.builtins = this.initializeBuiltins();
  }

  initializeBuiltins() {
    return new Set([
      // JavaScript/TypeScript
      "console", "window", "document", "Math", "JSON", "Array", "String", "Number", 
      "Boolean", "Date", "setTimeout", "setInterval", "Object", "Promise", "Symbol",
      // Python
      "print", "len", "range", "str", "int", "float", "list", "dict", "set", "tuple",
      "open", "input", "sorted", "reversed", "enumerate", "zip", "map", "filter",
      // C/C++/Java/C#
      "std", "cout", "cin", "printf", "scanf", "System", "Console", "Scanner",
      // Go
      "fmt", "io", "os",
      // Rust
      "println", "print", "eprintln",
    ]);
  }

  pushScope(type = "block") {
    const newScope = new Scope(this.currentScope, type);
    this.currentScope = newScope;
    this.scopes.push(newScope);
    return newScope;
  }

  popScope() {
    if (this.currentScope.parent) {
      this.currentScope = this.currentScope.parent;
    }
  }

  declareVariable(name, declaration) {
    if (this.builtins.has(name)) {
      return null; // Don't track builtins
    }
    return this.currentScope.declareVariable(name, declaration);
  }

  recordAssignment(name, assignment) {
    if (this.builtins.has(name)) {
      return null;
    }
    return this.currentScope.recordAssignment(name, assignment);
  }

  recordUse(name, use) {
    if (this.builtins.has(name)) {
      return null;
    }
    return this.currentScope.recordUse(name, use);
  }

  /**
   * Find all unused variables
   */
  findUnusedVariables() {
    const unused = [];
    for (const scope of this.scopes) {
      for (const variable of scope.allVariables()) {
        if (variable.declaration && variable.uses.length === 0 && variable.name) {
          unused.push({
            name: variable.name,
            scope: scope.type,
            declaration: variable.declaration,
            isRedeclaration: (variable.redeclarations || 0) > 0,
          });
        }
      }
    }
    return unused;
  }

  /**
   * Find variables used before assignment.
   *
   * IMPORTANT: a variable that was declared WITH an initializer
   * (e.g. `const x = 5;`, function parameters with defaults, etc.)
   * is considered assigned at its declaration point. We treat
   * `variable.declaration.initialized` (set by the caller when the
   * declaration includes an initializer) as an implicit "assignment"
   * so we never flag a same-statement declare+initialize as a
   * used-before-assignment issue.
   *
   * We also require BOTH a real use AND a real prior assignment in
   * order to flag this — a variable with no assignments at all is
   * either a parameter (already initialized by the caller) or an
   * undeclared identifier (already covered by
   * POSSIBLE_UNDECLARED_IDENTIFIER), not a used-before-assignment case.
   */
  findUsedBeforeAssignment() {
    const issues = [];
    for (const scope of this.scopes) {
      for (const variable of scope.allVariables()) {
        if (!variable.declaration || variable.uses.length === 0) continue;

        // A declaration that already carries an initializer (const x = 5,
        // function parameter, etc.) counts as the first assignment even if
        // it was never pushed onto variable.assignments[].
        const declarationIsInitialized =
          variable.declaration?.hasInitializer === true ||
          variable.declaration?.type === "parameter" ||
          variable.declaration?.type?.includes("parameter");

        if (declarationIsInitialized) continue;

        // Need an explicit, real assignment recorded after declaration to
        // even evaluate ordering — otherwise this isn't a used-before-
        // assignment case, it's an undeclared/unknown identifier which is
        // handled by a different diagnostic.
        if (variable.assignments.length === 0) continue;

        const firstUse = variable.uses[0];
        const firstAssignment = variable.assignments[0];

        if (
          firstUse &&
          firstAssignment &&
          ((firstUse.startLine < firstAssignment.startLine) ||
            (firstUse.startLine === firstAssignment.startLine &&
              firstUse.startColumn < firstAssignment.startColumn))
        ) {
          issues.push({
            name: variable.name,
            firstUse,
            firstAssignment,
            scope: scope.type,
          });
        }
      }
    }
    return issues;
  }

  /**
   * Find variables that appear in assignments within conditions (suspicious pattern)
   */
  findAssignmentsInConditions() {
    const issues = [];
    for (const scope of this.scopes) {
      for (const variable of scope.allVariables()) {
        if (!variable.assignments) continue;
        for (const assignment of variable.assignments) {
          if (assignment.inCondition) {
            issues.push({
              name: variable.name,
              assignment,
              context: assignment.parentType,
            });
          }
        }
      }
    }
    return issues;
  }

  /**
   * Identify loop variables and their patterns
   */
  findLoopVariables() {
    const loopVars = [];
    const seen = new Set();
    const variables = this.globalScope.allVariables(true);

    for (const variable of variables) {
      if (!variable.name || seen.has(variable.name)) continue;
      const hasLoopActivity =
        variable.assignments?.some((assignment) => assignment.inLoop) ||
        variable.uses?.some((use) => use.context === "subscript");
      if (!hasLoopActivity) continue;

      const isAccumulator = this.isAccumulatorPattern(variable);
      const isCounter = this.isCounterPattern(variable);
      const isIndexing = this.isIndexingPattern(variable);

      if (isAccumulator || isCounter || isIndexing) {
        seen.add(variable.name);
        loopVars.push({
          name: variable.name,
          scope: "loop",
          isAccumulator,
          isCounter,
          isIndexing,
          variable,
        });
      }
    }
    return loopVars;
  }

  /**
   * Check if variable follows accumulator pattern (e.g., x += y)
   */
  isAccumulatorPattern(variable) {
    if (!variable.assignments) return false;
    return variable.assignments.some((assignment) => {
      if (!assignment.inLoop) return false;
      if (assignment.operator && ["+=", "-=", "*=", "/=", "%="].includes(assignment.operator)) {
        return true;
      }
      const text = assignment.node?.text || "";
      const escapedName = variable.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`\\b${escapedName}\\b\\s*=\\s*\\b${escapedName}\\b\\s*[+\\-*/%]`).test(text);
    });
  }
  /**
   * Check if variable follows counter pattern (e.g., i++, i += 1)
   */
  isCounterPattern(variable) {
    if (!variable.assignments) return false;
    return variable.assignments.some((assignment) => {
      if (!assignment.inLoop) return false;
      const text = assignment.node?.text || "";
      return (
        assignment.operator === "++" ||
        assignment.operator === "--" ||
        /\+=\s*1\b/.test(text) ||
        /-=\s*1\b/.test(text)
      );
    });
  }

  /**
   * Check if variable used for indexing (e.g., arr[i])
   */
  isIndexingPattern(variable) {
    if (!variable.uses) return false;
    return variable.uses.some((u) => u.context === "subscript");
  }

  /**
   * Get all variables visible in a scope (including parent scopes)
   */
  getVisibleVariables(scope = this.currentScope) {
    const visible = [];
    let current = scope;
    while (current) {
      visible.push(...current.allVariables());
      current = current.parent;
    }
    return visible;
  }
}

export default VariableTracker;