import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import Split from "react-split";
import { useNavigate, useLocation } from "react-router-dom";

import "./Videolesson.css";

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
  { id: 73, name: "Rust", monaco: "rust" },
];

// Starter templates
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

  // refs (chat system)
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);

  const [code, setCode] = useState(
    CODE_TEMPLATES[LANGUAGES[0].monaco]
  );

  const [output, setOutput] = useState("");
  const [chatInput, setChatInput] = useState("");

  const [messages, setMessages] = useState([
    {
      role: "ai",
      content:
        "Hi 👋 Ask questions about the lesson or your code.",
    },
  ]);

  // language switch
  const handleLanguageChange = (id) => {
    const lang = LANGUAGES.find((l) => l.id === Number(id));

    if (!lang) return;

    setSelectedLang(lang);
    setCode(CODE_TEMPLATES[lang.monaco] || "");
    setOutput("");
  };

  // code actions
  const handleRun = () => {
    setOutput("Execution engine not connected yet.");
  };

  const handleSubmit = () => {
    setOutput("Your code has been submitted for evaluation...");
  };

  // chat send
  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();

    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
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

  // ✅ SMART AUTO SCROLL (no fighting user scroll)
  useEffect(() => {
    const container = chatContainerRef.current;
    const end = messagesEndRef.current;

    if (!container || !end) return;

    const distanceFromBottom =
      container.scrollHeight -
      container.scrollTop -
      container.clientHeight;

    const shouldAutoScroll = distanceFromBottom < 120;

    if (shouldAutoScroll) {
      end.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="Videolesson-container">
      <Split
        className="Videolesson-layout"
        sizes={[30, 70]}
        minSize={120}
        gutterSize={6}
      >
        {/* LEFT PANEL */}
        <div className="video-panel">

          <div className="video-frame">
            <iframe
              width="100%"
              height="100%"
              src={YOUTUBE_URL}
              title="Lesson Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="workspace-panel">
          {/* EDITOR */}
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
                <button className="run-btn" onClick={handleRun}>Run</button>
                <button className="submit-btn" onClick={handleSubmit}>Submit</button>
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

          {/* CHAT */}
          <div className="chat-panel">
            <div className="chat-header">
              <h3>AI Assistant</h3>
            </div>

            <div
              className="chat-messages"
              ref={chatContainerRef}
            >
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={
                    msg.role === "ai"
                      ? "ai-message"
                      : "user-message"
                  }
                >
                  {msg.content}
                </div>
              ))}

              {/* anchor for scroll */}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
              <input
                type="text"
                placeholder="Ask anything..."
                value={chatInput}
                onChange={(e) =>
                  setChatInput(e.target.value)
                }
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  handleSendMessage()
                }
              />

              <button className="chat-send-btn" onClick={handleSendMessage}>
                Send
              </button>
            </div>
          </div>
        </div>
      </Split>
    </div>
  );
}