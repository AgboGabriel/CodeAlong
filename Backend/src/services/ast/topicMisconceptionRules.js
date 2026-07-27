/**
 * Topic-Specific Misconception Rules
 * Maps learning topics to common misconceptions and provides targeted feedback
 */

class TopicMisconceptionRules {
  constructor(topicTitle = "", languageKey = "") {
    this.topicTitle = topicTitle.toLowerCase();
    this.languageKey = languageKey.toLowerCase();
    this.misconceptionRules = this.initializeRules();
  }

  initializeRules() {
    return {
      // Loop-related topics
      "loops": this.createLoopMisconceptions(),
      "for loop": this.createForLoopMisconceptions(),
      "while loop": this.createWhileLoopMisconceptions(),
      "iteration": this.createIterationMisconceptions(),
      "array iteration": this.createArrayIterationMisconceptions(),

      // Array/List topics
      "array": this.createArrayMisconceptions(),
      "list": this.createListMisconceptions(),
      "indexing": this.createIndexingMisconceptions(),
      "array manipulation": this.createArrayManipulationMisconceptions(),

      // Conditional topics
      "if statement": this.createIfStatementMisconceptions(),
      "conditionals": this.createConditionalMisconceptions(),
      "switch statement": this.createSwitchMisconceptions(),

      // Function topics
      "function": this.createFunctionMisconceptions(),
      "function parameters": this.createParameterMisconceptions(),
      "return statement": this.createReturnMisconceptions(),
      "recursion": this.createRecursionMisconceptions(),

      // Variable topics
      "variable": this.createVariableMisconceptions(),
      "scope": this.createScopeMisconceptions(),
      "global variable": this.createGlobalVariableMisconceptions(),

      // Operator topics
      "operator": this.createOperatorMisconceptions(),
      "assignment": this.createAssignmentMisconceptions(),
      "comparison": this.createComparisonMisconceptions(),

      // String topics
      "string": this.createStringMisconceptions(),
      "string manipulation": this.createStringManipulationMisconceptions(),
    };
  }

  createLoopMisconceptions() {
    return [
      {
        pattern: "off_by_one",
        description: "Loop condition uses <= instead of <, or starts at wrong index",
        expectedSignals: ["OFF_BY_ONE_POTENTIAL", "LOOP_START_INDEX_WARNING"],
        feedback: "Check your loop bounds. Using <= with array.length or starting at 1 can cause off-by-one errors.",
        hints: [
          "Arrays are 0-indexed, so start with i = 0",
          "Use i < array.length for the condition, not <=",
          "Count carefully when using 1-based indices",
        ],
      },
      {
        pattern: "infinite_loop",
        description: "Loop has no proper termination condition",
        expectedSignals: ["INFINITE_LOOP_DETECTED"],
        feedback: "Your loop may be infinite. Ensure the condition will eventually be false.",
        hints: [
          "Make sure the loop variable changes in each iteration",
          "Verify the termination condition will eventually be met",
          "Add a break statement if using while(true)",
        ],
      },
      {
        pattern: "loop_control_outside",
        description: "Break or continue used outside a loop",
        expectedSignals: ["MISPLACED_LOOP_CONTROL"],
        feedback: "Break and continue can only be used inside loops.",
        hints: [
          "Move the break/continue inside the loop",
          "Check your code indentation and nesting",
        ],
      },
      {
        pattern: "no_increment",
        description: "Loop variable doesn't change, leading to infinite loop",
        expectedSignals: ["LOOP_NO_INCREMENT"],
        feedback: "Your loop variable isn't changing. Add i++ or similar.",
        hints: [
          "Each iteration should move closer to the termination condition",
          "For counting loops, use i++, i--, or similar",
        ],
      },
    ];
  }

  createForLoopMisconceptions() {
    return [
      {
        pattern: "incorrect_syntax",
        description: "For loop syntax is incorrect (missing parts)",
        expectedSignals: ["LOOP_NO_INCREMENT", "EXPECTED_LOOP_MISSING"],
        feedback: "Check your for loop syntax: for (init; condition; update) {}",
        hints: [
          "for loops need three parts separated by semicolons",
          "Init: set starting value (e.g., i = 0)",
          "Condition: check when to stop (e.g., i < 10)",
          "Update: change variable each iteration (e.g., i++)",
        ],
      },
      {
        pattern: "updating_wrong_variable",
        description: "Update expression modifies wrong variable or nothing",
        expectedSignals: ["LOOP_NO_INCREMENT"],
        feedback: "Make sure you're updating the correct loop variable.",
        hints: [
          "The update part usually modifies the same variable as init",
          "Common updates: i++, i--, i+=2",
        ],
      },
    ];
  }

