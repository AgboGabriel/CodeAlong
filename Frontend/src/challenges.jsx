import { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import Split from "react-split";
import "./challenges.css";
import aiBg from "./assets/Code along_logo-04.png";

const languages = [
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

export default function Challenges() {
  const [selectedLang, setSelectedLang] = useState(languages[0]);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");

  // AI STATE
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const aiReply = {
        role: "assistant",
        content:
          "Frontend AI simulation active. Real backend integration coming soon 🚀"
      };
      setMessages((prev) => [...prev, aiReply]);
      setIsTyping(false);
    }, 1000);
  };

  const handleClearChat = () => {
    setMessages([]);
    setInput("");
    setIsRecording(false);
  };

  return (
    <div className="challenge-container">
      <Split
        className="challenge-layout"
        sizes={[35, 35, 30]}
        minSize={100}
        gutterSize={6}
      >
        {/* LEFT: Video */}
        <div className="video-panel">
          <h3>Lesson Title</h3>
          <div className="video-placeholder">🎥 Video Player Here</div>
        </div>

        {/* MIDDLE: Editor */}
        <div className="editor-panel">
          <div className="editor-header">
            <select
              value={selectedLang.id}
              onChange={(e) => {
                const lang = languages.find(
                  (l) => l.id === Number(e.target.value)
                );
                setSelectedLang(lang);
                setCode("");
              }}
            >
              {languages.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>

            <button
              className="run-btn"
              onClick={() => setOutput("Backend not connected yet 👀")}
            >
              Run
            </button>
          </div>

          <div className="editor-wrapper">
            <Editor
              height="100%"
              theme="vs-dark"
              language={selectedLang.monaco}
              value={code}
              onChange={setCode}
              options={{
                minimap: { enabled: false },
                fontSize: 17,
                lineHeight: 30
              }}
            />
          </div>

          <div className="output-panel">{output}</div>
        </div>

        {/* RIGHT: AI PANEL */}
        <div className="ai-panel">
          {/* Header with Clear Chat */}
          <div className="ai-header">
            <h3>AI Tutor</h3>
            {messages.length > 0 && (
              <button className="clear-chat-btn" onClick={handleClearChat}>
                Clear Chat
              </button>
            )}
          </div>

          {/* Empty state */}
          {messages.length === 0 && (
            <div className="ai-empty">
              <img src={aiBg} alt="Code Along Logo" />
              <p>Ask me anything about your lesson.</p>
              <p>Always ready to assist.</p>
            </div>
          )}

          {/* Chat messages */}
          {messages.length > 0 && (
            <div className="ai-chat">
              {messages.map((msg, index) => (
                <div key={index} className={`chat-message ${msg.role}`}>
                  <div className="chat-bubble">{msg.content}</div>
                </div>
              ))}
              {isTyping && (
                <div className="chat-message assistant">
                  <div className="chat-bubble typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input */}
          <div className="ai-input-container">
            <div className={`input-wrapper ${isRecording ? "recording" : ""}`}>
              <textarea
                ref={textareaRef}
                placeholder="Message AI Tutor..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && handleSend()
                }
                className="ai-input"
                rows={1}
              />

              {/* Microphone Button inside input */}
              <button
                className="mic-btn"
                onClick={() => setIsRecording(!isRecording)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2zm-5 9a7 7 0 0 0 7-7h-2a5 5 0 0 1-10 0H5a7 7 0 0 0 7 7z" />
                </svg>
              </button>

              <button
                className="send-btn"
                onClick={handleSend}
                disabled={!input.trim()}
              >
                Send
              </button>
            </div>

            {/* Recording indicator */}
            {isRecording && (
              <div className="recording-indicator">
                <div className="dot"></div>
                <span>Recording...</span>
              </div>
            )}
          </div>
        </div>
      </Split>
    </div>
  );
}



