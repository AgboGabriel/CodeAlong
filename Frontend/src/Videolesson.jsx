import { useState, useEffect, useRef, useCallback } from "react";
import Editor from "@monaco-editor/react";
import Split from "react-split";
import { useNavigate, useLocation } from "react-router-dom";
import * as monaco from "monaco-editor";
import "./Videolesson.css";

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
  const YOUTUBE_URL = "https://www.youtube.com/embed/dQw4w9WgXcQ";

  const navigate = useNavigate();
  const location = useLocation();

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [code, setCode] = useState(CODE_TEMPLATES.javascript);
  const [output, setOutput] = useState("");
  const [chatInput, setChatInput] = useState("");

  const [messages, setMessages] = useState([
    {
      role: "ai",
      content: "Hi 👋 Ask questions about the lesson or your code.",
    },
  ]);

  // ✅ FIXED: Stable theme setup (NO rerenders, NO duplication issues)
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
  };

  const handleRun = () => {
    setOutput("Execution engine not connected yet.");
  };

  const handleSubmit = () => {
    setOutput("Your code has been submitted for evaluation...");
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: chatInput },
    ]);

    setChatInput("");

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content:
            "I can help explain concepts, debug code, and guide you through the lesson.",
        },
      ]);
    }, 700);
  };

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
          <iframe
            width="100%"
            height="100%"
            src={YOUTUBE_URL}
            title="Lesson Video"
            frameBorder="0"
            allowFullScreen
          />
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
          >
            Send
          </button>
        </div>
      </div>

    </Split>
  </div>
);
}