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
  const selectedModule = location.state?.selectedModule;
  const navigate = useNavigate();


const selectedPath = location.state?.selectedPath;

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
      state: { selectedModule, selectedTopic }
    });
  };

  // FIXED (no window.location)
  const handleNoKnowledge = () => {
    setShowQuizPopup(false);
    navigate("/Videolesson", {
      state: { selectedModule, selectedTopic }
    });
  };

  const handleCancelQuiz = () => {
    setShowQuizPopup(false);
    setSelectedTopic(null);
  };
  const handleBack = () => {
  navigate("/MyLessons"); 
};

  

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main">
        <Header />

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
                {selectedModule.topics.map((topic, index) => (
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

                        {topic.videos.map((video, i) => (
                          <Link
                            key={i}
                            to="/Videolesson"
                            state={{
                              selectedModule,
                              topic,
                              video
                            }}
                            className="video-link"
                          >
                            <div className="video-item">
                              <MdPlayCircleFilled className="video-icon" />
                              <span>{video}</span>
                            </div>
                          </Link>
                        ))}

                        <Link to="/challenges" className="challenge-link">
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