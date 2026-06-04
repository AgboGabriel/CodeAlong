import { useState, useEffect, useRef, useCallback } from "react";
import Editor from "@monaco-editor/react";
import Split from "react-split";
import { useLocation } from "react-router-dom";
import "./Videolesson.css";
import { buildLearnerFeedback } from "./learnerFeedback";

// Languages
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

// Templates
const CODE_TEMPLATES = {
  javascript: "// Write your code here\n",
  python: "# Write Python here\n",
  java: "// Write Java code here\n",
  cpp: "// Write C++ code here\n",
  c: "// Write C code here\n",
  csharp: "// Write C# code here\n",
  go: "// Write Go code here\n",
  ruby: "# Write Ruby code here\n",
  rust: "// Write Rust code here\n",
};

export default function Videolesson() {
  // const YOUTUBE_URL = "https://www.youtube.com/embed/dQw4w9WgXcQ";
  // const [videos, setVideos] = useState([]);
  // const [currentVideo, setCurrentVideo] =
  // useState(video || null);
  // const [loadingVideo, setLoadingVideo] = useState(true);
  // const navigate = useNavigate();
  // const location = useLocation();
  // const moduleId = location.state?.moduleId;
  // const topic = location.state?.topic;
  // const video = location.state?.video;

  const [, setVideos] = useState([]);

const location = useLocation();

const moduleId = location.state?.moduleId;
const topic = location.state?.topic;
const video = location.state?.video;

const [currentVideo, setCurrentVideo] =
  useState(video || null);

const [loadingVideo, setLoadingVideo] = useState(true);
console.log("LOCATION STATE:", location.state);
console.log("MODULE ID:", moduleId);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [code, setCode] = useState(CODE_TEMPLATES.javascript);
  const [output, setOutput] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [hintFeedback, setHintFeedback] = useState(null);
  const [hintError, setHintError] = useState("");

  const [messages, setMessages] = useState([
    {
      role: "ai",
      content: "Hi 👋 Ask questions about the lesson or your code.",
    },
  ]);

  //  FIXED: Stable theme setup (NO rerenders, NO duplication issues)
  const handleEditorBeforeMount = useCallback((monacoInstance) => {
    monacoInstance.editor.defineTheme("custom-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#0f172a",

        // IntelliSense fix
        "editorSuggestWidget.background": "#0f172a",
        "editorSuggestWidget.foreground": "#e2e8f0",
        "editorSuggestWidget.selectedBackground": "#2563eb",
        "editorSuggestWidget.border": "#334155",
        "editorSuggestWidget.highlightForeground": "#60a5fa",
      },
    });
  }, []);

  const handleLanguageChange = (id) => {
    const lang = LANGUAGES.find((l) => l.id === Number(id));
    if (!lang) return;

    setSelectedLang(lang);
    setCode(CODE_TEMPLATES[lang.monaco] || "");
    setOutput("");
    setHintFeedback(null);
    setHintError("");
  };

  const fetchCompileAnalysis = async () => {
    const response = await fetch("/compile-poll", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_code: code,
        language_id: selectedLang.id,
        stdin: "",
      }),
    });

    const data = await response.json();
    const result = data?.data || {};

    if (!response.ok && !data?.error) {
      throw new Error("Execution failed");
    }

    return {
      compileOutput: result.compile_output || data?.error || "",
      stderr: result.stderr || "",
      stdout: result.stdout || "",
      statusDescription: result.status?.description || "",
    };
  };

  const fetchAstAnalysis = async () => {
    const response = await fetch("/api/ast/parse", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_code: code,
        language_id: selectedLang.id,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "AST analysis failed");
    }

    return {
      ast: data.normalizedAst?.ast || null,
      diagnostics: data.normalizedAst?.diagnostics || [],
      summary: data.normalizedAst?.summary || {},
    };
  };

  const loadLessonFeedback = async () => {
    const [compileResult, astResult] = await Promise.allSettled([
      fetchCompileAnalysis(),
      fetchAstAnalysis(),
    ]);

    const compileAnalysis =
      compileResult.status === "fulfilled"
        ? compileResult.value
        : {
            compileOutput: "",
            stderr: compileResult.reason?.message || "Judge0 compilation is temporarily unavailable.",
            stdout: "",
            statusDescription: "",
          };

    if (astResult.status !== "fulfilled") {
      throw astResult.reason;
    }

    const astAnalysis = astResult.value;

    return {
      feedback: buildLearnerFeedback({
        compileOutput:
          compileAnalysis.compileOutput ||
          compileAnalysis.stdout ||
          compileAnalysis.statusDescription ||
          "",
        stderr: compileAnalysis.stderr || "",
        ast: astAnalysis.ast,
        diagnostics: astAnalysis.diagnostics,
        summary: astAnalysis.summary,
        languageKey: selectedLang.monaco,
      }),
      compileAnalysis,
    };
  };

  const handleRun = () => {
    const runCode = async () => {
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
            stdin: "",
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Execution failed");
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
        console.error("Run error:", error);
        setOutput(error.message || "Unable to run code");
      }
    };

    runCode();
  };

  const handleSubmit = () => {
    const submitCode = async () => {
      setOutput("Submitting your code for review...");

      try {
        const { feedback, compileAnalysis } = await loadLessonFeedback();

        setHintFeedback(feedback);
        setHintError("");
        setOutput(
          compileAnalysis.stdout ||
            compileAnalysis.stderr ||
            compileAnalysis.compileOutput ||
            compileAnalysis.statusDescription ||
            "Submission reviewed. Open Hints for guidance."
        );
      } catch (error) {
        console.error("Submit error:", error);
        setOutput(error.message || "Unable to submit code");
      }
    };

    submitCode();
  };

  const handleHints = async () => {
    setHintOpen(true);
    setHintLoading(true);
    setHintError("");

    try {
      const { feedback } = await loadLessonFeedback();
      setHintFeedback(feedback);
    } catch (error) {
      console.error("Hint analysis error:", error);
      setHintFeedback(null);
      setHintError(error.message || "Unable to load hints");
    } finally {
      setHintLoading(false);
    }
  };

  const handleSendMessage = () => {
    const sendMessage = async () => {
      if (!chatInput.trim()) return;

      const userMessage = chatInput;

      setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
      setChatInput("");
      setChatLoading(true);

      try {
        const response = await fetch("/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessage,
            options: {
              systemPrompt: `You are helping with the lesson topic "${topic?.title || "Unknown topic"}" in module "${
                currentVideo?.title || "Current lesson"
              }". Use the lesson video context and the learner's current code when helpful.

Video description:
${currentVideo?.description || "No video description available."}

Selected programming language: ${selectedLang.name}

Current code:
${code}`,
            },
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Chat request failed");
        }

        setMessages((prev) => [...prev, { role: "ai", content: data.message }]);
      } catch (error) {
        console.error("Chat error:", error);
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            content: error.message || "I could not respond right now.",
          },
        ]);
      } finally {
        setChatLoading(false);
      }
    };

    sendMessage();
  };
