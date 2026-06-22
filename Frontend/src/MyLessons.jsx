import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./MyLessons.css";
import Sidebar from "./Components/Sidebar";
import Header from "./Components/Header";
import UserProfile, { user } from "./Components/UserProfile";
import Topics from "./Topics";

import {
  MdSearch,
  MdDelete,
  MdFilterList,
} from "react-icons/md";



export default function MyLessons() {
  const navigate = useNavigate();
  const [selectedPath, setSelectedPath] = useState(null);

  const [filter, setFilter] = useState("All Paths");
const [searchTerm, setSearchTerm] = useState("");

  const [learningPaths, setLearningPaths] = useState([
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
  ]);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleDelete = (id) => {
    setLearningPaths((prev) =>
      prev.filter((path) => path.id !== id)
    );
    setDeleteTarget(null);
  };

const [view, setView] = useState("modules");
const [selectedModule, setSelectedModule] = useState(null);





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
  } else {
    setSelectedPath(null);
    setSelectedModule(null);
    setView("modules");
  }
};

const modules = [
  {
    id: 1,
    title: "Programming Fundamentals",
    status: "completed",
    description: "Variables, loops, data types, and logic.",
    topics: [
      {
        title: "Variables & Data Types",
        videos: ["Intro Video", "Practice Video"],
        locked: false
      },
      {
        title: "Loops",
        videos: [],
        locked: true
      },
      {
        title: "Functions",
        videos: [],
        locked: true
      }
    ]
  }
];



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
      <Header />

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

          {/* ===================== MODULE VIEW ===================== */}
          {view === "modules" && (
            <div className="modules">

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
                    Variables, loops, data types, and logic.
                    The building blocks of any modern application.
                  </p>

                  <button
                    className="primary-btn"
                    onClick={() => {
                      const module = modules.find(m => m.id === 1);
                      navigate("/Topics", {
                      state: { selectedModule: module }
                    });                 
                    }}
                  >
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
                    <button
                      className="primary-btn"
                      onClick={() => setView("modules")}
                    >
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
                    colors, typography, and responsive design fundamentals.
                  </p>

                  <button
                    className="locked-btn"
                    onClick={() => setView("modules")}
                  >
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
                    DOM manipulation, events, and core JavaScript logic.
                  </p>

                  <button
                    className="locked-btn"
                    onClick={() => setView("modules")}
                  >
                    Start Module
                  </button>

                  <div className="locked-tooltip">
                    Unlock this module after mastering CSS Basics
                  </div>
                </div>
              </div>

            </div>
          )}

          
          {view === "topics" && selectedModule && (
            <Topics selectedModule={selectedModule} />
          )}

          

        </div>
      </div>
    </main>
  </div>
);
}