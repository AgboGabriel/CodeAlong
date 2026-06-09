
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState ,useCallback} from "react";
import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import Split from "react-split";
import { useLocation } from "react-router-dom";
import "./challenges.css";
import { buildLearnerFeedback } from "./learnerFeedback";

const LANGUAGES = [
  { id: 63, name: "JavaScript", monaco: "javascript" },
  { id: 71, name: "Python", monaco: "python" },
  { id: 62, name: "Java", monaco: "java" },
  { id: 54, name: "C++", monaco: "cpp" },
  { id: 50, name: "C", monaco: "c" },
  { id: 51, name: "C#", monaco: "csharp" },
  { id: 60, name: "Go", monaco: "go" },
  { id: 72, name: "Ruby", monaco: "ruby" },
  { id: 73, name: "Rust", monaco: "rust" },
];

const FALLBACK_TEMPLATES = {
  javascript: "// Write JavaScript here\n",
  python: "# Write Python here\n",
  java: "// Write Java code here\n",
  cpp: "// Write C++ code here\n",
  c: "// Write C code here\n",
  csharp: "// Write C# code here\n",
  go: "// Write Go code here\n",
  ruby: "# Write Ruby code here\n",
  rust: "// Write Rust code here\n",
};


export default function Challenges() {
const location = useLocation();
const moduleId = location.state?.moduleId;
const topic = location.state?.topic;

const [output, setOutput] = useState("");

const [tabs, setTabs] = useState([
  {
    id: 1,
    name: "Tab 1",
    language: LANGUAGES[0],
    code: FALLBACK_TEMPLATES.javascript,
  },
]);

const [activeTab, setActiveTab] = useState(1);

const currentTab = tabs.find(
  (tab) => tab.id === activeTab
);

const selectedLang =
  currentTab?.language || LANGUAGES[0];

const code = currentTab?.code || "";

const [challenge, setChallenge] = useState(null);
const [loading, setLoading] = useState(true);
const [submitSummary, setSubmitSummary] = useState(null);
const [astFeedback, setAstFeedback] = useState([]);
const [learnerFeedback, setLearnerFeedback] = useState(null);

const renderAstFeedback = astFeedback.map((item, index) => (
  <div
    key={`${item.code}-${index}`}
    className={`challenge-feedback ${item.level || "info"}`}
  >
    <strong>{item.code}</strong>
    <p>{item.message}</p>
  </div>
));

useEffect(() => {
  const fetchChallenge = async () => {
    if (!topic?.id) {
      setOutput("Topic context is missing for this challenge.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "/api/assessment/challenge",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topicId: topic.id,
            moduleId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Failed to load challenge"
        );
      }

      setChallenge(data.challenge);
    } catch (error) {
      console.error(
        "Failed to fetch challenge:",
        error
      );
      setOutput(
        error.message || "Unable to load challenge."
      );
    } finally {
      setLoading(false);
    }
  };

  fetchChallenge();
}, [moduleId, topic?.id]);

const activeTemplate = useMemo(() => {
  if (!challenge) {
    return (
      FALLBACK_TEMPLATES[selectedLang.monaco] || ""
    );
  }

  return (
    challenge.starterCodeByLanguage?.[
      selectedLang.monaco
    ] ||
    FALLBACK_TEMPLATES[selectedLang.monaco] ||
    ""
  );
}, [challenge, selectedLang.monaco]);

useEffect(() => {
  setTabs((prev) =>
    prev.map((tab) =>
      tab.id === activeTab
        ? {
            ...tab,
            code: activeTemplate,
          }
        : tab
    )
  );
}, [activeTemplate]);

const handleLanguageChange = (id) => {
  const lang = LANGUAGES.find(
    (entry) => entry.id === Number(id)
  );

  if (!lang) return;

  setTabs((prev) =>
    prev.map((tab) =>
      tab.id === activeTab
        ? {
            ...tab,
            language: lang,
            code:
              challenge?.starterCodeByLanguage?.[
                lang.monaco
              ] ||
              FALLBACK_TEMPLATES[lang.monaco] ||
              "",
          }
        : tab
    )
  );

  setOutput("");
  setSubmitSummary(null);
  setAstFeedback([]);
  setLearnerFeedback(null);
};

const handleRun = async () => {
  setOutput("Executing your code...");

  try {
    const response = await fetch(
      "/compile-poll",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_code: code,
          language_id: selectedLang.id,
          stdin:
            challenge?.publicTests?.[0]?.input ||
            "",
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setOutput(data.error || "Execution failed");
      return;
    }

    const result = data.data;

    setOutput(
      result.stdout ||
        result.stderr ||
        result.compile_output ||
        result.status?.description ||
        "No output"
    );
  } catch (error) {
    console.error("Execution error:", error);
    setOutput("Unable to connect to the server");
  }
};

