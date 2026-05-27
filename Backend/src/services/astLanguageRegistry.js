const AST_LANGUAGE_REGISTRY = [
  {
    judge0Id: 63,
    name: "JavaScript (Node.js 12.14.0)",
    key: "javascript",
    extension: ".js",
    monacoLanguage: "javascript",
    parserEngine: "tree-sitter",
    parserPackage: "tree-sitter-javascript",
  },
  {
    judge0Id: 71,
    name: "Python (3.8.1)",
    key: "python",
    extension: ".py",
    monacoLanguage: "python",
    parserEngine: "tree-sitter",
    parserPackage: "tree-sitter-python",
  },
  {
    judge0Id: 62,
    name: "Java (OpenJDK 11.0.4)",
    key: "java",
    extension: ".java",
    monacoLanguage: "java",
    parserEngine: "tree-sitter",
    parserPackage: "tree-sitter-java",
  },
  {
    judge0Id: 54,
    name: "C++ (GCC 9.2.0)",
    key: "cpp",
    extension: ".cpp",
    monacoLanguage: "cpp",
    parserEngine: "tree-sitter",
    parserPackage: "tree-sitter-cpp",
  },
  {
    judge0Id: 50,
    name: "C (GCC 9.2.0)",
    key: "c",
    extension: ".c",
    monacoLanguage: "c",
    parserEngine: "tree-sitter",
    parserPackage: "tree-sitter-c",
  },
  {
    judge0Id: 51,
    name: "C# (Mono 6.6.0.161)",
    key: "csharp",
    extension: ".cs",
    monacoLanguage: "csharp",
    parserEngine: "tree-sitter",
    parserPackage: "tree-sitter-c-sharp",
  },
  {
    judge0Id: 60,
    name: "Go (1.13.5)",
    key: "go",
    extension: ".go",
    monacoLanguage: "go",
    parserEngine: "tree-sitter",
    parserPackage: "tree-sitter-go",
  },
  {
    judge0Id: 72,
    name: "Ruby (2.7.0)",
    key: "ruby",
    extension: ".rb",
    monacoLanguage: "ruby",
    parserEngine: "tree-sitter",
    parserPackage: "tree-sitter-ruby",
  },
  {
    judge0Id: 73,
    name: "Rust (1.40.0)",
    key: "rust",
    extension: ".rs",
    monacoLanguage: "rust",
    parserEngine: "tree-sitter",
    parserPackage: "tree-sitter-rust",
  },
];

export function getAstLanguages() {
  return AST_LANGUAGE_REGISTRY;
}

export function getAstLanguageByJudge0Id(languageId) {
  return AST_LANGUAGE_REGISTRY.find(
    (language) => language.judge0Id === Number(languageId)
  );
}

export default AST_LANGUAGE_REGISTRY;
