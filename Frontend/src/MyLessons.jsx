// import { useEffect, useState, useCallback } from "react";
// import { Link, useNavigate, useLocation } from "react-router-dom";
// import "./MyLessons.css";
// import Sidebar from "./Components/Sidebar";
// import Header from "./Components/Header";
// import { useUser } from "./Components/useUser"; // ← shared hook

// import {
//   MdAccountTree,
//   MdDashboard,
//   MdSearch,
//   MdFilterList,
//   MdPlayCircleFilled,
//   MdKeyboardArrowDown,
//   MdKeyboardArrowUp,
//   MdFolder,
//   MdQuiz,
//   MdCode,
//   MdLock,
//   MdFolderOpen,
//   MdMenuBook,
// } from "react-icons/md";

// const CACHE_KEY = "myLessons_cache";
// const CACHE_TTL_MS = 60 * 1000;

// function formatPaths(curriculums) {
//   return curriculums.map((curriculum) => ({
//     id: curriculum.id,
//     title: curriculum.title || "Custom Learning Path",
//     description:
//       curriculum.description ||
//       "A confirmed curriculum that you can continue learning.",
//     progress: curriculum.progress || 0,
//     hours: curriculum.modules?.length ? curriculum.modules.length * 4 : 10,
//     level: curriculum.level || "Beginner",
//     status: curriculum.status || "In Progress",
//     modules: curriculum.modules || [],
//   }));
// }

// export default function MyLessons() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { user: authUser } = useUser(); // ← instant from cache, no flash

//   const [learningPaths, setLearningPaths] = useState([]);
//   const [loadingPaths, setLoadingPaths] = useState(true);

//   const [selectedPath, setSelectedPath] = useState(null);
//   const [filter, setFilter] = useState("All Paths");
//   const [searchTerm, setSearchTerm] = useState("");

//   const [view, setView] = useState("modules");
//   const [selectedModule, setSelectedModule] = useState(null);
//   const [expandedTopics, setExpandedTopics] = useState(new Set());

//   const [showQuizPopup, setShowQuizPopup] = useState(false);
//   const [selectedTopic, setSelectedTopic] = useState(null);

//   // Build a Header-compatible user object from the cached auth user.
//   // This mirrors what MyLessons previously built from /auth/me.
//   const headerUser = authUser
//     ? { ...authUser, name: authUser.username || authUser.full_name || authUser.name }
//     : null;

//   const fetchData = useCallback(async () => {
//     const cameFromConfirm = location.state?.fromConfirm === true;
//     if (cameFromConfirm) {
//       sessionStorage.removeItem(CACHE_KEY);
//     }

//     if (!cameFromConfirm) {
//       try {
//         const cached = sessionStorage.getItem(CACHE_KEY);
//         if (cached) {
//           const { timestamp, paths } = JSON.parse(cached);
//           if (Date.now() - timestamp < CACHE_TTL_MS) {
//             setLearningPaths(paths);
//             setLoadingPaths(false);
//             return;
//           }
//         }
//       } catch (_) {
//         // Corrupt cache — fall through to fetch
//       }
//     }

//     // Only fetch curriculum now — user comes from useUser
//     try {
//       const curriculumRes = await fetch("/api/curriculum", { credentials: "include" });
//       const curriculumData = await curriculumRes.json();

//       if (!curriculumRes.ok || !curriculumData.success) {
//         throw new Error(curriculumData.error || "Failed to fetch curriculums");
//       }

//       const paths = formatPaths(curriculumData.curriculum);

//       sessionStorage.setItem(
//         CACHE_KEY,
//         JSON.stringify({ timestamp: Date.now(), paths })
//       );

//       setLearningPaths(paths);
//     } catch (error) {
//       console.error("Failed to load page data:", error);
//     } finally {
//       setLoadingPaths(false);
//     }
//   }, [location.state]);

//   useEffect(() => {
//     fetchData();
//   }, [fetchData]);

//   const filteredPaths = learningPaths.filter((path) => {
//     const matchesSearch = path.title
//       .toLowerCase()
//       .includes(searchTerm.toLowerCase());
//     const matchesFilter =
//       filter === "All Paths" ||
//       path.level === filter ||
//       path.status === filter;
//     return matchesSearch && matchesFilter;
//   });

