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
  const [selectedPath, setSelectedPath] = useState(null);
  const [filter, setFilter] = useState("All Paths");
  const [searchTerm, setSearchTerm] = useState("");
  const [learningPaths] = useState(() => {
    const initialPaths = [
      {
        id: 1,
        title: "Frontend Development with React",
        progress: 28,
        hours: 14,
        level: "Beginner",
        status: "In Progress",
        description:
          "Learn frontend development and React skills through structured modules.",
      },

      {
        id: 2,
        title: "Fullstack JavaScript Engineering",
        progress: 72,
        hours: 32,
        level: "Intermediate",
        status: "In Progress",
        description:
          "Master Node.js, Express, MongoDB, APIs, and advanced React workflows.",
      },

      {
        id: 3,
        title: "AI Powered Web Applications",
        progress: 0,
        hours: 48,
        level: "Advanced",
        status: "Not Started",
        description:
          "Build intelligent apps using OpenAI APIs, vector databases, and AI tooling.",
      },
    ];

    try {
      const stored = localStorage.getItem("myLessonsCurriculum");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.curriculum) {
          const curriculum = parsed.curriculum;
          const savedPath = {
            id: `saved-${curriculum.id}`,
            title: curriculum.description || "My Learning Path",
            description:
              curriculum.description ||
              "A confirmed curriculum that you can continue learning.",
            progress: 0,
            hours: curriculum.modules?.length ? curriculum.modules.length * 4 : 10,
            level: curriculum.level || "Beginner",
            status: "In Progress",
            modules: curriculum.modules || [],
          };
          return [savedPath, ...initialPaths];
        }
      }
    } catch (error) {
      console.error("Failed to load saved curriculum:", error);
    }

    return initialPaths;
  });

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

  if (!selectedPath) {
    return (
      <div className="app-shell">
        <Sidebar />

        <main className="main">
          <Header />

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

                            <span>⏱ {path.hours} Hours</span>

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
        <Header />

        <div className="content">
          <div className="content-inner">
            <div className="learning-header">

                                <button
                      className="back-btn"
                      onClick={() => setSelectedPath(null)}
                    >
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

                  <span>
                    {selectedPath.progress}% Overall Progress
                  </span>
                </div>

                <div className="time-left">
                  ⏱ {selectedPath.hours} hours
                </div>
              </div>
            </div>

            <div className="modules">
              {selectedPath.modules?.length ? (
                selectedPath.modules.map((module, index) => {
                  const moduleStatus = module.status?.toLowerCase() ||
                    (index === 0 ? "active" : "locked");
                  const isActive = moduleStatus === "active";
                  const isLocked = moduleStatus === "locked";

                  return (
                    <div
                      className={`module-card ${
                        isActive ? "active-module" : isLocked ? "locked-module" : "completed"
                      }`}
                      key={module.id || index}
                    >
                      <div className="module-icon">
                        {isActive ? "▶" : isLocked ? "▶" : "✓"}
                      </div>

                      <div className="module-content">
                        <div className="module-top">
                          <h3>{module.title || `Module ${index + 1}`}</h3>
                          <span
                            className={`status ${
                              isActive ? "active-status" : isLocked ? "locked-status" : "completed-status"
                            }`}
                          >
                            {isActive ? "IN PROGRESS" : isLocked ? "LOCKED" : "COMPLETED"}
                          </span>
                        </div>

                        <p>{module.description || module.desc || "No description available."}</p>

                        <div className="module-actions">
                          <button className={isLocked ? "locked-btn" : "primary-btn"}>
                            {isLocked ? "Start Module" : isActive ? "Continue Learning" : "Review Lessons"}
                          </button>
                        </div>

                        {Array.isArray(module.topics) && module.topics.length > 0 && (
                          <div className="module-topics">
                            <strong>Topics:</strong>
                            <ul>
                              {module.topics.map((topic, idx) => (
                                <li key={idx}>{typeof topic === "string" ? topic : topic.title || topic}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <>
                  <div className="module-card completed">
                    <div className="module-icon complete-icon">✓</div>

                    <div className="module-content">
                      <div className="module-top">
                        <h3>Programming Fundamentals</h3>
                        <span className="status completed-status">
                          COMPLETED
                        </span>
                      </div>

                      <p>
                        Variables, loops, data types, and logic. The
                        building blocks of any modern application.
                      </p>

                      <button className="primary-btn">
                        Review Lessons
                      </button>
                    </div>
                  </div>

                  <div className="module-card active-module">
                    <div className="module-icon active-icon">▶</div>

                    <div className="module-content">
                      <div className="module-top">
                        <h3>HTML Basics</h3>
                        <span className="status active-status">
                          40% IN PROGRESS
                        </span>
                      </div>

                      <p>
                        Master semantic elements, document structure,
                        and accessibility standards for the web.
                      </p>

                      <div className="module-actions">
                        <button className="primary-btn">
                          Continue Learning
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="module-card locked-module">
                    <div className="module-icon locked-icon">▶</div>

                    <div className="module-content">
                      <div className="module-top">
                        <h3>CSS Basics</h3>
                        <span className="status locked-status">
                          LOCKED
                        </span>
                      </div>

                      <p>
                        Learn selectors, styling, layouts, spacing,
                        colors, typography, and responsive design
                        fundamentals.
                      </p>

                      <button className="locked-btn">
                        Start Module
                      </button>

                      <div className="locked-tooltip">
                        Unlock this module by completing HTML Basics
                      </div>
                    </div>
                  </div>

                  <div className="module-card locked-module">
                    <div className="module-icon locked-icon">▶</div>

                    <div className="module-content">
                      <div className="module-top">
                        <h3>JavaScript Fundamentals</h3>
                        <span className="status locked-status">
                          LOCKED
                        </span>
                      </div>

                      <p>
                        Learn variables, functions, arrays, objects,
                        DOM manipulation, events, and core JavaScript
                        logic.
                      </p>

                      <button className="locked-btn">
                        Start Module
                      </button>

                      <div className="locked-tooltip">
                        Unlock this module after mastering CSS Basics
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}