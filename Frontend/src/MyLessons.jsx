import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "./assets/Code along_logo-03.png";
import "./MyLessons.css";

import {
  MdDashboard,
  MdMenuBook,
  MdAccountTree,
  MdFolderOpen,
  MdSettings,
  MdNotifications,
  MdSearch,
  MdDelete,
  MdFilterList,
  MdPlayCircleFilled,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdFolder,
  MdQuiz,
  MdCode,
} from "react-icons/md";

// const user = {
//   name: "Alex Rivera",
//   avatar:
//     "https://lh3.googleusercontent.com/aida-public/AB6AXuCHkmMqD5gKaMYLSydOBQc_Zi7wsLqmErMbtpFZ_5-AzR8-GBVVggx2vz3YzNgs5Hoy-od2NIrLSCZxHox3QfDozggMjyXwAkivdXCAnN8X0SPM_4icaBffmPVNgH8o7hrt7pZetO5A34GxGG7-Wo5ffA5JXpfZ9BYdN4-hnrlIM9xG9MtFYNRE-V08HC6Rw_Eeg7AFzzK5lLrWd9H9tOt37FmZS5CIAKG6brXAECIkUSxxGH6SXwrAFI7L8CN5DIz9nBnx5RSp6YE",
// };

const NAV_ITEMS = [
  { icon: MdDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: MdMenuBook, label: "My Lessons", path: "/MyLessons" },
  { icon: MdAccountTree, label: "Learning Path", path: "/LearningPath" },
  { icon: MdFolderOpen, label: "Assessments", path: "/Assessments" },
];

// function UserProfile({ small, onClick ,user}) {
//   return (
//     <>
//       <div className={`avatar ${small ? "avatar-sm" : ""}`} onClick={onClick}>
//         <img src={user.avatar} alt={user.name} />
//       </div>

