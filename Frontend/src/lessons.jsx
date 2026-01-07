import React, { useState } from "react";
import logo from "./assets/Code along_logo-04.png";
import "./lessons.css";

const lessonsData = {
  C: [
    { title: "Introduction to C", desc: "Learn the basics of C.", progress: 40 },
    { title: "Data Types", desc: "Understand variables and types.", completed: true },
    { title: "Operators", desc: "Learn arithmetic and logical operators.", action: true },
    { title: "Loops", desc: "For, while, and do-while loops.", progress: 20 },
    { title: "Functions", desc: "Organize code into functions.", action: true },
    { title: "Arrays", desc: "Store multiple values.", completed: true },
  ],
  "C#": [
    { title: "Introduction to C#", desc: "Basics of C# language.", action: true },
    { title: "Variables & Types", desc: "Learn C# data types.", completed: true },
    { title: "Conditional Statements", desc: "If, else, and switch.", progress: 60 },
    { title: "Loops", desc: "For, while, foreach loops.", action: true },
    { title: "Methods", desc: "Reusable blocks of code.", completed: true },
    { title: "Classes & Objects", desc: "OOP concepts in C#.", progress: 30 },
  ],
  "C++": [
    { title: "C++ Basics", desc: "Learn the syntax and structure.", completed: true },
    { title: "Variables & Data Types", desc: "Manage your data.", progress: 50 },
    { title: "Operators", desc: "Arithmetic and logical operators.", action: true },
    { title: "Loops", desc: "For, while, do-while loops.", action: true },
    { title: "Functions", desc: "Organize code with functions.", completed: true },
    { title: "OOP Concepts", desc: "Classes and objects in C++.", progress: 20 },
  ],
  Java: [
    { title: "Introduction to Java", desc: "Setup and basics.", completed: true },
    { title: "Data Types", desc: "Primitive and reference types.", progress: 40 },
    { title: "Operators", desc: "Perform calculations.", action: true },
    { title: "Loops", desc: "For, while, do-while.", action: true },
    { title: "Methods", desc: "Reusable code blocks.", completed: true },
    { title: "OOP Basics", desc: "Classes, objects, inheritance.", progress: 25 },
  ],
  JavaScript: [
    { title: "Intro to JavaScript", desc: "Basics of JS.", completed: true },
    { title: "Variables & Types", desc: "var, let, const.", progress: 50 },
    { title: "Functions", desc: "Reusable code blocks.", action: true },
    { title: "Arrays & Objects", desc: "Store and access data.", completed: true },
    { title: "DOM Manipulation", desc: "Change webpage content.", progress: 30 },
    { title: "Events", desc: "Handle user actions.", action: true },
  ],
  Python: [
    { title: "Python Basics", desc: "Introduction to Python.", completed: true },
    { title: "Variables & Types", desc: "Store and manipulate data.", progress: 40 },
    { title: "Operators", desc: "Arithmetic and logical operations.", action: true },
    { title: "Loops", desc: "Repeat tasks efficiently.", completed: true },
    { title: "Functions", desc: "Reusable code blocks.", progress: 50 },
    { title: "Modules & Packages", desc: "Organize your code.", action: true },
  ],
};

const languageIcons = {
  Python: "🐍",
  JavaScript: "🟨",
  Java: "☕",
  C: "💻",
  "C#": "🎯",
  "C++": "➕",
};

const filterIcons = {
  all: "📚",
  completed: "✔",
  inprogress: "⏳",
  notstarted: "🛠️",
};

export default function Lessons() {
  const [activeLanguage, setActiveLanguage] = useState("Python");
  const [filter, setFilter] = useState("all");

  const filteredLessons = lessonsData[activeLanguage].filter((lesson) => {
    if (filter === "completed") return lesson.completed;
    if (filter === "inprogress") return typeof lesson.progress === "number" && !lesson.completed;
    if (filter === "notstarted") return lesson.action && !lesson.completed && !lesson.progress;
    return true; // 'all'
  });

  return (
    <div className="app dark">
      <aside className="sidebar">
        <div className="profile">
          <div
            className="avatar"
            style={{
              backgroundImage:
                'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCUF8I3FC-fsfea1K4rjwjF44ixDD3cnB32c-19qEkVoNHbtjmSuJYFh3Q8D0fzC7OzhDenitFwUDGirziIIsekmy34xYdk_-3VETY2-ztj_FwRHhWxLXqz1gNWuwUOtm6WloruFINK-sFK6hR9RJfDuzbxcdk9ChUYHc6gp_wWHZaYNbGPK4r75i5D7zT-J3wmiKDgQX77W4xlPMwL0C2xo0s4Evr2g3t4wmSKHBkKSVN9EPM1TMjAPuoS1UrTJD6Q_82oTtYNwMgD")',
            }}
          />
          <div className="profile-info">
            <h3>Alex Doe</h3>
            <p>Level 12 Coder</p>
          </div>
        </div>

        <nav className="nav">
          {Object.keys(lessonsData).map((lang) => (
            <div
              key={lang}
              className={`nav-section ${lang === activeLanguage ? "active" : ""}`}
              onClick={() => setActiveLanguage(lang)}
            >
              <span className="icon">{languageIcons[lang]}</span>
              <span className="section-name">{lang}</span>
            </div>
          ))}
        </nav>

        <button className="upgrade-btn">Upgrade to Pro</button>
      </aside>

      <main className="main">
        <header className="header">
  <div className="header-left">
    <h1>{activeLanguage} Lessons</h1>
    <p>Pick a lesson and keep the grind going 🚀</p>
  </div>
  <div className="header-right">
    <img className="logo-img" src={logo} alt="Logo" />
  </div>
</header>


        <div className="search-container">
          <input className="search" placeholder="Search for lessons..." />
          <div className="filters">
            {["all", "completed", "inprogress", "notstarted"].map((f) => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                <span className="filter-icon">{filterIcons[f]}</span> {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <section className="lessons">
          {filteredLessons.map((lesson, index) => (
            <LessonCard key={index} {...lesson} tag={activeLanguage} />
          ))}
        </section>
      </main>

      <button className="ai-btn">🤖</button>
    </div>
  );
}

function LessonCard({ tag, title, desc, progress, completed, action }) {
  return (
    <div className="lesson-card">
      <div className="lesson-content">
        <span className="tag">{tag}</span>
        <h3>{title}</h3>
        <p>{desc}</p>
      </div>

      <div className="lesson-footer">
        {completed && <span className="completed">✔ Completed</span>}

        {typeof progress === "number" && !completed && (
          <>
            <div className="progress">
              <div className="progress-info">
                <span>In Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="bar">
                <div className="fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <button className="continue-btn">Continue Lesson</button>
          </>
        )}

        {action && !completed && !progress && (
          <button className="start-btn">Start Lesson</button>
        )}
      </div>
    </div>
  );
}
