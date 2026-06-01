import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import "./QuizPage.css";

export default function QuizPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const moduleId = location.state?.moduleId;
  const topic = location.state?.topic;

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState([]);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchDynamicQuiz = async () => {
      if (!topic?.id) {
        setLoadError("Topic context is missing for this quiz.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setLoadError("");

        const response = await fetch("/api/assessment/prior-quiz", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topicId: topic.id,
            moduleId,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to generate quiz");
        }

        setQuiz(data.quiz);
      } catch (error) {
        console.error("Failed to fetch dynamic quiz:", error);
        setLoadError(error.message || "Unable to load quiz");
      } finally {
        setLoading(false);
      }
    };

    fetchDynamicQuiz();
  }, [moduleId, topic?.id]);

  const questions = quiz?.questions || [];
  const question = questions[currentQuestion];

  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");

  const handleOptionSelect = (optionIndex) => {
    setAnswers((prev) => {
      if (prev[currentQuestion] === optionIndex) {
        const updated = { ...prev };
        delete updated[currentQuestion];
        return updated;
      }

      return {
        ...prev,
        [currentQuestion]: optionIndex,
      };
    });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleFlag = () => {
    setFlaggedQuestions((prev) => {
      if (prev.includes(currentQuestion)) {
        return prev.filter((q) => q !== currentQuestion);
      }

      return [...prev, currentQuestion];
    });
  };

  const handleSubmit = () => {
    navigate("/Videolesson", {
      state: {
        moduleId,
        topic,
        video: quiz?.context?.video || null,
      },
    });
  };

  const progress = questions.length
    ? ((currentQuestion + 1) / questions.length) * 100
    : 0;

  if (loading) {
    return (
      <main className="quiz-main">
        <div className="quiz-wrapper">
          <div className="question-card">Generating a prior-knowledge quiz...</div>
        </div>
      </main>
    );
  }

  if (loadError || !question) {
    return (
      <main className="quiz-main">
        <div className="quiz-wrapper">
          <div className="question-card">
            <h2>Quiz unavailable</h2>
            <p>{loadError || "No quiz questions were generated for this topic."}</p>
            <button className="next-btn" onClick={handleSubmit}>
              Continue to lesson
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="quiz-main">
      <div className="quiz-wrapper">
        <section className="quiz-progress-header">
          <div className="quiz-progress-left">
            <div className="quiz-title-row">
              <h1>{quiz?.title || `${topic?.title || "Topic"} Quiz`}</h1>
              <span>
                Question {currentQuestion + 1} of {questions.length}
              </span>
            </div>

            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="timer-box">
            <div className="timer-icon">Time</div>
            <div>
              <p className="timer-label">Time Spent</p>
              <h3>
                {mins}:{secs}
              </h3>
            </div>
          </div>
        </section>

        <div className="quiz-grid">
          <div className="question-section">
            <div className="question-card">
              <div className="question-top">
                <div className="question-number">{currentQuestion + 1}</div>
                <div>
                  <h2>{question.question}</h2>
                  {question.objective && <p>{question.objective}</p>}
                </div>
              </div>

              <div className="options-list">
                {question.options.map((option, index) => (
                  <div
                    key={index}
                    className={`option-card ${
                      answers[currentQuestion] === index ? "selected-option" : ""
                    }`}
                    onClick={() => handleOptionSelect(index)}
                  >
                    <div className="radio-circle">
                      {answers[currentQuestion] === index && <div className="radio-fill" />}
                    </div>
                    <span>{option}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="quiz-footer">
              {currentQuestion > 0 && (
                <button className="prev-btn" onClick={handlePrevious}>
                  Previous
                </button>
              )}

              {currentQuestion < questions.length - 1 && (
                <button className="next-btn" onClick={handleNext}>
                  Next Question
                </button>
              )}

              {currentQuestion === questions.length - 1 && answers[currentQuestion] !== undefined && (
                <button className="quiz-submit-btn" onClick={handleSubmit}>
                  Submit Assessment
                </button>
              )}
            </div>
          </div>

          <div className="sidebar-panel">
            <div className="question-map-card">
              <h3>Question Map</h3>

              <div className="question-map-grid">
                {questions.map((_, index) => {
                  const answered = answers[index] !== undefined;
                  const flagged = flaggedQuestions.includes(index);

                  return (
                    <div
                      key={index}
                      className={
                        index === currentQuestion
                          ? "map-active"
                          : flagged
                          ? "map-flag"
                          : answered
                          ? "map-complete"
                          : "map-default"
                      }
                      onClick={() => setCurrentQuestion(index)}
                    >
                      {flagged ? "F" : index + 1}
                    </div>
                  );
                })}
              </div>

              <div className="sidebar-buttons">
                <button className="flag-btn" onClick={handleFlag}>
                  {flaggedQuestions.includes(currentQuestion)
                    ? "Unflag Question"
                    : "Flag Question for Review"}
                </button>
              </div>
            </div>

            <div className="Note-card">
              <h4>Note</h4>
              <p>
                This quiz is dynamically generated from the topic and lesson context to
                measure prior knowledge only. It is not graded.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