  createWhileLoopMisconceptions() {
    return [
      {
        pattern: "infinite_loop_true",
        description: "while(true) without proper break",
        expectedSignals: ["INFINITE_LOOP_DETECTED"],
        feedback: "while(true) loops must have a break statement to exit.",
        hints: [
          "Include a break statement inside the loop",
          "Or use a proper condition like while(x < 10)",
        ],
      },
      {
        pattern: "condition_never_changes",
        description: "Loop condition depends on variable never modified",
        expectedSignals: ["LOOP_NO_INCREMENT"],
        feedback: "The condition in while(...) references a variable that never changes.",
        hints: [
          "Update the variable inside the loop",
          "Make sure the loop makes progress toward termination",
        ],
      },
    ];
  }

  createIterationMisconceptions() {
    return [
      {
        pattern: "not_using_loop",
        description: "Repeated code instead of using a loop",
        expectedSignals: ["EXPECTED_LOOP_MISSING"],
        feedback: "This looks like repetitive code. Consider using a loop instead.",
        hints: [
          "If you're writing similar code multiple times, use a loop",
          "Loops reduce errors and make code more maintainable",
        ],
      },
    ];
  }

  createArrayIterationMisconceptions() {
    return [
      {
        pattern: "hardcoded_length",
        description: "Using hardcoded number instead of array.length",
        expectedSignals: ["OFF_BY_ONE_POTENTIAL"],
        feedback: "Use array.length instead of hardcoding the array size.",
        hints: [
          "This makes your code work with any size array",
          "If you hardcode and change the array, you might miss elements",
        ],
      },
      {
        pattern: "modifying_while_iterating",
        description: "Modifying array size during iteration",
        expectedSignals: ["LOOP_NO_INCREMENT"],
        feedback: "Avoid adding/removing from an array while looping through it.",
        hints: [
          "Create a new array or use a different approach",
          "Modifying during iteration can skip elements or cause errors",
        ],
      },
    ];
  }

  createArrayMisconceptions() {
    return [
      {
        pattern: "off_by_one_indexing",
        description: "Using wrong array index (0 vs 1 based)",
        expectedSignals: ["OFF_BY_ONE_POTENTIAL", "LOOP_START_INDEX_WARNING"],
        feedback: "Arrays are 0-indexed. The first element is at index 0, not 1.",
        hints: [
          "arr[0] is the first element",
          "arr.length is one MORE than the last valid index",
          "Valid indices: 0 to length-1",
        ],
      },
      {
        pattern: "out_of_bounds",
        description: "Accessing invalid array index",
        expectedSignals: ["LOOP_START_INDEX_WARNING"],
        feedback: "Accessing arr[length] or arr[length+1] is out of bounds.",
        hints: [
          "Highest valid index is length - 1",
          "Check your loop condition: use < length, not <= length",
        ],
      },
      {
        pattern: "empty_array_iteration",
        description: "Not handling empty arrays",
        expectedSignals: ["EXPECTED_CONDITIONAL_MISSING"],
        feedback: "Check for empty arrays before iterating.",
        hints: [
          "Use if (arr.length > 0) before accessing elements",
          "Or handle the empty case in your loop logic",
        ],
      },
    ];
  }

  createListMisconceptions() {
    return [
      {
        pattern: "list_vs_array",
        description: "Confusion between arrays and lists (Python, etc)",
        expectedSignals: [],
        feedback: "In this language, lists and arrays work similarly. Check your syntax.",
        hints: [
          "Learn the specific list operations for your language",
          "Common operations: append, remove, insert, pop",
        ],
      },
    ];
  }

  createIndexingMisconceptions() {
    return [
      {
        pattern: "negative_indexing_not_supported",
        description: "Using negative indices in language that doesn't support them",
        expectedSignals: ["POSSIBLE_UNDECLARED_IDENTIFIER"],
        feedback: "Some languages don't support negative indexing.",
        hints: [
          "Check if your language supports arr[-1] for last element",
          "If not, use arr[arr.length - 1] instead",
        ],
      },
    ];
  }

  createArrayManipulationMisconceptions() {
    return [
      {
        pattern: "incorrect_sort",
        description: "Sorting without understanding the impact",
        expectedSignals: [],
        feedback: "Sorting changes the original order of elements.",
        hints: [
          "Copy the array before sorting if you need the original",
          "Or create a new sorted array",
        ],
      },
    ];
  }