useEffect(() => {
  const fetchVideos = async () => {
    if (!moduleId) return;

    try {
      setLoadingVideo(true);

      const response = await fetch(
        `/api/videos/module/${moduleId}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      console.log("VIDEO RESPONSE:", data);

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Failed to load videos"
        );
      }

      setVideos(data.videos || []);

      // Set first video automatically
      const firstVideo = data.videos?.find(
        (v) => v.video
      );

      if (firstVideo) {
        setCurrentVideo(firstVideo.video);
      }

    } catch (error) {
      console.error("Failed to fetch videos:", error);
    } finally {
      setLoadingVideo(false);
    }
  };

  fetchVideos();
}, [moduleId]);
  // Smart scroll

  useEffect(() => {
    const container = chatContainerRef.current;
    const end = messagesEndRef.current;

    if (!container || !end) return;

    const distance =
      container.scrollHeight -
      container.scrollTop -
      container.clientHeight;

    if (distance < 120) {
      end.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setHintOpen(false);
      }
    };

    if (hintOpen) {
      window.addEventListener("keydown", handleEscape);
    }

    return () => window.removeEventListener("keydown", handleEscape);
  }, [hintOpen]);

 return (
  <div className="Videolesson-container">
    <Split
      className="Videolesson-layout"
      sizes={[35, 40, 25]}
      minSize={[280, 400, 250]}
      gutterSize={6}
      expandToMin={false}
    >

      {/* VIDEO PANEL */}
      <div className="video-panel">
            <div className="video-frame">

          {loadingVideo ? (
            <div className="video-loading">
              Loading video...
            </div>

          ) : currentVideo ? (

            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${currentVideo.videoId || currentVideo.video_id}`}
              title="Lesson Video"
              frameBorder="0"
              allowFullScreen
            />

          ) : (
            <div className="video-loading">
              No video found.
            </div>
          )}

        </div>
          
      </div>

      {/* EDITOR PANEL */}
      <div className="editor-panel">

        <div className="editor-header">
          <select
            value={selectedLang.id}
            onChange={(e) =>
              handleLanguageChange(e.target.value)
            }
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>

          <div className="editor-actions">
            <button
              className="run-btn"
              onClick={handleRun}
            >
              Run
            </button>

            <button
              className="submit-btn"
              onClick={handleSubmit}
            >
              Submit
            </button>

            <button
              className="hint-btn"
              onClick={handleHints}
            >
              Hints
            </button>
          </div>
        </div>

        <div className="editor-wrapper">
          <Editor
            height="100%"
            theme="custom-dark"
            beforeMount={handleEditorBeforeMount}
            language={selectedLang.monaco}
            value={code}
            onChange={(v) => setCode(v || "")}
            options={{
              minimap: { enabled: false },
              fontSize: 18,
              lineHeight: 24,
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>

        <div className="output-panel">
          {output || "Run your code to see output here."}
        </div>
      </div>

      {/* CHAT PANEL */}
      <div className="chat-panel">

        <div className="chat-header">
          <h3>AI Assistant</h3>
        </div>

        <div
          className="chat-messages"
          ref={chatContainerRef}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              className={
                msg.role === "ai"
                  ? "ai-message"
                  : "user-message"
              }
            >
              {msg.content}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <input
            value={chatInput}
            placeholder="Ask anything..."
            onChange={(e) =>
              setChatInput(e.target.value)
            }
            onKeyDown={(e) =>
              e.key === "Enter" &&
              handleSendMessage()
            }
          />

          <button
            className="chat-send-btn"
            onClick={handleSendMessage}
            disabled={chatLoading}
          >
            {chatLoading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>

    </Split>

    {hintOpen && (
      <div
        className="hint-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hint-modal-title"
        onClick={() => setHintOpen(false)}
      >
        <div
          className="hint-modal"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="hint-modal-header">
            <div>
              <p className="hint-eyebrow">AST Hints</p>
              <h2 id="hint-modal-title">Friendly feedback for your code</h2>
            </div>

            <button
              type="button"
              className="hint-close-btn"
              onClick={() => setHintOpen(false)}
              aria-label="Close hints"
            >
              Close
            </button>
          </div>

          {hintLoading ? (
            <div className="hint-state">Analyzing your code...</div>
          ) : hintError ? (
            <div className="hint-state hint-error">{hintError}</div>
          ) : hintFeedback ? (
            <div className="hint-content">
              {hintFeedback.intent?.length > 0 && (
                <section className="hint-section">
                  <h3>What the code is trying to do</h3>
                  <ul>
                    {hintFeedback.intent.map((item, index) => (
                      <li key={`intent-${index}`}>{item}</li>
                    ))}
                  </ul>
                </section>
              )}

              {hintFeedback.problems?.length > 0 && (
                <section className="hint-section">
                  <h3>What went wrong</h3>
                  <ul>
                    {hintFeedback.problems.map((item, index) => (
                      <li key={`problem-${index}`}>{item}</li>
                    ))}
                  </ul>
                </section>
              )}

              {hintFeedback.fixes?.length > 0 && (
                <section className="hint-section">
                  <h3>Exact fix</h3>
                  <ul>
                    {hintFeedback.fixes.map((item, index) => (
                      <li key={`fix-${index}`}>{item}</li>
                    ))}
                  </ul>
                </section>
              )}

              {!hintFeedback.intent?.length &&
                !hintFeedback.problems?.length &&
                !hintFeedback.fixes?.length && (
                  <div className="hint-state">
                    No specific issue could be inferred from the AST alone.
                  </div>
                )}
            </div>
          ) : (
            <div className="hint-state">
              No hints available yet. Click Hints again after making changes.
            </div>
          )}
        </div>
      </div>
    )}
  </div>
);
}