//   const toggleTopic = (index, locked) => {
//     if (locked) return;
//     setExpandedTopics((prev) => {
//       const updated = new Set(prev);
//       updated.has(index) ? updated.delete(index) : updated.add(index);
//       return updated;
//     });
//   };

//   const handleBack = () => {
//     if (view === "topics") {
//       setView("modules");
//       setSelectedModule(null);
//     } else {
//       setSelectedPath(null);
//       setSelectedModule(null);
//       setView("modules");
//     }
//   };

//   const handleQuizClick = (topic) => {
//     setSelectedTopic(topic);
//     setShowQuizPopup(true);
//   };

//   const handleHasKnowledge = () => {
//     setShowQuizPopup(false);
//     navigate("/QuizPage", {
//       state: { moduleId: selectedModule?.id, topic: selectedTopic },
//     });
//   };

//   const handleNoKnowledge = () => {
//     setShowQuizPopup(false);
//     navigate("/Videolesson", {
//       state: {
//         moduleId: selectedModule?.id,
//         topic: selectedTopic,
//         video: selectedTopic?.videos?.[0],
//       },
//     });
//   };

//   const handleCancelQuiz = () => {
//     setShowQuizPopup(false);
//     setSelectedTopic(null);
//   };

//   const openModuleTopics = (module, index) => {
//     if (!Array.isArray(module.topics) || module.topics.length === 0) return;
//     setSelectedModule({
//       id: module.id,
//       title: module.title || `Module ${index + 1}`,
//       topics: module.topics.map((topic) =>
//         typeof topic === "string" ? { title: topic, videos: [] } : topic
//       ),
//     });
//     setExpandedTopics(new Set());
//     setView("topics");
//   };

//   const getModuleState = (module, index) => {
//     const status =
//       module.status?.toLowerCase() || (index === 0 ? "in-progress" : "locked");
//     const isCompleted = status === "completed" || status === "complete";
//     const isActive = status === "active" || status === "in-progress";
//     const isLocked = status === "locked";
//     return {
//       isCompleted,
//       isActive,
//       isLocked,
//       cardClass: isLocked ? "locked-module" : isActive ? "active-module" : "completed",
//       iconClass: isLocked ? "locked-icon" : isActive ? "active-icon" : "complete-icon",
//       statusClass: isLocked ? "locked-status" : isActive ? "active-status" : "completed-status",
//       statusLabel: isLocked ? "LOCKED" : isActive ? "IN PROGRESS" : "COMPLETED",
//       buttonClass: isLocked ? "locked-btn" : "primary-btn",
//       buttonLabel: isLocked ? "Start Module" : isActive ? "Continue Learning" : "Review Lessons",
//     };
//   };

//   const visibleModules = Array.isArray(selectedPath?.modules)
//     ? selectedPath.modules
//     : [];

//   if (loadingPaths) {
//     return (
//       <div className="app-shell">
//         <Sidebar />
//         <main className="main">
//           <Header user={headerUser} />
//           <div className="content">
//             <div className="content-inner">
//               <div className="lessons-header">
//                 <div>
//                   <p className="lesson-badge">✨ Custom Learning Paths</p>
//                   <h1>Choose Your Learning Path</h1>
//                 </div>
//               </div>
//               <div className="curriculum-grid">
//                 {[1, 2, 3].map((i) => (
//                   <div key={i} className="curriculum-card" style={{ opacity: 0.4, pointerEvents: "none" }}>
//                     <div className="curriculum-content">
//                       <div style={{ height: 24, background: "#e5e7eb", borderRadius: 6, marginBottom: 12, width: "60%" }} />
//                       <div style={{ height: 16, background: "#e5e7eb", borderRadius: 6, marginBottom: 8, width: "90%" }} />
//                       <div style={{ height: 16, background: "#e5e7eb", borderRadius: 6, width: "75%" }} />
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </main>
//       </div>
//     );
//   }

