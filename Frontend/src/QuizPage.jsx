import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./QuizPage.css";

// ─── BKT helper ──────────────────────────────────────────────────────────────
// The prior-knowledge quiz must NEVER push mastery to 0.8+ because that would
// allow the system to grant progression to someone who just got lucky. We hard-
// cap the mastery that can come out of a pretest at MAX_PRETEST_MASTERY.
const MAX_PRETEST_MASTERY = 0.79;

// Score threshold above which we consider the learner to have prior knowledge
// and show the "skip to challenge" option.
const SKIP_SCORE_THRESHOLD = 0.7; // ≥ 70 % correct

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
  const [submitError, setSubmitError] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch quiz
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topicId: topic.id, moduleId }),
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
      return { ...prev, [currentQuestion]: optionIndex };
    });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) setCurrentQuestion((p) => p + 1);
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) setCurrentQuestion((p) => p - 1);
  };

  const handleFlag = () => {
    setFlaggedQuestions((prev) =>
      prev.includes(currentQuestion)
        ? prev.filter((q) => q !== currentQuestion)
        : [...prev, currentQuestion]
    );
  };

  const handleSubmit = async () => {
    if (!questions.length) return;

    const answeredAll = questions.every((_, i) => answers[i] !== undefined);
    if (!answeredAll) {
      setSubmitError("Please answer all questions before submitting.");
      return;
    }

    setSubmitError("");

    const correctCount = questions.reduce(
      (sum, q, i) => sum + (answers[i] === q.correctIndex ? 1 : 0),
      0
    );
    const scoreRatio = correctCount / questions.length;

    // ── BKT cap ──────────────────────────────────────────────────────────
    // Tell the backend this is a pretest and pass the cap so it never writes
    // a mastery value ≥ 0.8 from a prior-knowledge quiz alone.
    const quizResponses = questions.map((q, i) => ({
      ...q,
      selectedIndex: answers[i],
    }));

    const passed = scoreRatio >= SKIP_SCORE_THRESHOLD;

    try {
      const response = await fetch(`/api/topic/${topic.id}/attempt`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          curriculumId: topic.curriculumId || null,
          moduleId,
          quiz_type: "pretest",
          questions: quizResponses,
          correctCount,
          totalCount: questions.length,
          passed,
          // ← tells the backend to cap mastery at MAX_PRETEST_MASTERY
          masterycap: MAX_PRETEST_MASTERY,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to save quiz results.");
      }
    } catch (error) {
      console.error("Quiz submission failed:", error);
      setSubmitError(error.message || "Unable to submit quiz results.");
      return;
    }

    // ── Navigate to VideoLesson ───────────────────────────────────────────
    // If the learner scored ≥ 70 % we set canSkipVideo=true so VideoLesson
    // immediately shows the "skip to challenge" popup. The popup lets them
    // choose: go straight to the challenge, or stay and watch the video.
    // Either way they still need to pass the challenge to unlock the next topic.
    navigate("/Videolesson", {
      state: {
        moduleId,
        topic,
        video: quiz?.context?.video || null,
        canSkipVideo: passed, // ← triggers the skip popup in VideoLesson
      },
    });
  };

  // Allow skipping to the video even when there's no quiz (error / missing topic)
  const handleSkipToLesson = () => {
    navigate("/Videolesson", {
      state: {
        moduleId,
        topic,
        video: null,
        canSkipVideo: false,
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
            <button className="next-btn" onClick={handleSkipToLesson}>
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
              <button
                className="quiz-back-btn"
                onClick={() => setShowLeaveModal(true)}
              >
                ← Back
              </button>

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

          {showLeaveModal && (
            <div className="modal-overlay">
              <div className="leave-modal">
                <h3>Leave Quiz?</h3>

                <p>
                  All progress will be lost if you leave without
                  completing.
                </p>

                <div className="modal-actions">
                  <button
                    onClick={() => setShowLeaveModal(false)}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={() => navigate(-1)}
                    className="confirm-btn"
                  >
                    Yes
                  </button>
                </div>
              </div>
            </div>
          )}
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
                      {answers[currentQuestion] === index && (
                        <div className="radio-fill" />
                      )}
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

              {currentQuestion === questions.length - 1 &&
                Object.keys(answers).length === questions.length && (
                  <button className="quiz-submit-btn" onClick={handleSubmit}>
                    Submit Assessment
                  </button>
                )}

              {submitError && (
                <div className="quiz-error-message">{submitError}</div>
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
                This quiz measures prior knowledge only and is not graded.
                Even a perfect score here will not skip the video — you still
                need to complete the challenge to unlock the next topic.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}