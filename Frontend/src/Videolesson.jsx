import { useState, useEffect, useRef, useCallback } from "react";
import Editor from "@monaco-editor/react";
import Split from "react-split";
import { useNavigate, useLocation } from "react-router-dom";
import * as monaco from "monaco-editor";
import "./Videolesson.css";
import logo from "./assets/Code along_logo-04.png";

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
  /* ================= CONSTANTS ================= */
  const YOUTUBE_URL = "https://www.youtube.com/embed/dQw4w9WgXcQ";
  const navigate = useNavigate();
  const location = useLocation();

  /* ================= REFS ================= */
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const historyRef = useRef(null);
  const menuRef = useRef(null);

  /* ================= STATE ================= */
  const [output, setOutput] = useState("");

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

  /* ================= EFFECTS ================= */

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
    const handleClickOutside = (e) => {
      if (!showHistory) return;

      if (
        historyRef.current &&
        !historyRef.current.contains(e.target)
      ) {
        setShowHistory(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [showHistory]);

useEffect(() => {
  const handleClickOutside = (e) => {
    // if no menu open, do nothing
    if (!openMenuId) return;

    // check if click is inside ANY dropdown or any button
    const isInsideMenu = e.target.closest(".menu-dropdown");
    const isMenuButton = e.target.closest(".menu-btn");

    if (!isInsideMenu && !isMenuButton) {
      setOpenMenuId(null);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () =>
    document.removeEventListener("mousedown", handleClickOutside);
}, [openMenuId]);

  /* ================= RENDER ================= */
  return (
    <div className="Videolesson-container">

      <Split className="Videolesson-layout" sizes={[30, 40, 30]} minSize={[280, 400, 250]} gutterSize={6}>

        {/* VIDEO PANEL */}
        <div className="video-panel">
          <div className="video-frame">
            <iframe
              src={YOUTUBE_URL}
              width="100%"
              height="100%"
              title="Lesson Video"
              allowFullScreen
            />
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

        </div>

      </Split>
    </div>
  );
}