  createIfStatementMisconceptions() {
    return [
      {
        pattern: "assignment_in_condition",
        description: "Using = instead of == in condition",
        expectedSignals: ["ASSIGNMENT_IN_CONDITION"],
        feedback: "Use == to compare, not = (which assigns). Use if(x == 5), not if(x = 5).",
        hints: [
          "== checks if two values are equal",
          "= assigns a value to a variable",
          "Single = in a condition is almost always a mistake",
        ],
      },
      {
        pattern: "missing_else",
        description: "Not handling all cases",
        expectedSignals: ["EXPECTED_BRANCHING_WEAK"],
        feedback: "Consider adding an else branch to handle all cases.",
        hints: [
          "if-else covers true and false cases",
          "Make sure your logic is complete",
        ],
      },
      {
        pattern: "nested_conditionals",
        description: "Too much nesting makes code hard to understand",
        expectedSignals: [],
        feedback: "Your nested ifs are getting deep. Consider refactoring.",
        hints: [
          "Use logical operators (&&, ||) to simplify",
          "Or extract into a helper function",
        ],
      },
    ];
  }

  createConditionalMisconceptions() {
    return [
      {
        pattern: "comparison_operator_confusion",
        description: "Using wrong comparison operator",
        expectedSignals: [],
        feedback: "Check your comparison: <, >, <=, >=, ==, !=",
        hints: [
          "< means strictly less than (not including equal)",
          "<= means less than or equal",
          "Choose based on your logic",
        ],
      },
    ];
  }

  createSwitchMisconceptions() {
    return [
      {
        pattern: "missing_break",
        description: "Forgetting break statements in switch",
        expectedSignals: ["MISPLACED_LOOP_CONTROL"],
        feedback: "Add break; after each case to prevent fall-through.",
        hints: [
          "Without break, execution continues to the next case",
          "Use break; or return; to exit the switch",
        ],
      },
      {
        pattern: "missing_default",
        description: "No default case for unexpected values",
        expectedSignals: ["EXPECTED_BRANCHING_WEAK"],
        feedback: "Add a default case to handle unexpected switch values.",
        hints: [
          "default: runs if no cases match",
          "Good practice to handle unexpected inputs",
        ],
      },
    ];
  }

  createFunctionMisconceptions() {
    return [
      {
        pattern: "missing_return",
        description: "Function doesn't return a value when it should",
        expectedSignals: ["MISSING_RETURN_STATEMENT"],
        feedback: "Add a return statement to send a value back.",
        hints: [
          "return value; exits the function and gives back the value",
          "Without return, the function gives back undefined/null",
        ],
      },
      {
        pattern: "code_after_return",
        description: "Unreachable code after return",
        expectedSignals: [],
        feedback: "Code after return is never executed.",
        hints: [
          "Remove or move code before the return",
          "Or put it in a different code path",
        ],
      },
    ];
  }

  createParameterMisconceptions() {
    return [
      {
        pattern: "parameter_mismatch",
        description: "Calling function with wrong number of arguments",
        expectedSignals: ["POSSIBLE_UNDECLARED_IDENTIFIER"],
        feedback: "Check the function definition for the right number of parameters.",
        hints: [
          "Count the parameters in the function definition",
          "Pass the same number of arguments when calling",
        ],
      },
    ];
  }

  createReturnMisconceptions() {
    return [
      {
        pattern: "return_in_wrong_place",
        description: "Return statement outside a function",
        expectedSignals: ["MISPLACED_RETURN_STATEMENT"],
        feedback: "Return can only be used inside a function.",
        hints: [
          "Move the return inside the function",
          "Check your code structure and indentation",
        ],
      },
    ];
  }

  createRecursionMisconceptions() {
    return [
      {
        pattern: "no_base_case",
        description: "Recursion has no base case, causing infinite recursion",
        expectedSignals: ["EXPECTED_CONDITIONAL_MISSING"],
        feedback: "Recursive functions need a base case to stop recursing.",
        hints: [
          "Base case: the simplest input that stops recursion",
          "Always check for the base case before recursing",
          "Example: if (n <= 0) return value;",
        ],
      },
      {
        pattern: "infinite_recursion",
        description: "Recursive call doesn't move toward base case",
        expectedSignals: [],
        feedback: "Each recursive call should make progress toward the base case.",
        hints: [
          "Verify the function makes progress (e.g., n-1)",
          "Eventually, the base case condition must be true",
        ],
      },
    ];
  }

