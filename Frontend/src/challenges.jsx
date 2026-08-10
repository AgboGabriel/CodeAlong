import { useEffect, useMemo, useState, useCallback } from "react";
import Editor from "@monaco-editor/react";
import Split from "react-split";
import { useLocation, useNavigate } from "react-router-dom";
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

/**
 * Diagnostic codes that are purely informational/decorative and never
 * actionable for a learner (e.g. "your code parsed fine"). These are
 * always dropped from the Structural Feedback panel regardless of level.
 */
const NOISE_DIAGNOSTIC_CODES = new Set([
  "AST_PARSE_SUCCESS",
  "NO_FUNCTION_STRUCTURE_DETECTED",
  "LOW_CONTROL_FLOW_COMPLEXITY",
  "INCOMPLETE_SOLUTION_PATTERN",
  "WEAK_BRANCHING_LOGIC",
  "EXPECTED_BRANCHING_WEAK",
  "EXPECTED_FUNCTION_MISSING",
  "EXPECTED_CONDITIONAL_MISSING",
  "EXPECTED_LOOP_MISSING",
  "FUNCTION_COUNT_BELOW_EXPECTATION",
  "EXPRESSION_COUNT_BELOW_EXPECTATION",
  "STRUCTURE_TOO_SHALLOW",
  "LOOP_NO_INCREMENT",
  "UNUSED_VARIABLE",
]);

/** Human-readable titles for the diagnostic codes we DO want to show. */
const DIAGNOSTIC_TITLES = {
  DUPLICATE_DECLARATION: "Duplicate declaration",
  POSSIBLE_UNDECLARED_IDENTIFIER: "Possible typo or missing declaration",
  ASSIGNMENT_IN_CONDITION: "Assignment inside a condition",
  USED_BEFORE_ASSIGNMENT: "Used before it's assigned",
  INFINITE_LOOP_DETECTED: "This loop may never end",
  MISSING_RETURN_STATEMENT: "Missing a return statement",
  MISPLACED_LOOP_CONTROL: "break/continue outside a loop",
  MISPLACED_RETURN_STATEMENT: "return outside a function",
  OFF_BY_ONE_POTENTIAL: "Possible off-by-one error",
  LOOP_START_INDEX_WARNING: "Loop may skip the first element",
  FORBIDDEN_NODE_TYPE_DETECTED: "Unexpected pattern for this exercise",
};

/**
 * Filters raw AST diagnostics down to genuinely actionable feedback for a
 * learner: drops info-level noise, decorative "parsed successfully"
 * messages, and expectation nags that aren't real bugs — keeping only
 * warning/error-level structural issues that a learner can act on.
 */
const EXPECTATION_DIAGNOSTIC_RULES = {
  EXPECTED_FUNCTION_MISSING: (expectations = {}) =>
    expectations.requireFunction || (expectations.minimumFunctions || 0) > 0,
  EXPECTED_CONDITIONAL_MISSING: (expectations = {}) =>
    expectations.requireConditional || (expectations.minimumConditionals || 0) > 0,
  EXPECTED_LOOP_MISSING: (expectations = {}) =>
    expectations.requireLoop || (expectations.minimumLoops || 0) > 0,
};

