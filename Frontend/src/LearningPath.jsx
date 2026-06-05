import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Components/Sidebar";
import Header from "./Components/Header";
import UserProfile, { user } from "./Components/UserProfile";
import "./LearningPath.css";

import {
  MdSettings,
  MdNotifications,
} from "react-icons/md";

import { FaPaperPlane, FaRobot } from "react-icons/fa";



function LpBody() {
  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(false);

  const chatContainerRef = useRef(null);

  const bottomRef = useRef(null);

  const initialMessage = {
    role: "ai",
    type: "text",
    content:
      "Hi 👋 Tell me what you want to learn and I’ll build a structured learning path for you.",
  };

  const [messages, setMessages] = useState([initialMessage]);

  const [activeModuleIndex, setActiveModuleIndex] =
    useState(null);

  const handleModuleClick = (module, index) => {
    if (module.placeholder) return;

    setActiveModuleIndex((prev) =>
      prev === index ? null : index
    );
  };

  const handleClearChat = () => {
    setMessages([initialMessage]);

    setInput("");

    setLoading(false);

    setActiveModuleIndex(null);
  };

  const generateCurriculum = (topic) => {
    return {
      level: "Beginner",

      description: `Your personalized learning path for "${topic}" is ready.`,

      modules: [
        {
          title: "Frontend Fundamentals",
          week: "Week 1-2",
          desc: "JS ES6+, CSS Grid/Flexbox, DOM manipulation.",
          icon: "terminal",
          color: "blue",

          topics: [
            "HTML Basics",
            "CSS Flexbox & Grid",
            "JavaScript Fundamentals",
            "DOM Manipulation",
          ],
        },

        {
          title: "React Components",
          week: "Week 3-6",
          desc: "Hooks, Context API, state management.",
          icon: "layers",

          topics: [
            "JSX & Components",
            "useState & useEffect",
            "Props & State",
            "Context API",
          ],
        },

        {
          title: "API Integration",
          week: "Week 7-9",
          desc: "REST APIs, async data handling.",
          icon: "api",

          topics: [
            "Fetch API",
            "Axios",
            "Async/Await",
            "Error Handling",
          ],
        },

        {
          title: "Backend Structure",
          week: "Planned",
          desc: "Node.js, databases, authentication systems.",
          icon: "pending",
          placeholder: true,
        },
      ],
    };
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  const handleSend = () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        type: "text",
        content: userMessage,
      },
    ]);

    setInput("");

    setLoading(true);

    setTimeout(() => {
      const curriculum =
        generateCurriculum(userMessage);

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          type: "curriculum",
          data: curriculum,
        },
      ]);

      setLoading(false);
    }, 1500);
  };

  return (
    <div className="container">
      {/* TOP BAR */}
      <div className="chat-top-bar">
        <h2>Build Your Learning Path</h2>

        <button
          className="clear-btn"
          onClick={handleClearChat}
        >
          Clear Chat
        </button>
      </div>

      {/* CHAT AREA */}
      <div
        className="chat-container"
        ref={chatContainerRef}
      >
        {messages.map((msg, index) => (
          <div key={index}>
            {/* USER MESSAGE */}
            {msg.role === "user" && (
              <div className="user-message-wrapper">
                <div className="user-message">
                  <p>{msg.content}</p>
                </div>
              </div>
            )}

            {/* AI TEXT */}
            {msg.role === "ai" &&
              msg.type === "text" && (
                <div className="ai-section">
                  <div className="ai-card">
                    <p>{msg.content}</p>
                  </div>
                </div>
              )}

            {/* AI CURRICULUM */}
            {msg.role === "ai" &&
              msg.type === "curriculum" && (
                <div className="ai-section">
                  <div className="ai-card">
                    <div className="ai-header">
                      <div className="ai-icon">
                        <FaRobot size={24} />
                      </div>

                      <span
                        className={`difficulty ${msg.data.level.toLowerCase()}`}
                      >
                        {msg.data.level}
                      </span>
                    </div>

                    <div className="success-dot"></div>

                    <h3>Curriculum built</h3>

                    <p className="ai-description">
                      {msg.data.description}
                    </p>

                    <div className="modules-grid">
                      {msg.data.modules.map((m, i) => (
                        <div key={i}>
                          <div
                            className={`module ${
                              m.color || ""
                            } ${
                              m.placeholder
                                ? "placeholder"
                                : ""
                            }`}
                            onClick={() =>
                              handleModuleClick(m, i)
                            }
                            style={{
                              cursor: m.placeholder
                                ? "not-allowed"
                                : "pointer",
                            }}
                          >
                            <div className="module-top">
                              <span className="material-symbols-outlined">
                                {m.icon}
                              </span>

                              <span className="badge">
                                {m.week}
                              </span>
                            </div>

                            <h4>{m.title}</h4>

                            <p>{m.desc}</p>
                          </div>

                          {activeModuleIndex === i && (
                            <div className="module-dropdown">
                              {Array.isArray(m.topics) &&
                              m.topics.length > 0 ? (
                                m.topics.map(
                                  (topic, idx) => (
                                    <div
                                      key={idx}
                                      className="topic-item"
                                    >
                                      •{" "}
                                      {typeof topic ===
                                      "string"
                                        ? topic
                                        : topic.title}
                                    </div>
                                  )
                                )
                              ) : (
                                <div className="topic-item">
                                  No topics available
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="actions">
                      <button className="primary-btn">
                        Confirm & Start
                      </button>
                    </div>
                  </div>
                </div>
              )}
          </div>
        ))}

        {/* LOADING */}
        {loading && (
          <div className="ai-section">
            <div className="ai-card">
              <div className="status-row">
                <div className="pulse-dot"></div>

                <h3>Building your curriculum...</h3>
              </div>

              <p className="ai-description">
                Structuring personalized learning
                path...
              </p>
            </div>
          </div>
        )}

        <div ref={bottomRef}></div>
      </div>

      {/* INPUT */}
      <div className="chat-input">
        <input
          className="input"
          type="text"
          placeholder="What do you want to learn..."
          value={input}
          onChange={(e) =>
            setInput(e.target.value)
          }
          onKeyDown={(e) =>
            e.key === "Enter" && handleSend()
          }
        />

        <div className="input-actions">
          <button
            className="send-btn"
            onClick={handleSend}
            aria-label="Send message"
          >
            <FaPaperPlane size={18} />
          </button>
        </div>
      </div>
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