  createVariableMisconceptions() {
    return [
      {
        pattern: "used_before_declaration",
        description: "Using a variable before it's declared",
        expectedSignals: ["USED_BEFORE_ASSIGNMENT"],
        feedback: "Declare variables before using them.",
        hints: [
          "Move the declaration before the use",
          "Or initialize with a default value",
        ],
      },
      {
        pattern: "unused_variable",
        description: "Variable is declared but never used",
        expectedSignals: ["UNUSED_VARIABLE"],
        feedback: "Remove unused variables to clean up code.",
        hints: [
          "Check if you meant to use it somewhere",
          "Delete it if it's truly not needed",
        ],
      },
      {
        pattern: "variable_shadowing",
        description: "Inner scope redefines outer scope variable",
        expectedSignals: [],
        feedback: "Avoid redefining variables from outer scopes.",
        hints: [
          "Use different names to avoid confusion",
          "Or explicitly use the outer variable",
        ],
      },
    ];
  }

  createScopeMisconceptions() {
    return [
      {
        pattern: "scope_confusion",
        description: "Using variable outside its scope",
        expectedSignals: ["POSSIBLE_UNDECLARED_IDENTIFIER"],
        feedback: "Variables declared in a block are only visible in that block.",
        hints: [
          "Declare variables in the broadest scope where needed",
          "Or pass them as function parameters",
        ],
      },
    ];
  }

  createGlobalVariableMisconceptions() {
    return [
      {
        pattern: "global_overuse",
        description: "Too many global variables",
        expectedSignals: [],
        feedback: "Minimize global variables. Use function parameters instead.",
        hints: [
          "Globals make code hard to understand and maintain",
          "Pass variables as parameters to functions",
          "Use return values to send data back",
        ],
      },
    ];
  }

  createOperatorMisconceptions() {
    return [
      {
        pattern: "operator_precedence",
        description: "Wrong assumption about operator precedence",
        expectedSignals: [],
        feedback: "Check operator precedence and use parentheses for clarity.",
        hints: [
          "* and / before + and -",
          "Use parentheses when in doubt",
          "Example: x + y * z is not the same as (x + y) * z",
        ],
      },
    ];
  }

  createAssignmentMisconceptions() {
    return [
      {
        pattern: "assignment_vs_comparison",
        description: "Confusing = (assign) with == (compare)",
        expectedSignals: ["ASSIGNMENT_IN_CONDITION"],
        feedback: "Use = for assignment, == for comparison.",
        hints: [
          "x = 5: assigns 5 to x",
          "x == 5: checks if x equals 5",
          "In conditions, use ==, not =",
        ],
      },
    ];
  }

  createComparisonMisconceptions() {
    return [
      {
        pattern: "string_comparison",
        description: "Comparing strings incorrectly",
        expectedSignals: [],
        feedback: "Use == or .equals() to compare strings, not comparisons like <.",
        hints: [
          "In many languages, == checks string content",
          "Some languages need .equals() method",
          "< and > don't make sense for string comparison",
        ],
      },
    ];
  }

  createStringMisconceptions() {
    return [
      {
        pattern: "string_indexing",
        description: "Treating string as array incorrectly",
        expectedSignals: ["POSSIBLE_UNDECLARED_IDENTIFIER"],
        feedback: "Strings can often be indexed like arrays, but check your language.",
        hints: [
          "str[0] is the first character in many languages",
          "str[str.length - 1] is the last character",
          "Be careful with string immutability rules",
        ],
      },
    ];
  }

  createStringManipulationMisconceptions() {
    return [
      {
        pattern: "immutable_string",
        description: "Trying to modify string directly (in immutable language)",
        expectedSignals: [],
        feedback: "Strings are immutable in this language. Use string methods instead.",
        hints: [
          "Use .replace(), .substring(), or similar methods",
          "These return new strings; they don't modify the original",
        ],
      },
    ];
  }

  /**
   * Get misconception rules for a topic
   */
  getRulesForTopic(topicTitle) {
    const key = (topicTitle || "").toLowerCase();
    for (const [topicKey, rules] of Object.entries(this.misconceptionRules)) {
      if (key.includes(topicKey) || topicKey.includes(key)) {
        return rules;
      }
    }
    return [];
  }

  /**
   * Evaluate diagnostics against topic-specific rules
   */
  evaluateMisconceptions(diagnostics, topicTitle) {
    const rules = this.getRulesForTopic(topicTitle);
    const identifiedMisconceptions = [];

    for (const rule of rules) {
      for (const signal of rule.expectedSignals) {
        if (diagnostics.some((d) => d.code === signal)) {
          identifiedMisconceptions.push({
            pattern: rule.pattern,
            description: rule.description,
            feedback: rule.feedback,
            hints: rule.hints,
            relatedSignals: rule.expectedSignals.filter((s) =>
              diagnostics.some((d) => d.code === s)
            ),
          });
          break; // Don't repeat the same misconception
        }
      }
    }

    return identifiedMisconceptions;
  }
}

export default TopicMisconceptionRules;
