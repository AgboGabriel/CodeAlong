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
   * Find variables used before assignment
   */
  findUsedBeforeAssignment() {
    const issues = [];
    for (const scope of this.scopes) {
      for (const variable of scope.allVariables()) {
        if (!variable.declaration || variable.uses.length === 0) continue;

        // Check if first use comes before first assignment
        const firstUse = variable.uses[0];
        const firstAssignment = variable.assignments[0];

        if (firstUse && (!firstAssignment || 
            (firstUse.startLine < firstAssignment.startLine) ||
            (firstUse.startLine === firstAssignment.startLine && 
             firstUse.startColumn < firstAssignment.startColumn))) {
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
    for (const scope of this.scopes) {
      if (scope.type !== "loop") continue;
      for (const variable of scope.allVariables()) {
        const isAccumulator = this.isAccumulatorPattern(variable);
        const isCounter = this.isCounterPattern(variable);
        const isIndexing = this.isIndexingPattern(variable);
        
        if (isAccumulator || isCounter || isIndexing) {
          loopVars.push({
            name: variable.name,
            scope: scope.type,
            isAccumulator,
            isCounter,
            isIndexing,
            variable,
          });
        }
      }
    }
    return loopVars;
  }

  /**
   * Check if variable follows accumulator pattern (e.g., x += y)
   */
  isAccumulatorPattern(variable) {
    if (!variable.assignments) return false;
    return variable.assignments.some((a) => 
      a.operator && ["+=", "-=", "*=", "/=", "%="].includes(a.operator)
    );
  }

  /**
   * Check if variable follows counter pattern (e.g., i++, i += 1)
   */
  isCounterPattern(variable) {
    if (!variable.assignments) return false;
    return variable.assignments.some((a) =>
      a.operator === "+=" && a.value === 1 || 
      a.operator === "++/postfix"
    );
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
