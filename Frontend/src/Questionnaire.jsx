import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaLaptopCode,
  FaDatabase,
  FaChartBar,
  FaMobileAlt,
  FaSeedling,
  FaChartLine,
  FaGem,
  FaBriefcase,
  FaRocket,
  FaBook
} from "react-icons/fa";

import logo from "./assets/Code along_logo-04.png";
import "./Questionnaire.css";

/* ───────── Icons ───────── */

const ArrowBackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
);

/* ───────── Data ───────── */

const CAREER_PATHS = [
  { id: "frontend", title: "Frontend Dev", sub: "Interfaces & UX", color: "#3b82f6", icon: <FaLaptopCode /> },
  { id: "backend", title: "Backend Dev", sub: "APIs & Databases", color: "#8b5cf6", icon: <FaDatabase /> },
  { id: "datascience", title: "Data Science", sub: "Analysis & ML", color: "#10b981", icon: <FaChartBar /> },
  { id: "mobile", title: "Mobile Dev", sub: "iOS & Android", color: "#f59e0b", icon: <FaMobileAlt /> },
];

const LANGUAGES = [
  "Python","JavaScript","C++","Java","C",
  "C#","Swift","PHP","TypeScript","R","Go","Ruby","Rust"
];

const SKILL_LEVELS = [
  { id: "beginner", label: "Beginner", sub: "Just starting out", icon: <FaSeedling /> },
  { id: "intermediate", label: "Intermediate", sub: "Some experience", icon: <FaChartLine /> },
  { id: "advanced", label: "Advanced", sub: "Professional level", icon: <FaGem /> },
];

const GOALS = [
  { id: "job", label: "Get a job", sub: "Career change or entry-level roles", icon: <FaBriefcase /> },
  { id: "projects", label: "Build projects", sub: "Turn ideas into applications", icon: <FaRocket /> },
  { id: "basics", label: "Learn basics", sub: "Understand how technology works", icon: <FaBook /> },
];

/* ───────── Component ───────── */

export default function LearningJourney() {

  const navigate = useNavigate();

  const [careerPath, setCareerPath] = useState("backend");
  const [knownLanguages, setKnownLanguages] = useState([]);
  const [learningLanguages, setLearningLanguages] = useState([]);
  const [skillLevel, setSkillLevel] = useState("intermediate");
  const [goal, setGoal] = useState("projects");

  /* Toggle function for multi-select */
  const toggleLanguage = (lang, list, setList) => {
    if (list.includes(lang)) {
      setList(list.filter((l) => l !== lang));
    } else {
      setList([...list, lang]);
    }
  };

  /* Save questionnaire answers */
  const handleSave = () => {

    const userPreferences = {
      careerPath,
      knownLanguages,
      learningLanguages,
      skillLevel,
      goal
    };

    localStorage.setItem("learningPreferences", JSON.stringify(userPreferences));
    navigate("/dashboard");
  };

  return (
    <div className="Qn-root">

      <main className="Qn-main">
        <div className="Qn-content">

                 {/* Progress */}

          <div className="Qn-progress-block">

            <div className="Qn-progress-header">
              <div>
                <span className="Qn-step-label">User Questionnaire</span>
                <h1 className="Qn-page-title">Personalizing your experience</h1>
              </div>

              <span className="Qn-pct">50% Complete</span>
            </div>

            <div className="Qn-progress-track">
              <div className="Qn-progress-fill" style={{ width: "50%" }} />
            </div>

          </div>

          {/* Career Path */}
          <section className="Qn-section">
            <h2 className="Qn-section-title">
              What career path are you interested in?
            </h2>

            <div className="Qn-career-grid">
              {CAREER_PATHS.map((p) => (
                <button
                  key={p.id}
                  className={`Qn-career-card ${careerPath === p.id ? "selected" : ""}`}
                  onClick={() => setCareerPath(p.id)}
                >
                  <div className="Qn-career-thumb" style={{ background: `${p.color}18` }}>
                    <span className="Qn-career-emoji">{p.icon}</span>

                    {careerPath === p.id && (
                      <div className="Qn-check-badge">
                        <CheckIcon />
                      </div>
                    )}
                  </div>

                  <div className="Qn-career-info">
                    <p className="Qn-career-name">{p.title}</p>
                    <p className="Qn-career-sub">{p.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Known Languages */}
          <section className="Qn-section">
            <h2 className="Qn-section-title">
              Which programming language(s) are you efficient in?
            </h2>

            <div className="Qn-pills">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  className={`Qn-pill ${knownLanguages.includes(lang) ? "selected" : ""}`}
                  onClick={() => toggleLanguage(lang, knownLanguages, setKnownLanguages)}
                >
                  {lang}
                </button>
              ))}
            </div>
          </section>

          {/* Learning Languages */}
          <section className="Qn-section">
            <h2 className="Qn-section-title">
              Which programming language(s) do you want to learn?
            </h2>

            <div className="Qn-pills">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  className={`Qn-pill ${learningLanguages.includes(lang) ? "selected" : ""}`}
                  onClick={() => toggleLanguage(lang, learningLanguages, setLearningLanguages)}
                >
                  {lang}
                </button>
              ))}
            </div>
          </section>

          {/* Skill Level */}
          <section className="Qn-section">
            <h2 className="Qn-section-title">
              What is your current programming skill level?
            </h2>

            <div className="Qn-skill-grid">
              {SKILL_LEVELS.map((s) => (
                <button
                  key={s.id}
                  className={`Qn-skill-card ${skillLevel === s.id ? "selected" : ""}`}
                  onClick={() => setSkillLevel(s.id)}
                >
                  {skillLevel === s.id && (
                    <div className="Qn-skill-check">
                      <CheckIcon />
                    </div>
                  )}

                  <span className="Qn-skill-emoji">{s.icon}</span>

                  <div className="Qn-skill-info">
                    <p className="Qn-skill-name">{s.label}</p>
                    <p className="Qn-skill-sub">{s.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Goals */}
          <section className="Qn-section">
            <h2 className="Qn-section-title">
              What is your primary goal?
            </h2>

            <div className="Qn-goal-grid">
              {GOALS.map((g) => (
                <button
                  key={g.id}
                  className={`Qn-goal-card ${goal === g.id ? "selected" : ""}`}
                  onClick={() => setGoal(g.id)}
                >
                  {goal === g.id && (
                    <div className="Qn-goal-check">
                      <CheckCircleIcon />
                    </div>
                  )}

                  <div className={`Qn-goal-icon-wrap ${goal === g.id ? "active" : ""}`}>
                    <span className="Qn-goal-emoji">{g.icon}</span>
                  </div>

                  <h3 className="Qn-goal-name">{g.label}</h3>
                  <p className="Qn-goal-sub">{g.sub}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Actions */}
          <div className="Qn-actions">
            <button className="Qn-back-btn" onClick={() => navigate("/")}>
              <ArrowBackIcon />
              Back
            </button>

            <button className="Qn-save-btn" onClick={handleSave}>
              Save
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}