# AST Implementation Outline

## Goal

Add structural code analysis to the backend so the system can inspect how a learner wrote a solution, not only whether Judge0 produced the correct runtime output.

## Fit With Current Project Structure

- `controllers`
  - Accept AST requests from the frontend.
  - Validate `source_code`, `language_id`, and optional `topic_id`.
  - Return normalized AST analysis responses.
- `services`
  - Resolve the supported language from the Judge0 language ID.
  - Call the parser adapter for that language.
  - Normalize parser output into one shared AST shape across all languages.
  - Run misconception detection rules later.
- `models`
  - Persist normalized AST analyses and diagnostics for later feedback and learner history.

## Files Added

- `src/controllers/astController.js`
- `src/services/ast.service.js`
- `src/services/astLanguageRegistry.js`
- `src/models/astModel.js`

## Recommended Parsing Strategy

Use one parser family across all supported languages to keep normalization consistent.

- JavaScript: `tree-sitter-javascript`
- Python: `tree-sitter-python`
- Java: `tree-sitter-java`
- C++: `tree-sitter-cpp`
- C: `tree-sitter-c`
- C#: `tree-sitter-c-sharp`
- Go: `tree-sitter-go`
- Ruby: `tree-sitter-ruby`
- Rust: `tree-sitter-rust`

The backend service now uses a dynamic Tree-sitter adapter. If the parser packages are installed, `/api/ast/parse` can return a real normalized AST. If the packages are missing, it returns a structured fallback response that tells you exactly which dependency is missing.

## Suggested Request Flow

1. Frontend sends `source_code` and `language_id` to `/api/ast/parse`.
2. Controller calls `astService.parseSource(...)`.
3. Service resolves the language from the registry.
4. Service calls a parser adapter for that language.
5. Service converts the language-specific tree into a normalized node structure.
6. Service runs generic and optional expectation-based structural rules.
7. Model optionally stores the analysis for topic review and future learner feedback.

## Optional Analysis Rules

`/api/ast/parse` now accepts optional `analysis_options` or `exercise_rules` in the request body. Example:

```json
{
  "source_code": "function solve(items) { for (const item of items) { if (item > 0) return item; } }",
  "language_id": 63,
  "analysis_options": {
    "expectations": {
      "requireFunction": true,
      "requireLoop": true,
      "requireConditional": true,
      "requireBranching": true,
      "minimumLoops": 1,
      "minimumConditionals": 1
    }
  }
}
```

This allows the AST layer to report issues such as:

- missing conditions
- missing loops
- weak branching logic
- wrongly placed `return`, `break`, or `continue`
- incomplete structural patterns

## Normalized AST Shape

Each node should eventually look like this:

```json
{
  "type": "IfStatement",
  "kind": "statement",
  "text": "if (x > 0)",
  "startPosition": { "line": 1, "column": 0 },
  "endPosition": { "line": 3, "column": 1 },
  "children": [],
  "metadata": {}
}
```

## Why Keep It Separate From Judge0 For Now

- Judge0 tells you whether code compiles and runs.
- AST tells you how the learner structured the solution.
- Keeping them separate for now lets you review the analysis design before execution feedback and structural feedback are merged.

## Current Status

- Real adapter architecture has been added.
- Normalized AST conversion has been added.
- Structural summary metrics have been added.
- Misconception signal placeholders have been added.
- Parser package installation is still required before full AST parsing works.

## Next Step After Review

Install the Tree-sitter runtime and grammar packages, then connect topic-specific structural rules and finally merge AST findings into your learner feedback flow.
