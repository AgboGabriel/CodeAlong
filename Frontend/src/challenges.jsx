//updated one
import { useEffect, useMemo, useState, useCallback } from "react";
import Editor from "@monaco-editor/react";
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
/* ================= HINT MODAL (same pattern as Videolesson) ================= */
function HintModal({ open, onClose, loading, feedback, error }) {
  if (!open) return null;

  return (
    <div
      className="hint-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="hint-modal" onClick={(e) => e.stopPropagation()}>
        <div className="hint-modal-header">
          <div>
            <p className="hint-eyebrow">Code Insight</p>
            <h2>What your code is doing</h2>
          </div>
          <button className="hint-close-btn" onClick={onClose}>✕</button>
        </div>

        {loading && (
          <div className="hint-state">
            <div className="hint-spinner" />
            <span>Reading your workspace…</span>
          </div>
        )}

        {!loading && error && (
          <div className="hint-state hint-error">
            <span className="hint-state-icon">⚠</span>
            {error}
          </div>
        )}

        {!loading && !error && !feedback && (
          <div className="hint-state">
            <span className="hint-state-icon">✏️</span>
            Write some code first, then click Hint.
          </div>
        )}

        {!loading && !error && feedback && (
          <div className="hint-content">
            {feedback.intent?.length > 0 && (
              <section className="hint-section">
                <div className="hint-section-label">
                  <span className="hint-dot hint-dot--blue" />
                  What you were trying to do
                </div>
                <ul className="hint-list">
                  {feedback.intent.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </section>
            )}
            {feedback.strengths?.length > 0 && (
              <section className="hint-section">
                <div className="hint-section-label">
                  <span className="hint-dot hint-dot--green" />
                  What you did
                </div>
                <ul className="hint-list">
                  {feedback.strengths.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </section>
            )}
            {feedback.problems?.length > 0 && (
              <section className="hint-section">
                <div className="hint-section-label">
                  <span className="hint-dot hint-dot--amber" />
                  What to check
                </div>
                <ul className="hint-list">
                  {feedback.problems.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </section>
            )}
            {feedback.fixes?.length > 0 && (
              <section className="hint-section">
                <div className="hint-section-label">
                  <span className="hint-dot hint-dot--purple" />
                  What to add to make it work
                </div>
                <ul className="hint-list hint-list--fixes">
                  {feedback.fixes.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </section>
            )}
            {feedback.crossTabNote && (
              <div className="hint-cross-tab-note">
                <span className="hint-cross-tab-icon">⇄</span>
                {feedback.crossTabNote}
              </div>
            )}
            {!feedback.intent?.length && !feedback.strengths?.length &&
             !feedback.problems?.length && !feedback.fixes?.length && (
              <div className="hint-state">
                No structural issues detected — your code looks well-formed.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}



/* ================= MAIN COMPONENT ================= */
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

  const currentTab = tabs.find((tab) => tab.id === activeTab);
  const selectedLang = currentTab?.language || LANGUAGES[0];
  const code = currentTab?.code || "";

  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitSummary, setSubmitSummary] = useState(null);

  // Hint state — inline panel, no modal
  const [hintLoading, setHintLoading] = useState(false);
  const [hintFeedback, setHintFeedback] = useState(null);
  const [hintError, setHintError] = useState("");
  const [hintOpen, setHintOpen] = useState(false);

  // Legacy diagnostics for submit flow (kept separate from hint)
  const [astFeedback, setAstFeedback] = useState([]);
  const [learnerFeedback, setLearnerFeedback] = useState(null);

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

  /* ================= FETCH CHALLENGE ================= */
  useEffect(() => {
    const fetchChallenge = async () => {
      if (!topic?.id) {
        setOutput("Topic context is missing for this challenge.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const response = await fetch("/api/assessment/challenge", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topicId: topic.id, moduleId }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to load challenge");
        }

        setChallenge(data.challenge);
      } catch (error) {
        console.error("Failed to fetch challenge:", error);
        setOutput(error.message || "Unable to load challenge.");
      } finally {
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [moduleId, topic?.id]);

  /* ================= STARTER CODE ================= */
  const activeTemplate = useMemo(() => {
    if (!challenge) return FALLBACK_TEMPLATES[selectedLang.monaco] || "";
    return (
      challenge.starterCodeByLanguage?.[selectedLang.monaco] ||
      FALLBACK_TEMPLATES[selectedLang.monaco] ||
      ""
    );
  }, [challenge, selectedLang.monaco]);

  useEffect(() => {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTab ? { ...tab, code: activeTemplate } : tab
      )
    );
  }, [activeTemplate, activeTab]);

  /* ================= LANGUAGE CHANGE ================= */
  const handleLanguageChange = (id) => {
    const lang = LANGUAGES.find((entry) => entry.id === Number(id));
    if (!lang) return;

    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTab
          ? {
              ...tab,
              language: lang,
              code:
                challenge?.starterCodeByLanguage?.[lang.monaco] ||
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
    setHintFeedback(null);
    setHintError("");
    setHintOpen(false);
  };

  /* ================= RUN ================= */
  const handleRun = async () => {
    setOutput("Executing your code...");

    try {
      const response = await fetch("/compile-poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_code: code,
          language_id: selectedLang.id,
          stdin: challenge?.publicTests?.[0]?.input || "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setOutput(data.error || "Execution failed");
        return;
      }

      setOutput(
        data.data?.stdout ||
          data.data?.stderr ||
          data.data?.compile_output ||
          data.data?.status?.description ||
          "No output"
      );
    } catch (error) {
      console.error("Execution error:", error);
      setOutput("Unable to connect to the server");
    }
  };

  /* ================= HINT ================= */
  const handleHint = useCallback(async () => {
    const nonEmptyTabs = tabs.filter((tab) => tab.code?.trim().length > 0);

    if (nonEmptyTabs.length === 0) {
      setHintError("Write some code first before asking for a hint.");
      setHintFeedback(null);
      setHintOpen(true);
      return;
    }

    setHintOpen(true);
    setHintLoading(true);
    setHintFeedback(null);
    setHintError("");

    try {
      const response = await fetch("/api/ast/workspace/parse", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tabs: tabs.map((tab) => ({
            tab_id: tab.id,
            name: tab.name,
            source_code: tab.code || "",
            language_id: tab.language.id,
          })),
          topic_id: topic?.id || null,
          topic_title: topic?.title || "",
          analysis_options: {
            expectations: challenge?.structuralExpectations || {},
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Analysis failed");
      }

      const workspaceFeedback = data.workspace?.feedback || {};
      const activeTabResult = data.tabs?.find((t) => t.tabId === activeTab);

      const localFeedback = buildLearnerFeedback({
        compileOutput: "",
        stderr: "",
        diagnostics: activeTabResult?.diagnostics || [],
        summary: activeTabResult?.normalizedAst?.summary || {},
        ast: activeTabResult?.normalizedAst?.ast || null,
        languageKey: selectedLang.monaco,
      });

      setHintFeedback({
        intent: localFeedback.intent?.length
          ? localFeedback.intent
          : workspaceFeedback.summary
          ? [workspaceFeedback.summary]
          : [],

        strengths: workspaceFeedback.strengths?.length
          ? workspaceFeedback.strengths.map((s) => s.message)
          : localFeedback.strengths || [],

        problems: [
          ...(localFeedback.problems || []),
          ...(workspaceFeedback.gaps?.map((g) => g.message) || []),
        ].filter(Boolean),

        fixes: [
          ...(localFeedback.fixes || []),
          ...(workspaceFeedback.suggestions?.map((s) => s.message) || []),
        ].filter(Boolean),

        crossTabNote: tabs.length > 1 ? workspaceFeedback.crossTabNote : null,
      });
    } catch (error) {
      console.error("Hint error:", error);
      setHintError(
        error.message || "Could not analyze your workspace. Try again in a moment."
      );
    } finally {
      setHintLoading(false);
    }
  }, [tabs, activeTab, selectedLang.monaco, topic, challenge]);

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!challenge) return;

    setOutput("Evaluating your solution...");
    setSubmitSummary(null);
    setAstFeedback([]);
    setLearnerFeedback(null);
    // Clear hint on new submission
    setHintOpen(false);
    setHintFeedback(null);

    try {
      const [evaluationResponse, astResponse] = await Promise.all([
        fetch("/api/assessment/challenge/evaluate", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: null,
            challengeId: challenge?.id,
            topicId: topic?.id,
            moduleId,
            curriculumId: topic?.curriculumId || null,
            source_code: code,
            language_id: selectedLang.id,
            test_cases: [...challenge.publicTests, ...challenge.hiddenTests],
          }),
        }),
        fetch("/api/ast/parse", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source_code: code,
            language_id: selectedLang.id,
            analysis_options: {
              expectations: challenge.structuralExpectations || {},
            },
          }),
        }),
      ]);

      const evaluationData = await evaluationResponse.json();
      const astData = await astResponse.json();

      if (!evaluationResponse.ok || !evaluationData.success) {
        throw new Error(evaluationData.error || "Challenge evaluation failed");
      }

      setSubmitSummary(evaluationData.evaluation);

      const diagnostics = astData.normalizedAst?.diagnostics || [];
      setAstFeedback(diagnostics);

      const failedCase = evaluationData.evaluation.results.find(
        (result) => !result.passed
      );

      setLearnerFeedback(
        buildLearnerFeedback({
          compileOutput: failedCase?.compileOutput || "",
          stderr: failedCase?.stderr || "",
          ast: astData.normalizedAst?.ast || null,
          diagnostics,
          summary: astData.normalizedAst?.summary || {},
          languageKey: selectedLang.monaco,
        })
      );

      setOutput(
        `Passed ${evaluationData.evaluation.passed} of ${evaluationData.evaluation.total} test cases.`
      );
    } catch (error) {
      console.error("Challenge submission error:", error);
      setOutput(error.message || "Unable to evaluate challenge");
    }
  };

  /* ================= TABS ================= */
  const handleAddTab = () => {
    const newTab = {
      id: Date.now(),
      name: `Tab ${tabs.length + 1}`,
      language: LANGUAGES[0],
      code: FALLBACK_TEMPLATES.javascript,
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

  /* ================= RENDER ================= */
  const renderAstFeedback = astFeedback.map((item, index) => (
    <div
      key={`${item.code}-${index}`}
      className={`challenge-feedback ${item.level || "info"}`}
    >
      <strong>{item.code}</strong>
      <p>{item.message}</p>
    </div>
  ));

  return (
    <div className="challenge-container">
      <Split className="challenge-layout" sizes={[35, 65]} minSize={120} gutterSize={6}>

        {/* LEFT: Question Panel */}
        <div className="question-panel">
          <button className="back-btn" onClick={() => window.history.back()}>
            Back
          </button>

          {loading ? (
            <div className="question-placeholder">
              Generating a topic-aligned challenge...
            </div>
          ) : challenge ? (
            <div className="question-placeholder">

              {/* Challenge brief */}
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
                  <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "14px", lineHeight: "1.5" }}>
                    These tests run against your code when you click <strong style={{ color: "#cbd5e1" }}>Submit</strong>. Your solution must pass all of them. Each test feeds an input into your function and checks the output matches exactly.
                  </p>
                  {challenge.publicTests.map((test, idx) => (
                    <div key={test.id} className="challenge-test-card">
                      <div className="challenge-test-card-header">
                        <span className="challenge-test-badge">Test {idx + 1}</span>
                        <span className="challenge-test-title">{test.id}</span>
                      </div>

                      {test.explanation && (
                        <p className="challenge-test-explanation">{test.explanation}</p>
                      )}

                      <div className="challenge-test-io">
                        <div className="challenge-test-row">
                          <span className="challenge-test-label">Input</span>
                          <code className={`challenge-test-value${!test.input ? " empty" : ""}`}>
                            {test.input || "No input — your function is called with no arguments"}
                          </code>
                        </div>
                        <div className="challenge-test-row">
                          <span className="challenge-test-label">Expected</span>
                          <code className={`challenge-test-value${!test.expectedOutput ? " empty" : ""}`}>
                            {test.expectedOutput || "No output expected"}
                          </code>
                        </div>
                      </div>
                    </div>
                  ))}

                  {challenge.hiddenTests?.length > 0 && (
                    <div style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "12px 14px", borderRadius: "10px",
                      background: "rgba(167, 139, 250, 0.07)",
                      border: "1px solid rgba(167, 139, 250, 0.2)",
                      fontSize: "13px", color: "#a78bfa", marginTop: "4px"
                    }}>
                      <span>🔒</span>
                      <span>
                        <strong style={{ color: "#c4b5fd" }}>{challenge.hiddenTests.length} hidden test{challenge.hiddenTests.length !== 1 ? "s" : ""}</strong> will also run on submit — they check edge cases not shown here.
                      </span>
                    </div>
                  )}
                </section>
              )}

              

              {/* Submit results */}
              {submitSummary && (
                <section className="challenge-section">
                  <h3>Results</h3>
                  <p className="challenge-results-summary">
                    Passed {submitSummary.passed} of {submitSummary.total} tests.
                  </p>
                  {submitSummary.results.map((result, idx) => (
                    <div key={result.id} className="challenge-test-card" style={{
                      borderColor: result.passed
                        ? "rgba(34, 197, 94, 0.3)"
                        : "rgba(248, 113, 113, 0.35)"
                    }}>
                      <div className="challenge-test-card-header">
                        <span className="challenge-test-badge" style={{
                          background: result.passed ? "rgba(34,197,94,0.12)" : "rgba(248,113,113,0.12)",
                          color: result.passed ? "#4ade80" : "#f87171",
                          borderColor: result.passed ? "rgba(34,197,94,0.25)" : "rgba(248,113,113,0.25)"
                        }}>
                          {result.passed ? "✓ Passed" : "✗ Failed"}
                        </span>
                        <span className="challenge-test-title">{result.id}</span>
                      </div>
                      {!result.passed && (
                        <div className="challenge-test-io">
                          <div className="challenge-test-row">
                            <span className="challenge-test-label">Expected</span>
                            <code className="challenge-test-value">{result.expectedOutput || "(empty)"}</code>
                          </div>
                          <div className="challenge-test-row">
                            <span className="challenge-test-label">Got</span>
                            <code className="challenge-test-value" style={{ color: "#fca5a5" }}>
                              {result.actualOutput || result.stderr || result.compileOutput || "no output"}
                            </code>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </section>
              )}

              {/* Submit AST structural feedback */}
              {astFeedback.length > 0 && (
                <section className="challenge-section">
                  <h3>Structural Feedback</h3>
                  <div className="challenge-feedback-list">{renderAstFeedback}</div>
                </section>
              )}

              {/* Submit learner guidance */}
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
            <div className="question-placeholder">
              {output || "Problem description will appear here."}
            </div>
          )}
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

              {/* ─── HINT BUTTON ─── */}
              <button
                className={`hint-btn${hintLoading ? " hint-btn--loading" : ""}`}
                onClick={handleHint}
                disabled={hintLoading}
                title="Get a friendly insight into what your code is doing"
              >
                {hintLoading ? (
                  <>
                    <span className="hint-btn-spinner" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <span className="hint-btn-icon">💡</span>
                    Hint
                  </>
                )}
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

      <HintModal
        open={hintOpen}
        onClose={() => setHintOpen(false)}
        loading={hintLoading}
        feedback={hintFeedback}
        error={hintError}
      />
    </div>
  );
}
