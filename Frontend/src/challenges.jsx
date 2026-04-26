import { useState } from "react";
import Editor from "@monaco-editor/react";
import Split from "react-split";
import "./challenges.css";

// Language configuration
const LANGUAGES = [
  { id: 63, name: "JavaScript", monaco: "javascript" },
  { id: 71, name: "Python", monaco: "python" },
  { id: 62, name: "Java", monaco: "java" },
  { id: 54, name: "C++", monaco: "cpp" },
  { id: 50, name: "C", monaco: "c" },
  { id: 51, name: "C#", monaco: "csharp" },
  { id: 60, name: "Go", monaco: "go" },
  { id: 72, name: "Ruby", monaco: "ruby" },
  { id: 73, name: "Rust", monaco: "rust" }
];

// Starter templates
const CODE_TEMPLATES = {
  javascript: "// Write JavaScript here\n",
  python: "# Write Python here\n",
  java: "// Write Java code here\n",
  cpp: "// Write C++ code here\n",
  c: "// Write C code here\n",
  csharp: "// Write C# code here\n",
  go: "// Write Go code here\n",
  ruby: "# Write Ruby code here\n",
  rust: "// Write Rust code here\n"
};

export default function Challenges() {
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [code, setCode] = useState(
    CODE_TEMPLATES[LANGUAGES[0].monaco]
  );
  const [output, setOutput] = useState("");

  // Handle language switch
  const handleLanguageChange = (id) => {
    const lang = LANGUAGES.find((l) => l.id === Number(id));
    setSelectedLang(lang);
    setCode(CODE_TEMPLATES[lang.monaco] || "");
    setOutput("");
  };

  // Handle code execution (placeholder)
  const handleRun = () => {
    setOutput("Execution engine not connected yet.");
  };

  const handleSubmit = () => {
  // Replace this with your backend call later
  setOutput("Your code has been submitted for evaluation...");
};

  return (
    <div className="challenge-container">
      <Split
        className="challenge-layout"
        sizes={[40, 60]}
        minSize={120}
        gutterSize={6}
      >
        {/* LEFT: Question Panel */}
        <div className="question-panel">
          <h3>Question</h3>
          <div className="question-placeholder">
            Problem description will appear here.
          </div>
        </div>

        {/* RIGHT: Editor Panel */}
        <div className="editor-panel">
          <div className="editor-header">
            <select
              value={selectedLang.id}
              onChange={(e) => handleLanguageChange(e.target.value)}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>

            <div className="editor-actions">
          <button className="run-btn" onClick={handleRun}>
            Run
          </button>

          <button className="submit-btn" onClick={handleSubmit}>
            Submit
          </button>
        </div>
          </div>

          <div className="editor-wrapper">
            <Editor
              height="100%"
              theme="vs-dark"
              language={selectedLang.monaco}
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 16,
                lineHeight: 24,
                scrollBeyondLastLine: false,
                automaticLayout: true
              }}
            />
          </div>

          <div className="output-panel">
            {output || "Run your code to see output here."}
          </div>
        </div>
      </Split>
    </div>
  );
}