const handleSubmit = async () => {
  if (!challenge) return;

  setOutput("Evaluating your solution...");
  setSubmitSummary(null);
  setAstFeedback([]);
  setLearnerFeedback(null);

  try {
    const [evaluationResponse, astResponse] =
      await Promise.all([
        fetch(
          "/api/assessment/challenge/evaluate",
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              source_code: code,
              language_id: selectedLang.id,
              test_cases: [
                ...challenge.publicTests,
                ...challenge.hiddenTests,
              ],
            }),
          }
        ),
        fetch("/api/ast/parse", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            source_code: code,
            language_id: selectedLang.id,
            analysis_options: {
              expectations:
                challenge.structuralExpectations ||
                {},
            },
          }),
        }),
      ]);

    const evaluationData =
      await evaluationResponse.json();

    const astData =
      await astResponse.json();

    if (
      !evaluationResponse.ok ||
      !evaluationData.success
    ) {
      throw new Error(
        evaluationData.error ||
          "Challenge evaluation failed"
      );
    }

    setSubmitSummary(
      evaluationData.evaluation
    );

    const diagnostics =
      astData.normalizedAst?.diagnostics ||
      [];

    setAstFeedback(diagnostics);

    const failedCase =
      evaluationData.evaluation.results.find(
        (result) => !result.passed
      );

    setLearnerFeedback(
      buildLearnerFeedback({
        compileOutput:
          failedCase?.compileOutput || "",
        stderr: failedCase?.stderr || "",
        ast:
          astData.normalizedAst?.ast || null,
        diagnostics,
        summary:
          astData.normalizedAst?.summary ||
          {},
        languageKey:
          selectedLang.monaco,
      })
    );

    setOutput(
      `Passed ${evaluationData.evaluation.passed} of ${evaluationData.evaluation.total} test cases.`
    );
  } catch (error) {
    console.error(
      "Challenge submission error:",
      error
    );

    setOutput(
      error.message ||
        "Unable to evaluate challenge"
    );
  }
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
          <button className="back-btn" onClick={() => window.history.back()}>
            Back
          </button>

          {loading ? (
            <div className="question-placeholder">Generating a topic-aligned challenge...</div>
          ) : challenge ? (
            <div className="question-placeholder">
              <div className="challenge-brief">
                <p className="challenge-eyebrow">Topic Challenge</p>
                <h2>{challenge.title}</h2>
                <p className="challenge-prompt">{challenge.prompt}</p>
              </div>

              {challenge.instructions?.length > 0 && (
                <section className="challenge-section">
                  <h3>Instructions</h3>
                  <ul className="challenge-list">
                    {challenge.instructions.map((instruction, index) => (
                      <li key={index}>{instruction}</li>
                    ))}
                  </ul>
                </section>
              )}

              {challenge.publicTests?.length > 0 && (
                <section className="challenge-section">
                  <h3>Public Tests</h3>
                  {challenge.publicTests.map((test) => (
                    <div key={test.id} className="challenge-test-card">
                      <strong>{test.id}</strong>
                      <p><span>Input</span> {test.input || "(empty)"}</p>
                      <p><span>Expected</span> {test.expectedOutput || "(empty)"}</p>
                      {test.explanation && <p>{test.explanation}</p>}
                    </div>
                  ))}
                </section>
              )}

              {submitSummary && (
                <section className="challenge-section">
                  <h3>Results</h3>
                  <p className="challenge-results-summary">
                    Passed {submitSummary.passed} of {submitSummary.total} tests.
                  </p>
                  {submitSummary.results.map((result) => (
                    <div key={result.id} className="challenge-test-card">
                      <strong>{result.id}</strong>
                      <p>{result.passed ? "Passed" : "Failed"}</p>
                      {!result.passed && (
                        <p>
                          <span>Expected</span> {result.expectedOutput || "(empty)"}
                          <br />
                          <span>Actual</span> {result.actualOutput || result.stderr || result.compileOutput || "no output"}
                        </p>
                      )}
                    </div>
                  ))}
                </section>
              )}

              {astFeedback.length > 0 && (
                <section className="challenge-section">
                  <h3>Structural Feedback</h3>
                  <div className="challenge-feedback-list">{renderAstFeedback}</div>
                </section>
              )}

              {learnerFeedback && (
                <section className="challenge-section">
                  <h3>Learner Guidance</h3>
                  {learnerFeedback.strengths?.length > 0 && (
                    <div className="challenge-feedback info">
                      <strong>What Looks Good</strong>
                      {learnerFeedback.strengths.map((item, index) => (
                        <p key={`strength-${index}`}>{item}</p>
                      ))}
                    </div>
                  )}
                  {learnerFeedback.nextSteps?.length > 0 && (
                    <div className="challenge-feedback warning">
                      <strong>What To Check Next</strong>
                      {learnerFeedback.nextSteps.map((item, index) => (
                        <p key={`next-${index}`}>{item}</p>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>
          ) : (
            <div className="question-placeholder">{output || "Problem description will appear here."}</div>
          )}
        </div>

        <div className="editor-panel">
          <div className="editor-header">
            <select value={selectedLang.id} onChange={(e) => handleLanguageChange(e.target.value)}>
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
      className={`tab-btn ${
        activeTab === tab.id ? "active-tab" : ""
      }`}
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

  <button
    className="add-tab-btn"
    onClick={handleAddTab}
  >
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
              ? {
                  ...tab,
                  code: value || "",
                }
              : tab
          )
        );
      }}
      options={{
        minimap: { enabled: false },
        fontSize: 18,
        lineHeight: 30,
        scrollBeyondLastLine: false,
        automaticLayout: true,
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
