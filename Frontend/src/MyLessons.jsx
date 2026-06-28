import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./MyLessons.css";
import Sidebar from "./Components/Sidebar";
import Header from "./Components/Header";
import { useUser } from "./Components/useUser"; // ← shared hook

import {
  MdAccountTree,
  MdDashboard,
  MdSearch,
  MdFilterList,
  MdPlayCircleFilled,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdFolder,
  MdQuiz,
  MdCode,
  MdLock,
  MdFolderOpen,
  MdMenuBook,
} from "react-icons/md";

const CACHE_KEY = "myLessons_cache";
const CACHE_TTL_MS = 60 * 1000;

function formatPaths(curriculums) {
  return curriculums.map((curriculum) => ({
    id: curriculum.id,
    title: curriculum.title || "Custom Learning Path",
    description:
      curriculum.description ||
      "A confirmed curriculum that you can continue learning.",
    progress: curriculum.progress || 0,
    hours: curriculum.modules?.length ? curriculum.modules.length * 4 : 10,
    level: curriculum.level || "Beginner",
    status: curriculum.status || "In Progress",
    modules: curriculum.modules || [],
  }));
}

export default function MyLessons() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser } = useUser(); // ← instant from cache, no flash

  const [learningPaths, setLearningPaths] = useState([]);
  const [loadingPaths, setLoadingPaths] = useState(true);

  const [selectedPath, setSelectedPath] = useState(null);
  const [filter, setFilter] = useState("All Paths");
  const [searchTerm, setSearchTerm] = useState("");

  const [view, setView] = useState("modules");
  const [selectedModule, setSelectedModule] = useState(null);
  const [expandedTopics, setExpandedTopics] = useState(new Set());

  const [showQuizPopup, setShowQuizPopup] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);

  // Build a Header-compatible user object from the cached auth user.
  // This mirrors what MyLessons previously built from /auth/me.
  const headerUser = authUser
    ? { ...authUser, name: authUser.username || authUser.full_name || authUser.name }
    : null;

  const fetchData = useCallback(async () => {
    const cameFromConfirm = location.state?.fromConfirm === true;
    if (cameFromConfirm) {
      sessionStorage.removeItem(CACHE_KEY);
    }

    if (!cameFromConfirm) {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const { timestamp, paths } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL_MS) {
            setLearningPaths(paths);
            setLoadingPaths(false);
            return;
          }
        }
      } catch (_) {
        // Corrupt cache — fall through to fetch
      }
    }

    // Only fetch curriculum now — user comes from useUser
    try {
      const curriculumRes = await fetch("/api/curriculum", { credentials: "include" });
      const curriculumData = await curriculumRes.json();

      if (!curriculumRes.ok || !curriculumData.success) {
        throw new Error(curriculumData.error || "Failed to fetch curriculums");
      }

      const paths = formatPaths(curriculumData.curriculum);

      sessionStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ timestamp: Date.now(), paths })
      );

      setLearningPaths(paths);
    } catch (error) {
      console.error("Failed to load page data:", error);
    } finally {
      setLoadingPaths(false);
    }
  }, [location.state]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredPaths = learningPaths.filter((path) => {
    const matchesSearch = path.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filter === "All Paths" ||
      path.level === filter ||
      path.status === filter;
    return matchesSearch && matchesFilter;
  });

  const toggleTopic = (index, locked) => {
    if (locked) return;
    setExpandedTopics((prev) => {
      const updated = new Set(prev);
      updated.has(index) ? updated.delete(index) : updated.add(index);
      return updated;
    });
  };

  const handleBack = () => {
    if (view === "topics") {
      setView("modules");
      setSelectedModule(null);
    } else {
      setSelectedPath(null);
      setSelectedModule(null);
      setView("modules");
    }
  };

  const handleQuizClick = (topic) => {
    setSelectedTopic(topic);
    setShowQuizPopup(true);
  };

  const handleHasKnowledge = () => {
    setShowQuizPopup(false);
    navigate("/QuizPage", {
      state: { moduleId: selectedModule?.id, topic: selectedTopic },
    });
  };

  const handleNoKnowledge = () => {
    setShowQuizPopup(false);
    navigate("/Videolesson", {
      state: {
        moduleId: selectedModule?.id,
        topic: selectedTopic,
        video: selectedTopic?.videos?.[0],
      },
    });
  };

  const handleCancelQuiz = () => {
    setShowQuizPopup(false);
    setSelectedTopic(null);
  };

  const openModuleTopics = (module, index) => {
    if (!Array.isArray(module.topics) || module.topics.length === 0) return;
    setSelectedModule({
      id: module.id,
      title: module.title || `Module ${index + 1}`,
      topics: module.topics.map((topic) =>
        typeof topic === "string" ? { title: topic, videos: [] } : topic
      ),
    });
    setExpandedTopics(new Set());
    setView("topics");
  };

  const getModuleState = (module, index) => {
    const status =
      module.status?.toLowerCase() || (index === 0 ? "in-progress" : "locked");
    const isCompleted = status === "completed" || status === "complete";
    const isActive = status === "active" || status === "in-progress";
    const isLocked = status === "locked";
    return {
      isCompleted,
      isActive,
      isLocked,
      cardClass: isLocked ? "locked-module" : isActive ? "active-module" : "completed",
      iconClass: isLocked ? "locked-icon" : isActive ? "active-icon" : "complete-icon",
      statusClass: isLocked ? "locked-status" : isActive ? "active-status" : "completed-status",
      statusLabel: isLocked ? "LOCKED" : isActive ? "IN PROGRESS" : "COMPLETED",
      buttonClass: isLocked ? "locked-btn" : "primary-btn",
      buttonLabel: isLocked ? "Start Module" : isActive ? "Continue Learning" : "Review Lessons",
    };
  };

  const visibleModules = Array.isArray(selectedPath?.modules)
    ? selectedPath.modules
    : [];

  if (loadingPaths) {
    return (
      <div className="app-shell">
        <Sidebar />
        <main className="main">
          <Header user={headerUser} />
          <div className="content">
            <div className="content-inner">
              <div className="lessons-header">
                <div>
                  <p className="lesson-badge">✨ Custom Learning Paths</p>
                  <h1>Choose Your Learning Path</h1>
                </div>
              </div>
              <div className="curriculum-grid">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="curriculum-card" style={{ opacity: 0.4, pointerEvents: "none" }}>
                    <div className="curriculum-content">
                      <div style={{ height: 24, background: "#e5e7eb", borderRadius: 6, marginBottom: 12, width: "60%" }} />
                      <div style={{ height: 16, background: "#e5e7eb", borderRadius: 6, marginBottom: 8, width: "90%" }} />
                      <div style={{ height: 16, background: "#e5e7eb", borderRadius: 6, width: "75%" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!selectedPath) {
    return (
      <div className="app-shell">
        <Sidebar />
        <main className="main">
          <Header user={headerUser} />
          <div className="content">
            <div className="content-inner">
              <div className="lessons-header">
                <div>
                  <p className="lesson-badge">✨ Custom Learning Paths</p>
                  <h1>Choose Your Learning Path</h1>
                  <p className="lesson-subtitle">
                    Start exploring your personalized learning paths.
                  </p>
                </div>
                <div className="lesson-controls">
                  <div className="lesson-search">
                    <MdSearch className="lesson-search-icon" size={22} />
                    <input
                      type="text"
                      placeholder="Search learning paths..."
                      className="lesson-search-input"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="filter-wrap">
                    <MdFilterList className="filter-icon" size={22} />
                    <select
                      className="lesson-filter"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <option>All Paths</option>
                      <option>In Progress</option>
                      <option>Completed</option>
                      <option>Not Started</option>
                      <option>Intermediate</option>
                      <option>Beginner</option>
                      <option>Advanced</option>
                    </select>
                  </div>
                </div>
              </div>

              {filteredPaths.length === 0 ? (
                <div className="empty-state">Ooops! There's nothing here</div>
              ) : (
                <div className="curriculum-grid">
                  {filteredPaths.map((path) => (
                    <div className="curriculum-card" key={path.id}>
                      <div className="curriculum-content">
                        <h3>{path.title}</h3>
                        <p>{path.description}</p>
                        <div className="curriculum-meta">
                          <span>{path.progress}% Completed</span>
                          <span>•</span>
                          <span className="duration">⏱ {path.hours} Hours</span>
                          <span>•</span>
                          <span className={`difficulty-badge ${path.level.toLowerCase()}`}>
                            {path.level}
                          </span>
                        </div>
                        <button
                          className="curriculum-btn"
                          onClick={() => setSelectedPath(path)}
                        >
                          Go to Path
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main">
        <Header user={headerUser} />
        <div className="content">
          <div className="content-inner">
            <div className="learning-header">
              <button className="back-btn" onClick={handleBack}>← Back</button>
              <h1>{selectedPath.title}</h1>
              <div className="progress-row">
                <div className="progress-wrap">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${selectedPath.progress}%` }} />
                  </div>
                  <span className="overall-progress">{selectedPath.progress}% Overall Progress</span>
                </div>
                <div className="time-left">⏱ {selectedPath.hours} hours</div>
              </div>
            </div>

            {view === "modules" && (
              <div className="modules">
                {visibleModules.length === 0 ? (
                  <div className="empty-state">No modules found for this curriculum.</div>
                ) : (
                  visibleModules.map((module, index) => {
                    const ms = getModuleState(module, index);
                    const hasTopics = Array.isArray(module.topics) && module.topics.length > 0;
                    return (
                      <div className={`module-card ${ms.cardClass}`} key={module.id || index}>
                        <div className={`module-icon ${ms.iconClass}`}>
                          {ms.isCompleted ? "✓" : <MdPlayCircleFilled />}
                        </div>
                        <div className="module-content">
                          <div className="module-top">
                            <h3>{module.title || `Module ${index + 1}`}</h3>
                            <span className={`status ${ms.statusClass}`}>{ms.statusLabel}</span>
                          </div>
                          <p>{module.description || module.desc || "No description available."}</p>
                          <div className="module-actions">
                            <button
                              className={ms.buttonClass}
                              disabled={ms.isLocked || !hasTopics}
                              onClick={() => openModuleTopics(module, index)}
                            >
                              {ms.buttonLabel}
                            </button>
                          </div>
                          {ms.isLocked && (
                            <div className="locked-tooltip">
                              Unlock this module by completing the previous module
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {view === "topics" && selectedModule && (
              <div className="curriculum-page">
                <div className="curriculum-header">
                  <h1>{selectedModule.title}</h1>
                  <p>Select a topic to expand lessons</p>
                </div>
                <div className="topics-list">
                  {selectedModule.topics.map((topic, index) => {
                    // Derive locked state from DB status field.
                    // 'active' and 'unlocked' are open; 'locked' is locked; 'completed' is done.
                    const status = (topic.status || "locked").toLowerCase();
                    const isLocked = status === "locked";
                    const isCompleted = status === "completed";

                    return (
                      <div
                        key={topic.id || index}
                        className={`topic-card${isLocked ? " locked-topic-card" : ""}${isCompleted ? " completed-topic-card" : ""}`}
                      >
                        <div
                          className={`topic-header${isLocked ? " locked-topic" : ""}`}
                          onClick={() => !isLocked && toggleTopic(index, false)}
                          style={{ cursor: isLocked ? "not-allowed" : "pointer" }}
                        >
                          <div className="topic-title">
                            {isCompleted
                              ? <MdFolderOpen className="topic-icon" style={{ color: "#22c55e" }} />
                              : isLocked
                              ? <MdLock className="topic-icon" style={{ color: "#94a3b8" }} />
                              : <MdFolder className="topic-icon" />}
                            <h3 style={{ color: isLocked ? "#94a3b8" : undefined }}>{topic.title}</h3>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {isCompleted && <span className="topic-badge completed-badge">✓ Done</span>}
                            {isLocked && <span className="topic-badge locked-badge">🔒 Locked</span>}
                            {!isLocked && !isCompleted && <span className="topic-badge unlocked-badge">Available</span>}
                            {!isLocked && (expandedTopics.has(index) ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />)}
                          </div>
                        </div>

                        {isLocked && (
                          <p className="locked-topic-msg">
                            Complete the previous topic's coding challenge to unlock this topic.
                          </p>
                        )}

                        {!isLocked && expandedTopics.has(index) && (
                          <div className="video-list">
                            <div className="quiz-item" onClick={() => handleQuizClick(topic)}>
                              <MdQuiz className="quiz-icon" />
                              <span>Prior Knowledge Check</span>
                            </div>
                            {(topic.videos || []).map((video, i) => (
                              <Link
                                key={video.videoId || i}
                                to="/Videolesson"
                                state={{ moduleId: selectedModule?.id, topic, video }}
                                className="video-link"
                              >
                                <div className="video-item">
                                  <MdPlayCircleFilled className="video-icon" />
                                  <span>{video.title}</span>
                                </div>
                              </Link>
                            ))}
                            <Link
                              to="/challenges"
                              state={{ moduleId: selectedModule?.id, topic }}
                              className="challenge-link"
                            >
                              <div className="challenge-item">
                                <MdCode className="challenge-icon" />
                                <span>Coding Challenge — {topic.title}</span>
                              </div>
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {showQuizPopup && (
              <div className="quiz-popup-overlay">
                <div className="quiz-popup">
                  <button className="popup-close-btn" onClick={handleCancelQuiz}>×</button>
                  <h2>Prior Knowledge Check</h2>
                  <p>
                    Do you already have prior knowledge about{" "}
                    <strong>{selectedTopic?.title}</strong>?
                  </p>
                  <div className="popup-buttons">
                    <button className="yes-btn" onClick={handleHasKnowledge}>Yes</button>
                    <button className="no-btn" onClick={handleNoKnowledge}>No</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
