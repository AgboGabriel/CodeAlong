import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "./Components/Sidebar";
import Header from "./Components/Header";
import "./LearningPath.css";

import {
  MdAccountTree,
  MdDashboard,
  MdFolderOpen,
  MdMenuBook,
  MdNotifications,
  MdAttachFile,
} from "react-icons/md";

import { FaMicrophone, FaPaperPlane, FaRobot } from "react-icons/fa";

const NAV_ITEMS = [
  { icon: MdDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: MdMenuBook, label: "My Lessons", path: "/MyLessons" },
  { icon: MdAccountTree, label: "Learning Path", path: "/LearningPath" },
  { icon: MdFolderOpen, label: "Assessments", path: "/Assessments" },
];

function LpBody() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [messages, setMessages] = useState([
    {
      role: "ai",
      type: "text",
      content:
        "Hi 👋 Tell me what you want to learn and I’ll build a structured learning path for you.",
    },
  ]);
  const [activeModuleIndex, setActiveModuleIndex] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const chatContainerRef = useRef(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleModuleClick = (module, index) => {
    if (module.placeholder) return;
    setActiveModuleIndex((prev) => (prev === index ? null : index));
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: "ai",
        type: "text",
        content:
          "Hi 👋 Tell me what you want to learn and I’ll build a structured learning path for you.",
      },
    ]);
    setInput("");
    setLoading(false);
    setAttachments([]);
    setConfirmError("");
    setActiveModuleIndex(null);
  };

  const handleConfirmCurriculum = async (curriculum) => {
    if (!curriculum || !curriculum.modules?.length) {
      setConfirmError("No curriculum available to confirm.");
      return;
    }

    setConfirmError("");
    setConfirming(true);

    try {
      const response = await fetch("/api/curriculum/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ curriculum }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to confirm curriculum.");
      }

      const activeModule = data.activeModule;
      if (activeModule?.id) {
        await fetch(`/api/videos/module/${activeModule.id}`, {
          method: "POST",
          credentials: "include",
        });
      }

      localStorage.setItem(
        "myLessonsCurriculum",
        JSON.stringify({ curriculum: data.curriculum, activeModule })
      );

      navigate("/MyLessons");
    } catch (error) {
      console.error("Confirm curriculum error:", error);
      setConfirmError(error.message || "Unable to start this curriculum.");
    } finally {
      setConfirming(false);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setAttachments((prev) => [...prev, ...files]);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        type: "text",
        content: userMessage,
        attachments: attachments.length ? attachments.map((f) => f.name) : [],
      },
    ]);

    setInput("");
    setLoading(true);
    setAttachments([]);

    try {
      const response = await fetch("/chat/curriculum", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          message: userMessage,
          options: {
            model: "llama-3.1-8b-instant",
          },
        }),
      });
      const responseData = await response.json();
      console.log("AI curriculum response:", responseData);

      if (!response.ok || !responseData.success) {
        throw new Error(responseData.error || "Failed to get response from AI");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          type: "curriculum",
          data: responseData.curriculum,
        },
      ]);
    } catch (error) {
      console.error("Error generating curriculum:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          type: "text",
          content:
            "Sorry, I couldn't build your curriculum. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="chat-top-bar">
        <h2>Build Your Learning Path</h2>

        <button className="clear-btn" onClick={handleClearChat}>
          Clear Chat
        </button>
      </div>

      <div className="chat-container" ref={chatContainerRef}>
        {messages.map((msg, index) => (
          <div key={index}>
            {msg.role === "user" && (
              <div className="user-message-wrapper">
                <div className="user-message">
                  <p>{msg.content}</p>

                  {msg.attachments?.length > 0 && (
                    <div className="attachment-preview">
                      {msg.attachments.map((file, i) => (
                        <div key={i}>📎 {file}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {msg.role === "ai" && msg.type === "text" && (
              <div className="ai-section">
                <div className="ai-card">
                  <p>{msg.content}</p>
                </div>
              </div>
            )}

            {msg.role === "ai" && msg.type === "curriculum" && (
              <div className="ai-section">
                <div className="ai-card">
                  <div className="ai-header">
                    <div className="ai-icon">
                      <span className="material-symbols-outlined">
                        <FaRobot size={24} />
                      </span>
                    </div>
                    <span
                      className={`difficulty ${(msg.data.level || "Beginner").toLowerCase()}`}
                    >
                      {msg.data.level || "Beginner"}
                    </span>
                  </div>

                  {loading ? (
                    <>
                      <div className="pulse-dot"></div>
                      <h3>Building your curriculum...</h3>
                    </>
                  ) : (
                    <>
                      <div className="success-dot"></div>
                      <h3>Curriculum built</h3>
                    </>
                  )}

                  <p className="ai-description">{msg.data.description}</p>

                  <div className="modules-grid">
                    {msg.data.modules.map((m, i) => (
                      <div key={i}>
                        <div
                          className={`module ${m.color || ""} ${
                            m.placeholder ? "placeholder" : ""
                          }`}
                          onClick={() => handleModuleClick(m, i)}
                          style={{
                            cursor: m.placeholder ? "not-allowed" : "pointer",
                          }}
                        >
                          <div className="module-top">
                            <span className="material-symbols-outlined">
                              {m.icon}
                            </span>
                            <span className="badge">{m.week}</span>
                          </div>

                          <h4>{m.title}</h4>
                          <p>{m.desc}</p>
                        </div>

                        {activeModuleIndex === i && (
                          <div className="module-dropdown">
                            {Array.isArray(m.topics) && m.topics.length > 0 ? (
                              m.topics.map((topic, idx) => (
                                <div key={idx} className="topic-item">
                                  • {typeof topic === "string" ? topic : topic.title}
                                </div>
                              ))
                            ) : (
                              <div className="topic-item">No topics available</div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="actions">
                    {confirmError && (
                      <div className="error-message">{confirmError}</div>
                    )}
                    <button
                      className="primary-btn"
                      onClick={() => handleConfirmCurriculum(msg.data)}
                      disabled={confirming}
                    >
                      {confirming ? "Starting..." : "Confirm & Start"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="ai-section">
            <div className="ai-card">
              <div className="status-row">
                <div className="pulse-dot"></div>
                <h3>Building your curriculum...</h3>
              </div>
              <p className="ai-description">
                Structuring personalized learning path...
              </p>
            </div>
          </div>
        )}

        <div ref={bottomRef}></div>
      </div>

      <div className="chat-input">
        <button className="icon-btn" onClick={openFilePicker}>
          <MdAttachFile size={24} />
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          style={{ display: "none" }}
        />

        <input
          className="input"
          type="text"
          placeholder="What do you want to learn..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />

        <div className="input-actions">
          <button
            className={`mic-btn icon-btn ${isRecording ? "recording" : ""}`}
            onClick={() => setIsRecording((prev) => !prev)}
            aria-label="Record voice"
          >
            <FaMicrophone size={24} />
          </button>

          <button
            className="send-btn"
            onClick={handleSend}
            aria-label="Send message"
          >
            <FaPaperPlane size={18} />
          </button>
        </div>
      </div>

      {attachments.length > 0 && (
        <div className="attachment-preview-global">
          {attachments.map((file, index) => (
            <div key={index} className="attachment-item">
              <span>📎 {file.name}</span>

              <button
                className="remove-file-btn"
                onClick={() => removeAttachment(index)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LearningPath() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/auth/me", {
          credentials: "include",
        });

        const data = await response.json();

        if (response.ok && data.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };

    fetchUser();
  }, []);

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main">
        <Header user={user} />

        <div className="content">
          <LpBody />
        </div>
      </main>
    </div>
  );
}
