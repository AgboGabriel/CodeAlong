import { useState, useEffect, useRef, useCallback } from "react";
import Editor from "@monaco-editor/react";
import Split from "react-split";
import { useLocation } from "react-router-dom";
import "./Videolesson.css";
import logo from "./assets/Code along_logo-04.png";
import { buildLearnerFeedback } from "./learnerFeedback";

/* ================= LANGUAGES ================= */
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

/* ================= TEMPLATES ================= */
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
const navigate = useNavigate();
const location = useLocation();

const moduleId = location.state?.moduleId;
const topic = location.state?.topic;
const video = location.state?.video;

const [videos, setVideos] = useState([]);
const [currentVideo, setCurrentVideo] =
  useState(video || null);

const [loadingVideo, setLoadingVideo] =
  useState(true);

  /* ================= REFS ================= */
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const historyRef = useRef(null);
  const menuRef = useRef(null);

  /* ================= STATE ================= */
  const [output, setOutput] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [hintFeedback, setHintFeedback] = useState(null);
  const [hintError, setHintError] = useState("");

  const [tabs, setTabs] = useState([
    {
      id: 1,
      name: "Tab 1",
      language: LANGUAGES[0],
      code: CODE_TEMPLATES.javascript,
    },
  ]);

  const [activeTab, setActiveTab] = useState(1);

  const [conversations, setConversations] = useState([
    {
      id: 1,
      title: "Variables",
      messages: [
        { role: "ai", content: "Hi 👋 Ask questions about the lesson or your code." },
      ],
    },
    {
      id: 2,
      title: "Loops",
      messages: [
        { role: "ai", content: "Hi 👋 Ask questions about the lesson or your code." },
      ],
    },
    {
      id: 3,
      title: "c# basics",
      messages: [
        { role: "ai", content: "Hi 👋 Ask questions about the lesson or your code." },
      ],
    },
    {
      id: 4,
      title: "functions",
      messages: [
        { role: "ai", content: "Hi 👋 Ask questions about the lesson or your code." },
      ],
    },
  ]);

  const [activeConversationId, setActiveConversationId] = useState(1);
  const [chatInput, setChatInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  /* ================= DERIVED VALUES ================= */
  const currentTab = tabs.find((tab) => tab.id === activeTab);
  const selectedLang = currentTab?.language || LANGUAGES[0];

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );

  const messages = activeConversation?.messages || [];

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

  /* ================= CHAT ================= */
  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const userMsg = { role: "user", content: chatInput };

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeConversationId
          ? { ...conv, messages: [...conv.messages, userMsg] }
          : conv
      )
    );

    setChatInput("");

    setTimeout(() => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversationId
            ? {
                ...conv,
                messages: [
                  ...conv.messages,
                  {
                    role: "ai",
                    content:
                      "I can help explain concepts, debug code, and guide you through the lesson.",
                  },
                ],
              }
            : conv
        )
      );
    }, 700);
  };

  /* ================= CHAT HELPERS ================= */
  const getChatTitle = () => {
    const path = location.pathname.toLowerCase();

    if (path.includes("variable")) return "Variables";
    if (path.includes("loop")) return "Loops";
    if (path.includes("array")) return "Arrays";

    return "New Chat";
  };

  const handleNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: getChatTitle(),
      messages: [
        { role: "ai", content: "Hi 👋 Ask questions about the lesson or your code." },
      ],
    };

    setConversations((prev) => [newChat, ...prev]);
    setActiveConversationId(newChat.id);
    setShowHistory(false);
  };

  const handleRename = (id) => {
    const name = prompt("Rename chat:");
    if (!name) return;

    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: name } : c))
    );
  };

  const handleDelete = (id) => {
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id);

      if (activeConversationId === id && updated.length > 0) {
        setActiveConversationId(updated[0].id);
      }

      return updated;
    });
  };

  /* ================= EDITOR ================= */
  const handleLanguageChange = (id) => {
    const lang = LANGUAGES.find((l) => l.id === Number(id));
    if (!lang) return;

    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTab
          ? { ...tab, language: lang, code: CODE_TEMPLATES[lang.monaco] }
          : tab
      )
    );

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
  const code = currentTab?.code || "";

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
      console.error(error);
      setOutput(error.message || "Unable to run code");
    }
  };

  runCode();
};
  const handleAddTab = () => {
  const newTab = {
    id: Date.now(),
    name: `Tab ${tabs.length + 1}`,
    language: LANGUAGES[0],
    code: CODE_TEMPLATES.javascript,
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

  useEffect(() => {
    setConversations((prev) =>
      prev.map((c) => (c.title?.trim() ? c : { ...c, title: "New Chat" }))
    );
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  useEffect(() => {
useEffect(() => {
  const handleClickOutside = (e) => {
    if (
      showHistory &&
      historyRef.current &&
      !historyRef.current.contains(e.target)
    ) {
      setShowHistory(false);
    }

    if (openMenuId) {
      const isInsideMenu = e.target.closest(".menu-dropdown");
      const isMenuButton = e.target.closest(".menu-btn");

      if (!isInsideMenu && !isMenuButton) {
        setOpenMenuId(null);
      }
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () =>
    document.removeEventListener(
      "mousedown",
      handleClickOutside
    );
}, [showHistory, openMenuId]);

useEffect(() => {
  const handleEscape = (event) => {
    if (event.key === "Escape") {
      setHintOpen(false);
    }
  };

  if (hintOpen) {
    window.addEventListener("keydown", handleEscape);
  }

  return () =>
    window.removeEventListener(
      "keydown",
      handleEscape
    );
}, [hintOpen]);

/* ================= RENDER ================= */
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

        <button
          className="video-back-btn"
          onClick={() => navigate(-1)}
        >
          ← Back to Topics
        </button>

        <div className="video-frame">
          {loadingVideo ? (
            <div className="video-loading">
              Loading video...
            </div>
          ) : currentVideo ? (
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${
                currentVideo.videoId ||
                currentVideo.video_id
              }`}
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
</div>

        {/* EDITOR PANEL */}
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
          </div>

          <Split direction="vertical" className="editor-terminal-split" sizes={[75, 25]} minSize={[200, 100]} gutterSize={6}>

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

        {/* CHAT PANEL */}
        <div className="chat-panel">

          <div ref={historyRef} className={`history-panel ${showHistory ? "open" : ""}`}>
            <div className="history-header">
              <h3>Chat History</h3>
              <button onClick={handleNewChat}>+ New</button>
            </div>

                              {conversations.map((conv) => (
                    <div key={conv.id} className="history-item">
                      
                      <span
                        onClick={() => {
                          setActiveConversationId(conv.id);
                          setShowHistory(false);
                        }}
                      >
                        {conv.title}
                      </span>

                      <button
                        className="menu-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId((prev) =>
                            prev === conv.id ? null : conv.id
                          );
                        }}
                      >
                        ⋮
                      </button>

                      {openMenuId === conv.id && (
                        <div className="menu-dropdown">
                          <button onClick={() => handleRename(conv.id)}>
                            Rename
                          </button>
                          <button onClick={() => handleDelete(conv.id)}>
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
          </div>

          <div className="chat-header">
            <button onClick={() => setShowHistory(!showHistory)}>☰</button>
            <h3>Your AI Assistant</h3>
            <img className="Ca-logo" src={logo} alt="Logo" />
          </div>

          <div className="chat-messages" ref={chatContainerRef}>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={msg.role === "ai" ? "ai-message" : "user-message"}
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
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            />

            <button className="chat-send-btn" onClick={handleSendMessage}>
              Send
            </button>
          </div>

                 <div className="chat-input-area">
            <input
              value={chatInput}
              placeholder="Ask anything..."
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && handleSendMessage()
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

        </div> {/* chat-panel */}

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
                <h2 id="hint-modal-title">
                  Friendly feedback for your code
                </h2>
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
              <div className="hint-state">
                Analyzing your code...
              </div>
            ) : hintError ? (
              <div className="hint-state hint-error">
                {hintError}
              </div>
            ) : hintFeedback ? (
              <div className="hint-content">

                {hintFeedback.intent?.length > 0 && (
                  <section className="hint-section">
                    <h3>What the code is trying to do</h3>
                    <ul>
                      {hintFeedback.intent.map((item, index) => (
                        <li key={`intent-${index}`}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {hintFeedback.problems?.length > 0 && (
                  <section className="hint-section">
                    <h3>What went wrong</h3>
                    <ul>
                      {hintFeedback.problems.map((item, index) => (
                        <li key={`problem-${index}`}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {hintFeedback.fixes?.length > 0 && (
                  <section className="hint-section">
                    <h3>Exact fix</h3>
                    <ul>
                      {hintFeedback.fixes.map((item, index) => (
                        <li key={`fix-${index}`}>
                          {item}
                        </li>
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