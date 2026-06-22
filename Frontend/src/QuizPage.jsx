import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./QuizPage.css";

export default function QuizPage() {
  const navigate = useNavigate();
  

  // 10 QUESTIONS
  const questions = [
    {
      question:
        "Which is the correct way to update state based on previous state?",
      options: [
        "setCount(count + 1)",
        "setCount(prevCount => prevCount + 1)",
        "count = count + 1",
        "this.setState({ count: count + 1 })",
      ],
    },
    {
      question: "Which hook is used for side effects?",
      options: [
        "useState",
        "useEffect",
        "useRef",
        "useMemo",
      ],
    },
    {
      question: "Which hook stores state?",
      options: [
        "useEffect",
        "useReducer",
        "useState",
        "useRef",
      ],
    },
    {
      question: "Which prop uniquely identifies list items?",
      options: ["id", "key", "unique", "index"],
    },
    {
      question: "Which hook accesses DOM elements?",
      options: [
        "useState",
        "useRef",
        "useEffect",
        "useMemo",
      ],
    },
    {
      question: "What is JSX?",
      options: [
        "Java Syntax XML",
        "JavaScript XML",
        "JSON XML",
        "Java Extended Syntax",
      ],
    },
    {
      question: "Which hook runs after render?",
      options: [
        "useState",
        "useEffect",
        "useReducer",
        "useRef",
      ],
    },
    {
      question: "Which hook optimizes performance?",
      options: [
        "useMemo",
        "useState",
        "useEffect",
        "useReducer",
      ],
    },
    {
      question:
        "Which function changes component state?",
      options: [
        "setState",
        "changeState",
        "updateState",
        "modifyState",
      ],
    },
    {
      question:
        "React components must return what?",
      options: [
        "HTML",
        "JSX",
        "CSS",
        "JSON",
      ],
    },
  ];

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [answers, setAnswers] = useState({});

  const [flaggedQuestions, setFlaggedQuestions] =
    useState([]);

  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const mins = String(
    Math.floor(seconds / 60)
  ).padStart(2, "0");

  const secs = String(seconds % 60).padStart(
    2,
    "0"
  );

  const question = questions[currentQuestion];

  // SELECT OPTION
  const handleOptionSelect = (option) => {
  setAnswers((prev) => {
    // if clicking the same option → unselect it
    if (prev[currentQuestion] === option) {
      const updated = { ...prev };
      delete updated[currentQuestion];
      return updated;
    }

    // otherwise select new option
    return {
      ...prev,
      [currentQuestion]: option,
    };
  });
};

  // NEXT
  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  // PREVIOUS
  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  // FLAG QUESTION
  const handleFlag = () => {
    setFlaggedQuestions((prev) => {
      if (prev.includes(currentQuestion)) {
        return prev.filter(
          (q) => q !== currentQuestion
        );
      }

      return [...prev, currentQuestion];
    });
  };

  // SUBMIT
  const handleSubmit = () => {
    if (
      currentQuestion ===
      questions.length - 1
    ) {
      navigate("/videolesson");
    }
  };

  const progress =
    ((currentQuestion + 1) /
      questions.length) *
    100;

  return (
    <main className="quiz-main">
      <div className="quiz-wrapper">

        {/* HEADER */}
        <section className="quiz-progress-header">

          <div className="quiz-progress-left">

            <div className="quiz-title-row">

              <button
                className="quiz-back-btn"
                onClick={() => navigate(-1)}
              >
                ← Back
              </button>
              <h1>React Fundamentals Quiz</h1>

              <span>
                Question {currentQuestion + 1} of{" "}
                {questions.length}
              </span>
            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

          </div>

          <div className="timer-box">
            <div className="timer-icon">
              ⏱
            </div>

            <div>
              <p className="timer-label">
                Time Spent
              </p>

              <h3>
                {mins}:{secs}
              </h3>
            </div>
          </div>

        </section>

        <div className="quiz-grid">

          {/* LEFT */}
          <div className="question-section">

            <div className="question-card">

              <div className="question-top">

                <div className="question-number">
                  {currentQuestion + 1}
                </div>

                <h2>
                  {question.question}
                </h2>

              </div>

              {/* OPTIONS */}
              <div className="options-list">
                {question.options.map(
                  (option, index) => (
                    <div
                      key={index}
                      className={`option-card ${
                        answers[
                          currentQuestion
                        ] === option
                          ? "selected-option"
                          : ""
                      }`}
                      onClick={() =>
                        handleOptionSelect(
                          option
                        )
                      }
                    >
                      <div className="radio-circle">
                        {answers[
                          currentQuestion
                        ] === option && (
                          <div className="radio-fill" />
                        )}
                      </div>

                      <span>
                        {option}
                      </span>
                    </div>
                  )
                )}
              </div>

            </div>

            {/* FOOTER */}
            <div className="quiz-footer">

              {/* PREVIOUS BUTTON (hide on question 1) */}
              {currentQuestion > 0 && (
                <button
                  className="prev-btn"
                  onClick={handlePrevious}
                >
                  ← Previous
                </button>
              )}

              {/* NEXT BUTTON (hide on question 10) */}
              {currentQuestion < questions.length - 1 && (
                <button
                  className="next-btn"
                  onClick={handleNext}
                >
                  Next Question →
                </button>
              )}

              {/* SUBMIT BUTTON (only on Q10 + answered) */}
              {currentQuestion === questions.length - 1 &&
                answers[currentQuestion] && (
                  <button
                    className="quiz-submit-btn"
                    onClick={handleSubmit}
                  >
                    Submit Assessment
                  </button>
                )}

            </div>

          </div>

          {/* RIGHT */}
          <div className="sidebar-panel">

            <div className="question-map-card">

              <h3>Question Map</h3>

              <div className="question-map-grid">

                {questions.map(
                  (_, index) => {
                    const answered =
                      answers[index];

                    const flagged =
                      flaggedQuestions.includes(
                        index
                      );

                    return (
                      <div
                        key={index}
                        className={
                          index ===
                          currentQuestion
                            ? "map-active"
                            : flagged
                            ? "map-flag"
                            : answered
                            ? "map-complete"
                            : "map-default"
                        }
                        onClick={() =>
                          setCurrentQuestion(
                            index
                          )
                        }
                      >
                        {flagged
                          ? "⚑"
                          : index + 1}
                      </div>
                    );
                  }
                )}

              </div>

              <div className="sidebar-buttons">

                <button
                  className="flag-btn"
                  onClick={handleFlag}
                >
                  ⚑{" "}
                  {flaggedQuestions.includes(
                    currentQuestion
                  )
                    ? "Unflag Question"
                    : "Flag Question for Review"}
                </button>


              </div>

            </div>

            {/* NOTE */}
            <div className="Note-card">

              <h4>Note</h4>

              <p>
                This quiz is intended
                to measure users prior
                knowledge only. It is
                not a graded quiz.
                Therefore scores will
                not be shown after
                submission.
              </p>

            </div>

          </div>

        </div>

      </div>
    </main>
  );
}