//   if (!selectedPath) {
//     return (
//       <div className="app-shell">
//         <Sidebar />
//         <main className="main">
//           <Header user={headerUser} />
//           <div className="content">
//             <div className="content-inner">
//               <div className="lessons-header">
//                 <div>
//                   <p className="lesson-badge">✨ Custom Learning Paths</p>
//                   <h1>Choose Your Learning Path</h1>
//                   <p className="lesson-subtitle">
//                     Start exploring your personalized learning paths.
//                   </p>
//                 </div>
//                 <div className="lesson-controls">
//                   <div className="lesson-search">
//                     <MdSearch className="lesson-search-icon" size={22} />
//                     <input
//                       type="text"
//                       placeholder="Search learning paths..."
//                       className="lesson-search-input"
//                       value={searchTerm}
//                       onChange={(e) => setSearchTerm(e.target.value)}
//                     />
//                   </div>
//                   <div className="filter-wrap">
//                     <MdFilterList className="filter-icon" size={22} />
//                     <select
//                       className="lesson-filter"
//                       value={filter}
//                       onChange={(e) => setFilter(e.target.value)}
//                     >
//                       <option>All Paths</option>
//                       <option>In Progress</option>
//                       <option>Completed</option>
//                       <option>Not Started</option>
//                       <option>Intermediate</option>
//                       <option>Beginner</option>
//                       <option>Advanced</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               {filteredPaths.length === 0 ? (
//                 <div className="empty-state">Ooops! There's nothing here</div>
//               ) : (
//                 <div className="curriculum-grid">
//                   {filteredPaths.map((path) => (
//                     <div className="curriculum-card" key={path.id}>
//                       <div className="curriculum-content">
//                         <h3>{path.title}</h3>
//                         <p>{path.description}</p>
//                         <div className="curriculum-meta">
//                           <span>{path.progress}% Completed</span>
//                           <span>•</span>
//                           <span className="duration">⏱ {path.hours} Hours</span>
//                           <span>•</span>
//                           <span className={`difficulty-badge ${path.level.toLowerCase()}`}>
//                             {path.level}
//                           </span>
//                         </div>
//                         <button
//                           className="curriculum-btn"
//                           onClick={() => setSelectedPath(path)}
//                         >
//                           Go to Path
//                         </button>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         </main>
//       </div>
//     );
//   }

//   return (
//     <div className="app-shell">
//       <Sidebar />
//       <main className="main">
//         <Header user={headerUser} />
//         <div className="content">
//           <div className="content-inner">
//             <div className="learning-header">
//               <button className="back-btn" onClick={handleBack}>← Back</button>
//               <h1>{selectedPath.title}</h1>
//               <div className="progress-row">
//                 <div className="progress-wrap">
//                   <div className="progress-bar">
//                     <div className="progress-fill" style={{ width: `${selectedPath.progress}%` }} />
//                   </div>
//                   <span className="overall-progress">{selectedPath.progress}% Overall Progress</span>
//                 </div>
//                 <div className="time-left">⏱ {selectedPath.hours} hours</div>
//               </div>
//             </div>

//             {view === "modules" && (
//               <div className="modules">
//                 {visibleModules.length === 0 ? (
//                   <div className="empty-state">No modules found for this curriculum.</div>
//                 ) : (
//                   visibleModules.map((module, index) => {
//                     const ms = getModuleState(module, index);
//                     const hasTopics = Array.isArray(module.topics) && module.topics.length > 0;
//                     return (
//                       <div className={`module-card ${ms.cardClass}`} key={module.id || index}>
//                         <div className={`module-icon ${ms.iconClass}`}>
//                           {ms.isCompleted ? "✓" : <MdPlayCircleFilled />}
//                         </div>
//                         <div className="module-content">
//                           <div className="module-top">
//                             <h3>{module.title || `Module ${index + 1}`}</h3>
//                             <span className={`status ${ms.statusClass}`}>{ms.statusLabel}</span>
//                           </div>
//                           <p>{module.description || module.desc || "No description available."}</p>
//                           <div className="module-actions">
//                             <button
//                               className={ms.buttonClass}
//                               disabled={ms.isLocked || !hasTopics}
//                               onClick={() => openModuleTopics(module, index)}
//                             >
//                               {ms.buttonLabel}
//                             </button>
//                           </div>
//                           {ms.isLocked && (
//                             <div className="locked-tooltip">
//                               Unlock this module by completing the previous module
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     );
//                   })
//                 )}
//               </div>
//             )}

