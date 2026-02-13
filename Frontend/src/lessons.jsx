import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "./assets/Code along_logo-04.png";
import "./lessons.css";

const languages = [
  "Python",
  "JavaScript",
  "Java",
  "C",
  "C#",
  "C++",
  "Go",
  "Ruby",
  "Rust",
];

const languageIcons = {
  Python: <i className="devicon-python-plain colored" />,
  JavaScript: <i className="devicon-javascript-plain colored" />,
  Java: <i className="devicon-java-plain colored" />,
  C: <i className="devicon-c-plain colored" />,
  "C#": <i className="devicon-csharp-plain colored" />,
  "C++": <i className="devicon-cplusplus-plain colored" />,
  Go: <i className="devicon-go-plain colored" />,
  Ruby: <i className="devicon-ruby-plain colored" />,
  Rust: <i className="devicon-rust-plain colored" />,
};


/* TEMP DATA */
const videosByLanguage = {
  Python: [],
  JavaScript: [],
  Java: [],
  C: [],
  "C#": [],
  "C++": [],
  Go: [],
  Ruby: [],
  Rust: [],
};

export default function Lessons() {
  const [activeLanguage, setActiveLanguage] = useState("Python");
  const navigate = useNavigate();

  const videos = videosByLanguage[activeLanguage];

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
          {languages.map((lang) => (
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
      </aside>

      <main className="main">
        <header className="header">
          <div className="header-left">
            <button className="back-btn" onClick={() => navigate("/dashboard")}>
              ← Back to Dashboard
            </button>
            <h1>{activeLanguage} Lessons</h1>
            <p>Begin your {activeLanguage} programming journey</p>
          </div>
          <div className="header-right">
            <img className="logo-img" src={logo} alt="Logo" />
          </div>
        </header>

        <div className="search-container">
          <input className="search" placeholder="Search lesson videos..." />
        </div>

        {videos.length === 0 ? (
          <section className="lessons empty-state">
            <div className="no-content">
              <h2>No lesson videos yet</h2>
              <p>Videos uploaded will show here</p>
            </div>
          </section>
        ) : (
          <section className="lessons">
            {videos.map((video) => (
              <div className="lesson-card" key={video.id}>
                <video className="lesson-video" src={video.url} controls />
                <div className="lesson-content">
                  <h3>{video.title}</h3>
                  <p className="lesson-date">Added on {video.date}</p>
                </div>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