//       {!small && (
//         <div className="user-info">
//           <div className="user-name">{user.name}</div>
//         </div>
//       )}
//     </>
//   );
// }
function UserProfile({ small, onClick, user }) {
  return (
    <>
      <div
        className={`avatar ${small ? "avatar-sm" : ""}`}
        onClick={onClick}
      >
        <span className="avatar-initials">
          {user.initials}
        </span>
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

function Header({user}) {
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
    <header user={user} className="header">
      <div className="search-wrap">
        
      </div>

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
            user={user}
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

export default function MyLessons() {
  const navigate = useNavigate();
  const [user,setUser]=useState({
  name: "",
  initials:"",
});


  const [selectedPath, setSelectedPath] = useState(null);
  const [filter, setFilter] = useState("All Paths");
  const [searchTerm, setSearchTerm] = useState("");

const [learningPaths, setLearningPaths] = useState([]);
const [loadingPaths, setLoadingPaths] = useState(true);
const generateInitials = (name) => {
  if (!name) return "";

  const parts = name.trim().split(" ");

  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }

  return (
    parts[0][0] + parts[1][0]
  ).toUpperCase();
};
useEffect(() => {
  const fetchUser = async () => {
    try {
      const response = await fetch("/auth/me", {
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok && data.user) {
        setUser({
          name: data.user.username,
          initials: generateInitials(data.user.username),
        });
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
    }
  };

  fetchUser();
}, []);

useEffect(() => {
  const fetchCurriculums = async () => {
    try {
      const response = await fetch("/api/curriculum", {
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Failed to fetch curriculums"
        );
      }

      const formattedPaths = data.curriculum.map((curriculum) => ({
        id: curriculum.id,

        title:
          curriculum.title ||
          "Custom Learning Path",

        description:
          curriculum.description ||
          "A confirmed curriculum that you can continue learning.",

        progress: curriculum.progress || 0,

        hours:
          curriculum.modules?.length
            ? curriculum.modules.length * 4
            : 10,

        level:
          curriculum.level || "Beginner",

        status:
          curriculum.status || "In Progress",

        modules:
          curriculum.modules || [],
      }));

      setLearningPaths(formattedPaths);

    } catch (error) {
      console.error(
        "Failed to fetch curriculums:",
        error
      );
    } finally {
      setLoadingPaths(false);
    }
  };

  fetchCurriculums();
}, []);

const [view, setView] = useState("modules");
const [selectedModule, setSelectedModule] = useState(null);
const [expandedTopics, setExpandedTopics] = useState(new Set());

const [showQuizPopup, setShowQuizPopup] = useState(false);
const [selectedTopic, setSelectedTopic] = useState(null);


const toggleTopic = (index) => {
  setExpandedTopics((prev) => {
    const updated = new Set(prev);

    if (updated.has(index)) {
      updated.delete(index);
    } else {
      updated.add(index);
    }

    return updated;
  });
};

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


const handleBack = () => {
  if (view === "topics") {
    setView("modules");
    setSelectedModule(null);
    return;
  }

  if (view === "modules") {
    setSelectedPath(null);
    setSelectedModule(null);
    return;
  }
};



const handleQuizClick = (topic) => {
  setSelectedTopic(topic);
  setShowQuizPopup(true);
};

const handleHasKnowledge = () => {
  setShowQuizPopup(false);
  navigate("/QuizPage", {
  state: {
    moduleId: selectedModule?.id,
    topic: selectedTopic,
  },
});
};

// const handleNoKnowledge = () => {
//   setShowQuizPopup(false);
//   navigate("/Videolesson", {
//   state: {
//     moduleId: selectedModule?.id,
//     topic: selectedTopic,
//   },
// });
// };
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

const visibleModules = Array.isArray(selectedPath?.modules)
  ? selectedPath.modules
  : [];
const openModuleTopics = (module, index) => {
  if (!Array.isArray(module.topics) || module.topics.length === 0) {
    return;
  }

  setSelectedModule({
  id: module.id,
  title: module.title || `Module ${index + 1}`,
  topics: module.topics.map((topic) =>
    typeof topic === "string"
      ? { title: topic, videos: [] }
      : topic
  ),
});
  setExpandedTopics(new Set());
  setView("topics");
};

const getModuleState = (module, index) => {
  const status = module.status?.toLowerCase() || (index === 0 ? "in-progress" : "locked");
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
if (loadingPaths) {
  return (
    <div className="loading-screen">
      Loading learning paths...
    </div>
  );
}

  if (!selectedPath) {

    return (
      <div className="app-shell">
        <Sidebar />

        <main className="main">
          <Header user={user}/>

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
                <div className="empty-state">
                  Ooops! There's nothing here
                </div>
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
      <Header user={user}/>

      <div className="content">
        <div className="content-inner">

          {/* HEADER (always visible when path selected) */}
          <div className="learning-header">

            <button className="back-btn" onClick={handleBack}>
        ← Back
      </button>

            <h1>{selectedPath.title}</h1>

            <div className="progress-row">
              <div className="progress-wrap">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${selectedPath.progress}%`,
                    }}
                  />
                </div>

                <span className="overall-progress">
                  {selectedPath.progress}% Overall Progress
                </span>
              </div>

              <div className="time-left">
                ⏱ {selectedPath.hours} hours
              </div>
            </div>
          </div>

        

          {view === "modules" && (
  <div className="modules">

    {visibleModules.length === 0 ? (
      <div className="empty-state">
        No modules found for this curriculum.
      </div>
    ) : (
      visibleModules.map((module, index) => {
        const moduleState = getModuleState(module, index);

        const hasTopics =
          Array.isArray(module.topics) &&
          module.topics.length > 0;

        return (
          <div
            className={`module-card ${moduleState.cardClass}`}
            key={module.id || index}
          >
            <div className={`module-icon ${moduleState.iconClass}`}>
              {moduleState.isCompleted ? "OK" : <MdPlayCircleFilled />}
            </div>

            <div className="module-content">
              <div className="module-top">
                <h3>{module.title || `Module ${index + 1}`}</h3>

                <span className={`status ${moduleState.statusClass}`}>
                  {moduleState.statusLabel}
                </span>
              </div>

              <p>
                {module.description ||
                  module.desc ||
                  "No description available."}
              </p>

              <div className="module-actions">
                <button
                  className={moduleState.buttonClass}
                  disabled={moduleState.isLocked || !hasTopics}
                  onClick={() => openModuleTopics(module, index)}
                >
                  {moduleState.buttonLabel}
                </button>
              </div>

              {moduleState.isLocked && (
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

          {/* ===================== TOPICS VIEW ===================== */}
          {view === "topics" && selectedModule && (
            <div className="curriculum-page">

              <div className="curriculum-header">
                <h1>{selectedModule.title}</h1>
                <p>Select a topic to expand lessons</p>
              </div>

              <div className="topics-list">
                {selectedModule.topics.map((topic, index) => (
                  <div key={index} className="topic-card">

                    {/* Topic Header */}
                    <div
                      className="topic-header"
                    onClick={() => toggleTopic(index)}
                    >
                      <div className="topic-title">
                        <MdFolder className="topic-icon" />
                        <h3>{topic.title}</h3>
                      </div>
                       <span className="chevron-icon">
                       {expandedTopics.has(index) ? (
                          <MdKeyboardArrowUp />
                        ) : (
                          <MdKeyboardArrowDown />
                        )}
                        </span>
                    </div>

                    {expandedTopics.has(index) && (
                      <div className="video-list">
                        <div
                          className="quiz-item"
                          onClick={() => handleQuizClick(topic)}
                        >
                          <MdQuiz className="quiz-icon" />
                          <span>{topic.title} Quiz</span>
                        </div>

                        {(topic.videos || []).map((video, i) => (
                          // <Link
                          //   key={i}
                          //   to="/Videolesson"
                          //   className="video-link"
                          // >
                          <Link
                          key={video.videoId || i}
                          to="/Videolesson"
                          state={{
                            moduleId: selectedModule?.id,
                            topic,
                            video,
                          }}
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
                          state={{
                            moduleId: selectedModule?.id,
                            topic,
                          }}
                          className="challenge-link"
                        >
                          <div className="challenge-item">
                            <MdCode className="challenge-icon" />
                            <span>{topic.title} Coding Challenge</span>
                          </div>
                        </Link>
                      </div>
                    )}

                  </div>
                ))}
              </div>

            </div>
          )}

          {/* Quiz Popup */}
              {showQuizPopup && (
                <div className="quiz-popup-overlay">
                  <div className="quiz-popup">

                    <h2>Prior Knowledge Check</h2>

                    <p>
                      Do you already have prior knowledge about{" "}
                      <strong>{selectedTopic?.title}</strong>?
                    </p>

                    <div className="popup-buttons">
                      <button
                        className="yes-btn"
                        onClick={handleHasKnowledge}
                      >
                        Yes
                      </button>

                      <button
                        className="no-btn"
                        onClick={handleNoKnowledge}
                      >
                        No
                      </button>
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