//             {view === "topics" && selectedModule && (
//               <div className="curriculum-page">
//                 <div className="curriculum-header">
//                   <h1>{selectedModule.title}</h1>
//                   <p>Select a topic to expand lessons</p>
//                 </div>
//                 <div className="topics-list">
//                   {selectedModule.topics.map((topic, index) => {
//                     // Derive locked state from DB status field.
//                     // 'active' and 'unlocked' are open; 'locked' is locked; 'completed' is done.
//                     const status = (topic.status || "locked").toLowerCase();
//                     const isLocked = status === "locked";
//                     const isCompleted = status === "completed";

//                     return (
//                       <div
//                         key={topic.id || index}
//                         className={`topic-card${isLocked ? " locked-topic-card" : ""}${isCompleted ? " completed-topic-card" : ""}`}
//                       >
//                         <div
//                           className={`topic-header${isLocked ? " locked-topic" : ""}`}
//                           onClick={() => !isLocked && toggleTopic(index, false)}
//                           style={{ cursor: isLocked ? "not-allowed" : "pointer" }}
//                         >
//                           <div className="topic-title">
//                             {isCompleted
//                               ? <MdFolderOpen className="topic-icon" style={{ color: "#22c55e" }} />
//                               : isLocked
//                               ? <MdLock className="topic-icon" style={{ color: "#94a3b8" }} />
//                               : <MdFolder className="topic-icon" />}
//                             <h3 style={{ color: isLocked ? "#94a3b8" : undefined }}>{topic.title}</h3>
//                           </div>
//                           <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                             {isCompleted && <span className="topic-badge completed-badge">✓ Done</span>}
//                             {isLocked && <span className="topic-badge locked-badge">🔒 Locked</span>}
//                             {!isLocked && !isCompleted && <span className="topic-badge unlocked-badge">Available</span>}
//                             {!isLocked && (expandedTopics.has(index) ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />)}
//                           </div>
//                         </div>

//                         {isLocked && (
//                           <p className="locked-topic-msg">
//                             Complete the previous topic's coding challenge to unlock this topic.
//                           </p>
//                         )}

//                         {!isLocked && expandedTopics.has(index) && (
//                           <div className="video-list">
//                             <div className="quiz-item" onClick={() => handleQuizClick(topic)}>
//                               <MdQuiz className="quiz-icon" />
//                               <span>Prior Knowledge Check</span>
//                             </div>
//                             {(topic.videos || []).map((video, i) => (
//                               <Link
//                                 key={video.videoId || i}
//                                 to="/Videolesson"
//                                 state={{ moduleId: selectedModule?.id, topic, video }}
//                                 className="video-link"
//                               >
//                                 <div className="video-item">
//                                   <MdPlayCircleFilled className="video-icon" />
//                                   <span>{video.title}</span>
//                                 </div>
//                               </Link>
//                             ))}
//                             <Link
//                               to="/challenges"
//                               state={{ moduleId: selectedModule?.id, topic }}
//                               className="challenge-link"
//                             >
//                               <div className="challenge-item">
//                                 <MdCode className="challenge-icon" />
//                                 <span>Coding Challenge — {topic.title}</span>
//                               </div>
//                             </Link>
//                           </div>
//                         )}
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             )}

//             {showQuizPopup && (
//               <div className="quiz-popup-overlay">
//                 <div className="quiz-popup">
//                   <button className="popup-close-btn" onClick={handleCancelQuiz}>×</button>
//                   <h2>Prior Knowledge Check</h2>
//                   <p>
//                     Do you already have prior knowledge about{" "}
//                     <strong>{selectedTopic?.title}</strong>?
//                   </p>
//                   <div className="popup-buttons">
//                     <button className="yes-btn" onClick={handleHasKnowledge}>Yes</button>
//                     <button className="no-btn" onClick={handleNoKnowledge}>No</button>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// }


import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./MyLessons.css";
import Sidebar from "./Components/Sidebar";
import Header from "./Components/Header";
import { useUser } from "./Components/useUser"; // ← shared hook

import {
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
  MdDeleteOutline,
} from "react-icons/md";

const CACHE_KEY = "myLessons_cache";
const CACHE_TTL_MS = 60 * 1000;

