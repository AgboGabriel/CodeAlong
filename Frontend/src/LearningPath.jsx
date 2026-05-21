import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "./assets/Code along_logo-03.png";
import { FaMicrophone, FaPaperPlane, FaRobot } from "react-icons/fa";
import "./LearningPath.css";

import {
  MdDashboard,
  MdMenuBook,
  MdAccountTree,
  MdFolderOpen,
  MdSettings,
  MdNotifications,
  MdAttachFile,
} from "react-icons/md";

const user = {
  name: "Alex Rivera",
  avatar:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCHkmMqD5gKaMYLSydOBQc_Zi7wsLqmErMbtpFZ_5-AzR8-GBVVggx2vz3YzNgs5Hoy-od2NIrLSCZxHox3QfDozggMjyXwAkivdXCAnN8X0SPM_4icaBffmPVNgH8o7hrt7pZetO5A34GxGG7-Wo5ffA5JXpfZ9BYdN4-hnrlIM9xG9MtFYNRE-V08HC6Rw_Eeg7AFzzK5lLrWd9H9tOt37FmZS5CIAKG6brXAECIkUSxxGH6SXwrAFI7L8CN5DIz9nBnx5RSp6YE",
};

const NAV_ITEMS = [
  { icon: MdDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: MdMenuBook, label: "My Lessons", path: "/MyLessons" },
  { icon: MdAccountTree, label: "Learning Path", path: "/LearningPath" },
  { icon: MdFolderOpen, label: "Assessments", path: "/Assessments" },
];

function UserProfile({ small, onClick }) {
  return (
    <>
      <div className={`avatar ${small ? "avatar-sm" : ""}`} onClick={onClick}>
        <img src={user.avatar} alt={user.name} />
      </div>

      {!small && (
        <div className="user-info">
          <div className="user-name">{user.name}</div>
        </div>
      )}
    </>
  );
}

function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <img className="logo-img" src={logo} alt="Logo" />
        </div>
        <span className="logo-text">CodeAlong</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ icon, label, path }) => {
          const Icon = icon;

          return (
            <Link
              key={label}
              to={path}
              className={`nav-item ${
                location.pathname === path ? "active" : ""
              }`}
            >
              <Icon size={30} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <header className="header">
      <div></div>

      <div className="header-right">
        <button className="notif-btn" aria-label="Notifications">
          <MdNotifications size={30} />
          <span className="notif-dot" />
        </button>

        <div className="divider-v" />

        <div className="header-user" ref={dropdownRef}>
          <div
            className="header-user-text"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="user-name">{user.name}</div>
          </div>

          <UserProfile
            small
            onClick={() => setDropdownOpen(!dropdownOpen)}
          />

          <button className="icon-btn" aria-label="Settings">
            <MdSettings size={30} />
          </button>

          {dropdownOpen && (
            <div className="user-dropdown">
              <button className="dropdown-item" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

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
  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main">
        <Header />

        <div className="content">
          <LpBody />
        </div>
      </main>
    </div>
  );
}