function filterActionableDiagnostics(diagnostics = [], expectations = {}) {
  return diagnostics.filter((item) => {
    if (!item?.code) return false;

    const isRequiredExpectation = EXPECTATION_DIAGNOSTIC_RULES[item.code]?.(expectations);
    if (isRequiredExpectation) return true;

    if (NOISE_DIAGNOSTIC_CODES.has(item.code)) return false;
    // Only surface warnings and errors - "info" level is developer-facing
    // detail, not learner-facing guidance.
    return item.level === "warning" || item.level === "error";
  });
}

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
  const navigate = useNavigate();                        // ← added (was missing)

  const moduleId = location.state?.moduleId;
  const topic    = location.state?.topic;

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

  const currentTab   = tabs.find((tab) => tab.id === activeTab);
  const selectedLang = currentTab?.language || LANGUAGES[0];
  const code         = currentTab?.code || "";

  const [challenge,    setChallenge]    = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [submitSummary, setSubmitSummary] = useState(null);

  // Hint state
  const [hintLoading,  setHintLoading]  = useState(false);
  const [hintFeedback, setHintFeedback] = useState(null);
  const [hintError,    setHintError]    = useState("");
  const [hintOpen,     setHintOpen]     = useState(false);

  // Submit feedback
  const [astFeedback,    setAstFeedback]    = useState([]);
  const [learnerFeedback, setLearnerFeedback] = useState(null);

  // ── Progression banner (mirrors VideoLesson exactly) ──────────────────────
  const [progressionResult, setProgressionResult] = useState(null);
  const [progressionError,  setProgressionError]  = useState("");
  const [videoReplacement, setVideoReplacement] = useState(null);

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
      const activeTabResult   = data.tabs?.find((t) => t.tabId === activeTab);

      const localFeedback = buildLearnerFeedback({
        compileOutput: "",
        stderr: "",
        diagnostics: filterActionableDiagnostics(activeTabResult?.diagnostics || [], challenge?.structuralExpectations || {}),
        summary:            activeTabResult?.normalizedAst?.summary || {},
        ast:                activeTabResult?.normalizedAst?.ast || null,
        languageKey:        selectedLang.monaco,
        // Pass richer analysis data for the hint path too, so detected
        // patterns and topic-specific misconceptions are included when the
        // learner asks for a hint without submitting first.
        analysis:           activeTabResult?.normalizedAst?.analysis || {},
        topicMisconceptions: activeTabResult?.normalizedAst?.topicMisconceptions || [],
        topicTitle:         topic?.title || "",
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
    setHintOpen(false);
    setHintFeedback(null);
    setProgressionResult(null);
    setProgressionError("");
    setVideoReplacement(null);

    try {
      // Evaluate the challenge and run AST analysis in parallel.
      // NOTE: do NOT pass userId in the body — the server reads it from
      // req.user (session). Passing userId: null caused the service to throw
      // "User authentication is required" before it even ran the tests,
      // which produced a blank/error page.
      const [evaluationResponse, astResponse] = await Promise.all([
        fetch("/api/assessment/challenge/evaluate", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            challengeId:  challenge?.id,
            topicId:      topic?.id,
            moduleId,
            curriculumId: topic?.curriculumId || null,
            source_code:  code,
            language_id:  selectedLang.id,
            test_cases:   [...challenge.publicTests, ...challenge.hiddenTests],
          }),
        }),
        fetch("/api/ast/parse", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source_code: code,
            language_id: selectedLang.id,
            topic_id: topic?.id || null,
            topic_title: topic?.title || "",
            analysis_options: {
              expectations: challenge.structuralExpectations || {},
            },
          }),
        }),
      ]);

      const evaluationData = await evaluationResponse.json();
      const astData        = await astResponse.json();

      if (!evaluationResponse.ok || !evaluationData.success) {
        throw new Error(evaluationData.error || "Challenge evaluation failed");
      }

      // The controller now flattens the service response so we can read
      // evaluation, canProgress, and unlockResult directly off evaluationData.
      const evaluation   = evaluationData.evaluation;
      const canProgress  = evaluationData.canProgress  ?? false;
      const unlockResult = evaluationData.unlockResult ?? null;
      const replacement  = evaluationData.videoReplacement ?? null;

      if (!evaluation) {
        throw new Error("No evaluation data returned from server.");
      }

      setSubmitSummary(evaluation);
      setOutput(`Passed ${evaluation.passed} of ${evaluation.total} test cases.`);

      // AST structural feedback — only keep genuinely actionable
      // warning/error diagnostics; drop info-level noise and decorative
      // "parsed successfully" style messages before they ever reach state.
      const rawDiagnostics = astData.normalizedAst?.diagnostics || [];
      const diagnostics = filterActionableDiagnostics(rawDiagnostics, challenge?.structuralExpectations || {});
      setAstFeedback(diagnostics);

      const failedCase = evaluation.results.find((r) => !r.passed);
      setLearnerFeedback(
        buildLearnerFeedback({
          compileOutput:      failedCase?.compileOutput || "",
          stderr:             failedCase?.stderr || "",
          ast:                astData.normalizedAst?.ast || null,
          diagnostics,
          summary:            astData.normalizedAst?.summary || {},
          languageKey:        selectedLang.monaco,
          // Pass the richer analysis data so buildLearnerFeedback can
          // generate strengths from detected patterns (accumulators,
          // counters, flags, etc.) and surface topic-specific misconception
          // hints alongside the generic structural feedback.
          analysis:           astData.normalizedAst?.analysis || {},
          topicMisconceptions: astData.normalizedAst?.topicMisconceptions || [],
          topicTitle:         topic?.title || "",
        })
      );

      if (replacement?.video?.url || replacement?.video?.video_url) {
        setVideoReplacement(replacement);
      }

      // If BKT mastery hit ≥ 0.8 the service already marked the current topic
      // "completed" and unlocked the next one in the DB. Clear the MyLessons
      // cache so the next visit re-fetches fresh statuses, then show the banner.
      if (canProgress) {
        sessionStorage.removeItem("myLessons_cache");
        setProgressionResult(unlockResult ?? {});
      }

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
  // astFeedback is already filtered down to actionable warning/error
  // diagnostics by the time it reaches state (see filterActionableDiagnostics
  // calls in handleSubmit/handleHint), so every item here is meant to be shown.
  const renderAstFeedback = astFeedback.map((item, index) => (
    <div
      key={`${item.code}-${index}`}
      className={`challenge-feedback ${item.level || "info"}`}
    >
      <strong>{DIAGNOSTIC_TITLES[item.code] || "Heads up"}</strong>
      <p>{item.message}</p>
    </div>
  ));

  return (
    <div className="challenge-container">

      {/* ── Progression Banner — fixed green bar, same design as VideoLesson ── */}
      {progressionResult && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 999,
          background: "linear-gradient(90deg, #16a34a, #15803d)",
          color: "#fff", padding: "14px 24px",
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <span style={{ fontSize: 22 }}>🎉</span>
          <div style={{ flex: 1 }}>
            <strong>Topic Mastered!</strong>{" "}
            {progressionResult.unlockedTopicId
              ? "The next topic has been unlocked."
              : progressionResult.unlockedModuleId
              ? "Module complete! The next module is now unlocked."
              : "You've completed all topics in this curriculum!"}
          </div>
          <button
            onClick={() => { setProgressionResult(null); navigate("/MyLessons"); }}
            style={{
              background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 6,
              color: "#fff", padding: "6px 14px", cursor: "pointer", fontWeight: 600,
            }}
          >
            Back to Lessons →
          </button>
          <button
            onClick={() => setProgressionResult(null)}
            style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 18 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Non-fatal BKT/unlock error ── */}
      {progressionError && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 999,
          background: "linear-gradient(90deg, #b45309, #92400e)",
          color: "#fff", padding: "12px 24px",
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <span>⚠</span>
          <span style={{ flex: 1 }}>{progressionError}</span>
          <button
            onClick={() => setProgressionError("")}
            style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 18 }}
          >
            ✕
          </button>
        </div>
      )}

      {videoReplacement && (
        <div
          className="hint-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setVideoReplacement(null)}
        >
          <div className="hint-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hint-modal-header">
              <div>
                <p className="hint-eyebrow">Adaptive Support</p>
                <h2>Need a simpler explanation?</h2>
              </div>
              <button className="hint-close-btn" onClick={() => setVideoReplacement(null)}>✕</button>
            </div>

            <div className="hint-content">
              <div className="hint-state" style={{ display: "block", padding: "0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span className="hint-state-icon">🎥</span>
                  <span style={{ color: "#cbd5e1", fontWeight: 600 }}>
                    A simpler beginner-friendly video has been recommended for this topic.
                  </span>
                </div>

                <p style={{ margin: 0, color: "#94a3b8", lineHeight: 1.6 }}>
                  {videoReplacement.reason || "You have struggled with this concept repeatedly, so a clearer explanation is now available."}
                </p>
              </div>

              {videoReplacement.video?.title && (
                <div className="hint-section">
                  <div className="hint-section-label">
                    <span className="hint-dot hint-dot--purple" />
                    Suggested video
                  </div>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "92px 1fr",
                    gap: 14,
                    background: "rgba(15, 23, 42, 0.9)",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: 12,
                    padding: 12,
                    color: "#e2e8f0",
                    lineHeight: 1.5,
                  }}>
                    {videoReplacement.video.thumbnail && (
                      <img
                        src={videoReplacement.video.thumbnail}
                        alt={videoReplacement.video.title}
                        style={{
                          width: "92px",
                          height: "70px",
                          objectFit: "cover",
                          borderRadius: 8,
                          border: "1px solid rgba(148, 163, 184, 0.2)",
                          background: "#0f172a",
                        }}
                      />
                    )}

                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                        {videoReplacement.video.title}
                      </div>
                      {(videoReplacement.video.channelTitle || videoReplacement.video.channel_title) && (
                        <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 6 }}>
                          {videoReplacement.video.channelTitle || videoReplacement.video.channel_title}
                        </div>
                      )}
                      {videoReplacement.video.description && (
                        <div style={{
                          color: "#cbd5e1",
                          fontSize: 12,
                          lineHeight: 1.5,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}>
                          {videoReplacement.video.description}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 4 }}>
                <button
                  className="hint-close-btn"
                  onClick={() => setVideoReplacement(null)}
                >
                  Close
                </button>
                {(videoReplacement.video?.url || videoReplacement.video?.video_url) && (
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() => {
                      setVideoReplacement(null);
                      navigate("/Videolesson", {
                        state: {
                          moduleId,
                          topic,
                          video: {
                            ...videoReplacement.video,
                            videoId: videoReplacement.video.videoId || videoReplacement.video.video_id,
                            video_id: videoReplacement.video.video_id || videoReplacement.video.videoId,
                            title: videoReplacement.video.title,
                            description: videoReplacement.video.description || "",
                            channel_title: videoReplacement.video.channelTitle || videoReplacement.video.channel_title || "",
                            channelTitle: videoReplacement.video.channelTitle || videoReplacement.video.channel_title || "",
                            thumbnail: videoReplacement.video.thumbnail || "",
                            url: videoReplacement.video.url || videoReplacement.video.video_url || `https://www.youtube.com/watch?v=${videoReplacement.video.videoId || videoReplacement.video.video_id}`,
                            duration: videoReplacement.video.duration || "",
                            view_count: videoReplacement.video.view_count || videoReplacement.video.viewCount || 0,
                            like_count: videoReplacement.video.like_count || videoReplacement.video.likeCount || 0,
                          },
                        },
                      });
                    }}
                    style={{
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    Open video
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Split className="challenge-layout" sizes={[35, 65]} minSize={120} gutterSize={6}>

        {/* LEFT: Question Panel */}
        <div className="question-panel">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back
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



