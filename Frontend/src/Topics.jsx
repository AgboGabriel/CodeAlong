import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Topics.css";
import Sidebar from "./Components/Sidebar";
import Header from "./Components/Header";

import {
  MdFolder,
  MdQuiz,
  MdCode,
  MdLock,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdPlayCircleFilled,
} from "react-icons/md";

export default function Topics() {
  const location = useLocation();
  const navigate = useNavigate();

  const storedTopicsState = (() => {
    try {
      const raw = sessionStorage.getItem("codealong_topics_state");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const selectedModule = location.state?.selectedModule || storedTopicsState?.selectedModule;
  const selectedPath = location.state?.selectedPath || storedTopicsState?.selectedPath;

  if (selectedModule) {
    sessionStorage.setItem("codealong_topics_state", JSON.stringify({ selectedModule, selectedPath }));
  }

  const [expandedTopics, setExpandedTopics] = useState(new Set());
  const [showQuizPopup, setShowQuizPopup] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);

  const toggleTopic = (index, locked) => {
    if (locked) return;

    setExpandedTopics((prev) => {
      const updated = new Set(prev);
      updated.has(index) ? updated.delete(index) : updated.add(index);
      return updated;
    });
  };

  const handleQuizClick = (topic) => {
    setSelectedTopic(topic);
    setShowQuizPopup(true);
  };

  // FIXED (no window.location)
  const handleHasKnowledge = () => {
    setShowQuizPopup(false);
    navigate("/QuizPage", {
      state: {
        moduleId: selectedModule.id,
        topic: selectedTopic,
        selectedModule,
        selectedPath,
      },
    });
  };

  // FIXED (no window.location)
  const handleNoKnowledge = () => {
    setShowQuizPopup(false);
    navigate("/Videolesson", {
      state: {
        moduleId: selectedModule.id,
        topic: selectedTopic,
        video: selectedTopic?.videos?.[0] || null,
        selectedModule,
        selectedPath,
      },
    });
  };

  const handleCancelQuiz = () => {
    setShowQuizPopup(false);
    setSelectedTopic(null);
  };

  const handleBack = () => {
    navigate("/MyLessons", { state: { selectedPath } });
  };

  if (!selectedModule) {
    return (
      <div className="app-shell">
        <Sidebar />
        <main className="main">
          <Header page="Topics" />
          <div className="content">
            <div className="content-inner">
              <div className="curriculum-page">
                <div className="curriculum-header">
                  <button className="back-btn" onClick={() => navigate("/MyLessons")}>← Back</button>
                  <h1>Topics</h1>
                  <p>No module was selected. Please open a learning path first.</p>
                </div>
              </div>
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
        <Header page="Topics" />

        <div className="content">
          <div className="content-inner">

            <div className="curriculum-page">

              <div className="curriculum-header">

                    <button className="back-btn" onClick={handleBack}>
                      ← Back
                    </button>
                <h1>{selectedModule.title}</h1>
                <p>Select a topic to expand lessons</p>
              </div>

              <div className="topics-list">
                {(Array.isArray(selectedModule.topics) ? selectedModule.topics : []).map((topic, index) => (
                  <div key={index} className="topic-card">

                    <div
                      className={`topic-header ${topic.locked ? "locked-topic" : ""}`}
                      onClick={() => toggleTopic(index, topic.locked)}
                    >
                      <div className="topic-title">
                        <MdFolder className="topic-icon" />
                        <h3>{topic.title}</h3>
                      </div>

                      <span className="chevron-icon">
                        {topic.locked ? (
                          <MdLock />
                        ) : expandedTopics.has(index) ? (
                          <MdKeyboardArrowUp />
                        ) : (
                          <MdKeyboardArrowDown />
                        )}
                      </span>
                    </div>

                    {!topic.locked && expandedTopics.has(index) && (
                      <div className="video-list">

                        <div
                          className="quiz-item"
                          onClick={() => handleQuizClick(topic)}
                        >
                          <MdQuiz className="quiz-icon" />
                          <span>{topic.title} Quiz</span>
                        </div>

                        {(Array.isArray(topic.videos) ? topic.videos : []).map((video, i) => {
                          const videoTitle = typeof video === "string" ? video : video.title;
                          return (
                          <Link
                            key={i}
                            to="/Videolesson"
                            state={{
                              selectedModule,
                              selectedPath,
                              moduleId: selectedModule.id,
                              topic,
                              video: typeof video === "string" ? { title: video } : video,
                            }}
                            className="video-link"
                          >
                            <div className="video-item">
                              <MdPlayCircleFilled className="video-icon" />
                              <span>{videoTitle}</span>
                            </div>
                          </Link>
                          );
                        })}

                        <Link
                          to="/challenges"
                          state={{ selectedModule, selectedPath, moduleId: selectedModule.id, topic }}
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

          </div>
        </div>
      </main>

      {/* POPUP */}
      {showQuizPopup && (
        <div className="quiz-popup-overlay">
          <div className="quiz-popup">

            <button
              className="popup-close-btn"
              onClick={handleCancelQuiz}
            >
              ×
            </button>

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
  );
}