function inferDifficultyFromText(text = "") {
  const normalized = text.toLowerCase();

  const beginnerPatterns = [
    "intro",
    "introduction",
    "beginner",
    "fundamentals",
    "basics",
    "variables",
    "functions",
    "conditionals",
    "loops",
    "arrays",
    "objects",
    "strings",
    "get started",
    "foundations",
  ];

  const advancedPatterns = [
    "advanced",
    "architecture",
    "distributed",
    "performance",
    "optimization",
    "security",
    "scaling",
    "deployment",
    "system design",
    "production",
    "microservices",
    "refactor",
    "debugging",
  ];

  if (advancedPatterns.some((pattern) => normalized.includes(pattern))) {
    return "Advanced";
  }

  if (beginnerPatterns.some((pattern) => normalized.includes(pattern))) {
    return "Beginner";
  }

  return "Intermediate";
}

function estimatePathDuration(curriculum) {
  const modules = Array.isArray(curriculum?.modules) ? curriculum.modules : [];
  const topicCount = modules.reduce((count, module) => {
    const topics = Array.isArray(module?.topics) ? module.topics : [];
    return count + topics.length;
  }, 0);

  if (topicCount === 0) {
    return 0;
  }

  const durationHours = Math.max(1, Math.ceil((topicCount * 1.5) + (modules.length * 1.25)));
  return durationHours;
}

function computeCurriculumProgress(curriculum, masteryByCurriculum = {}) {
  const modules = Array.isArray(curriculum?.modules) ? curriculum.modules : [];
  const allTopics = modules.flatMap((module) => (Array.isArray(module?.topics) ? module.topics : []));

  if (allTopics.length === 0) {
    return 0;
  }

  const masteryValues = allTopics.map((topic) => {
    const topicId = topic?.id;
    const masteryValue = masteryByCurriculum[topicId];

    if (typeof masteryValue === "number") {
      return Math.min(1, Math.max(0, masteryValue));
    }

    const status = String(topic?.status || "").toLowerCase();
    if (status === "completed" || status === "complete") {
      return 1;
    }

    return 0;
  });

  const average = masteryValues.reduce((sum, value) => sum + value, 0) / masteryValues.length;
  return Math.round(average * 100);
}

function formatPaths(curriculums, masteryMap = {}) {
  return curriculums.map((curriculum) => {
    const modules = Array.isArray(curriculum.modules) ? curriculum.modules : [];
    const pathText = [curriculum.title, curriculum.description, ...modules.map((module) => `${module.title || ""} ${module.description || ""}`)].join(" ");
    const providedLevel = curriculum.level || curriculum.difficulty;
    const providedDuration = Number(curriculum.estimated_duration ?? curriculum.estimatedDuration ?? 0);

    return {
      id: curriculum.id,
      title: curriculum.title || "Custom Learning Path",
      description:
        curriculum.description ||
        "A confirmed curriculum that you can continue learning.",
      progress: computeCurriculumProgress(curriculum, masteryMap),
      hours: providedDuration > 0 ? providedDuration : estimatePathDuration(curriculum),
      level: providedLevel || inferDifficultyFromText(pathText),
      status: curriculum.status || "In Progress",
      modules: modules,
    };
  });
}

