import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
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
  const navigate = useNavigate();
  const [output, setOutput] = useState("");
  const [tabs, setTabs] = useState([
    {
      id: 1,
      name: "Tab 1",
      language: LANGUAGES[0],
      code: CODE_TEMPLATES.javascript
    }
  ]);

  const [activeTab, setActiveTab] = useState(1);

    const currentTab = tabs.find(
    (tab) => tab.id === activeTab
  );

  const selectedLang =
    currentTab?.language || LANGUAGES[0];

  const handleLanguageChange = (id) => {
  const lang = LANGUAGES.find(
    (l) => l.id === Number(id)
  );

  if (!lang) return;

  setTabs((prev) =>
    prev.map((tab) =>
      tab.id === activeTab
        ? {
            ...tab,
            language: lang,
            code: CODE_TEMPLATES[lang.monaco]
          }
        : tab
    )
  );

  setOutput("");
};

  const handleSubmit = () => {
  setOutput("Your code has been submitted for evaluation...");
    
  };
  const handleRun = () => {
  const code = currentTab?.code || "";

  setOutput(`Running...\n\n${code}`);
};

const handleAddTab = () => {
  const newTab = {
    id: Date.now(),
    name: `Tab ${tabs.length + 1}`,
    language: LANGUAGES[0],
    code: CODE_TEMPLATES.javascript
  };

  setTabs((prev) => [...prev, newTab]);
  setActiveTab(newTab.id);
};
const handleDeleteTab = (tabId) => {
  setTabs((prev) => {
    const updated = prev.filter((tab) => tab.id !== tabId);

    
    if (activeTab === tabId && updated.length > 0) {
      setActiveTab(updated[0].id);
    }

    return updated;
  });
};
  /* ================= MONACO ================= */
  const handleEditorBeforeMount = useCallback((monacoInstance) => {
    monacoInstance.editor.defineTheme("custom-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#0f172a",
        "editorSuggestWidget.background": "#0f172a",
        "editorSuggestWidget.foreground": "#e2e8f0",
        "editorSuggestWidget.selectedBackground": "#2563eb",
        "editorSuggestWidget.border": "#334155",
        "editorSuggestWidget.highlightForeground": "#60a5fa",
      },
    });
  }, []);


  return (
    <div className="challenge-container">
      <Split
        className="challenge-layout"
        sizes={[35,65]}
        minSize={120}
        gutterSize={6}
      >
        {/* LEFT: Question Panel */}
        <div className="question-panel">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
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

                    <div className="editor-tabs">
                      {tabs.map((tab) => (
                        <div
                          key={tab.id}
                          className={`tab-btn ${activeTab === tab.id ? "active-tab" : ""}`}
                          onClick={() => setActiveTab(tab.id)}
                        >
                          <span className="tab-name">{tab.name}</span>

                          <button
                            className="tab-close"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTab(tab.id);
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}

                      <button className="add-tab-btn" onClick={handleAddTab}>
                        +
                      </button>
                    </div>
          </div>

              <Split
                direction="vertical"
                className="editor-terminal-split"
                sizes={[75, 25]}
                minSize={[250, 100]}
                gutterSize={6}
              >


                <div className="editor-wrapper">
                  <Editor
                    height="100%"
                    theme="custom-dark"
                    beforeMount={handleEditorBeforeMount}
                    language={selectedLang.monaco}
                    value={currentTab?.code || ""}
                    onChange={(value) => {
                      setTabs((prev) =>
                        prev.map((tab) =>
                          tab.id === activeTab
                            ? { ...tab, code: value || "" }
                            : tab
                        )
                      );
                    }}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 18,
                      lineHeight: 30,
                      scrollBeyondLastLine: false,
                      automaticLayout: true
                    }}
                  />
                </div>

                <div className="output-panel">
                  {output || "Run your code to see output here."}
                </div>
              </Split>
        </div>
      </Split>
    </div>
  );
}