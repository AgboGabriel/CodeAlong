import { useEffect, useMemo, useState } from "react";
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

export default function Challenges() {
  const location = useLocation();
  const moduleId = location.state?.moduleId;
  const topic = location.state?.topic;

  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState(FALLBACK_TEMPLATES.javascript);
  const [output, setOutput] = useState("");
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
        const response = await fetch("/api/assessment/challenge", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topicId: topic.id,
            moduleId,
          }),
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

  const activeTemplate = useMemo(() => {
    if (!challenge) {
      return FALLBACK_TEMPLATES[selectedLang.monaco] || "";
    }

    return (
      challenge.starterCodeByLanguage?.[selectedLang.monaco] ||
      FALLBACK_TEMPLATES[selectedLang.monaco] ||
      ""
    );
  }, [challenge, selectedLang.monaco]);

  useEffect(() => {
    setCode(activeTemplate);
  }, [activeTemplate]);

  const handleLanguageChange = (id) => {
    const lang = LANGUAGES.find((entry) => entry.id === Number(id));
    if (!lang) return;

    setSelectedLang(lang);
    setOutput("");
    setSubmitSummary(null);
    setAstFeedback([]);
    setLearnerFeedback(null);
  };

  const handleRun = async () => {
    setOutput("Executing your code...");

    try {
      const response = await fetch("/compile-poll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

      const result = data.data;
      const finalOutput =
        result.stdout ||
        result.stderr ||
        result.compile_output ||
        result.status?.description ||
        "No output";

      setOutput(finalOutput);
    } catch (error) {
      console.error("Execution error:", error);
      setOutput("Unable to connect to the server");
    }
  };

  const handleSubmit = async () => {
    if (!challenge) {
      return;
    }

    setOutput("Evaluating your solution...");
    setSubmitSummary(null);
    setAstFeedback([]);
    setLearnerFeedback(null);

    try {
      const [evaluationResponse, astResponse] = await Promise.all([
        fetch("/api/assessment/challenge/evaluate", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            source_code: code,
            language_id: selectedLang.id,
            test_cases: [...challenge.publicTests, ...challenge.hiddenTests],
          }),
        }),
        fetch("/api/ast/parse", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
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
      const failedCase = evaluationData.evaluation.results.find((result) => !result.passed);
      setLearnerFeedback(
        buildLearnerFeedback({
          compileOutput: failedCase?.compileOutput || "",
          stderr: failedCase?.stderr || "",
          diagnostics,
          summary: astData.normalizedAst?.summary || {},
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

  return (
    <div className="challenge-container">
      <Split className="challenge-layout" sizes={[40, 60]} minSize={120} gutterSize={6}>
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
                automaticLayout: true,
              }}
            />
          </div>

          <div className="output-panel">{output || "Run your code to see output here."}</div>
        </div>
      </Split>
    </div>
  );
}