export default function MyLessons() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser } = useUser(); // ← instant from cache, no flash

  const [learningPaths, setLearningPaths] = useState([]);
  const [loadingPaths, setLoadingPaths] = useState(true);
  const [deletingPathId, setDeletingPathId] = useState(null);
  const [pathPendingDeletion, setPathPendingDeletion] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  const [selectedPath, setSelectedPath] = useState(null);
  const [filter, setFilter] = useState("All Paths");
  const [searchTerm, setSearchTerm] = useState("");

  const [view, setView] = useState("modules");
  const [selectedModule, setSelectedModule] = useState(null);
  const [expandedTopics, setExpandedTopics] = useState(new Set());

  const [showQuizPopup, setShowQuizPopup] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);

  // Build a Header-compatible user object from the cached auth user.
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
      } catch {
        // Corrupt cache — fall through to fetch
      }
    }

    try {
      const [curriculumRes, analyticsRes] = await Promise.all([
        fetch("/api/curriculum", { credentials: "include" }),
        fetch("/api/analytics/me", { credentials: "include" }),
      ]);

      const curriculumData = await curriculumRes.json();
      const analyticsData = await analyticsRes.json();

      if (!curriculumRes.ok || !curriculumData.success) {
        throw new Error(curriculumData.error || "Failed to fetch curriculums");
      }

      if (!analyticsRes.ok) {
        console.warn("Failed to load mastery analytics for curriculum progress:", analyticsData?.error || "Unknown error");
      }

      const masteryMap = {};
      const topicRows = Array.isArray(analyticsData?.topics) ? analyticsData.topics : [];

      topicRows.forEach((topic) => {
        const topicId = topic?.topic_id;
        if (!topicId) return;

        const masteryValue = Number(topic?.mastery_probability ?? 0);
        masteryMap[topicId] = Number.isFinite(masteryValue) ? masteryValue : 0;
      });

      const paths = formatPaths(curriculumData.curriculum, masteryMap);

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

  const handleDeletePath = async () => {
    if (!pathPendingDeletion) return;

    const path = pathPendingDeletion;
    setDeleteError("");
    setDeletingPathId(path.id);

    try {
      const response = await fetch(`/api/curriculum/${path.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to delete this learning path");
      }

      setLearningPaths((paths) => paths.filter(({ id }) => id !== path.id));
      sessionStorage.removeItem(CACHE_KEY);
      setPathPendingDeletion(null);

      if (selectedPath?.id === path.id) {
        setSelectedPath(null);
        setSelectedModule(null);
        setView("modules");
      }
    } catch (error) {
      console.error("Failed to delete learning path:", error);
      setDeleteError(error.message || "Unable to delete this learning path. Please try again.");
    } finally {
      setDeletingPathId(null);
    }
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
    const topics = Array.isArray(module.topics) ? module.topics : [];
    const topicStatuses = topics.map((topic) => String(topic.status || "").toLowerCase());
    const hasUnlockedTopic = topicStatuses.some((status) =>
      ["unlocked", "active", "in_progress", "in-progress"].includes(status)
    );
    const allTopicsCompleted = topics.length > 0 && topicStatuses.every((status) =>
      ["completed", "complete"].includes(status)
    );
    const moduleStatus =
      module.status?.toLowerCase() || (index === 0 ? "in-progress" : "locked");

    // Topic progress is the source of truth: an unlocked topic means the
    // learner can continue, even if a cached module status is stale.
    const isCompleted = allTopicsCompleted;
    const isActive = !isCompleted && (hasUnlockedTopic || ["active", "in_progress", "in-progress"].includes(moduleStatus));
    const isLocked = !isCompleted && !isActive;
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
          <Header user={headerUser} page="My Lessons" />
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
          <Header user={headerUser} page="My Lessons" />
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
                  {deleteError && <p className="delete-path-error" role="alert">{deleteError}</p>}
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
                        <div className="curriculum-actions">
                          <button
                            className="curriculum-btn"
                            onClick={() => setSelectedPath(path)}
                          >
                            Go to Path
                          </button>
                          <button
                            className="delete-path-btn"
                            onClick={() => setPathPendingDeletion(path)}
                            disabled={deletingPathId === path.id}
                            aria-label={`Delete ${path.title}`}
                          >
                            <MdDeleteOutline size={19} aria-hidden="true" />
                            {deletingPathId === path.id ? "Deleting…" : "Delete Path"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {pathPendingDeletion && (
                <div className="delete-dialog-overlay" role="presentation">
                  <section
                    className="delete-dialog"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-path-title"
                  >
                    <div className="delete-dialog-icon"><MdDeleteOutline size={28} /></div>
                    <h2 id="delete-path-title">Delete learning path?</h2>
                    <p>
                      Delete “{pathPendingDeletion.title}”? This will permanently remove
                      the path and its progress.
                    </p>
                    <div className="delete-dialog-actions">
                      <button
                        className="delete-dialog-cancel"
                        onClick={() => setPathPendingDeletion(null)}
                        disabled={deletingPathId === pathPendingDeletion.id}
                      >
                        Cancel
                      </button>
                      <button
                        className="delete-dialog-confirm"
                        onClick={handleDeletePath}
                        disabled={deletingPathId === pathPendingDeletion.id}
                      >
                        {deletingPathId === pathPendingDeletion.id ? "Deleting…" : "Delete Path"}
                      </button>
                    </div>
                  </section>
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
        <Header user={headerUser} page={selectedPath.title} />
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
                          <p className="locked-tooltip locked-topic-msg">
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
