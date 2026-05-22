import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import UserProfile, { user } from "./components/UserProfile";

import {
  MdLocalFireDepartment,
  MdVerifiedUser,
  MdPlayCircle,
  MdCode,
} from "react-icons/md";

/* ---------------- STATS ---------------- */

const STATS = [
  {
    icon: MdLocalFireDepartment,
    iconClass: "orange",
    label: "Coding Streak",
    value: "0 Days",
    badgeText: "Today",
    badgeClass: "muted",
  },
  {
    icon: MdVerifiedUser,
    iconClass: "purple",
    label: "Badges",
    value: "0",
    badgeText: "Earned",
    badgeClass: "muted",
  },
];

/* ---------------- COMPONENTS ---------------- */
function RecommendedLessons() {
  const videos = [
    {
      title: "HTML Crash Course for Beginners",
      channel: "Traversy Media",
      videoId: "UB1O30fR-EE",
    },
    {
      title: "JavaScript Full Course (2025)",
      channel: "freeCodeCamp",
      videoId: "PkZNo7MFNFg",
    },
    {
      title: "React JS Basics Explained",
      channel: "Programming with Mosh",
      videoId: "w7ejDZ8SWv8",
    },
  ];

  return (
    <div className="lesson-hero recommended-wrapper">

      <div className="lesson-hero-content">
        <span className="badge badge-primary">
          Recommended Videos
        </span>

        <h3>Start Learning with Recommended Videos</h3>

        <p>
          Curated beginner-friendly YouTube lessons to help you build real coding skills step by step.
        </p>
      </div>

      <div className="video-grid">
        {videos.map((video) => (
          <a
            key={video.videoId}
            className="video-card"
            href={`https://www.youtube.com/watch?v=${video.videoId}`}
            target="_blank"
            rel="noreferrer"
          >
            <div className="video-thumbnail">
              <img
                src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`}
                alt={video.title}
              />
            </div>

            <div className="video-info">
              <h4>{video.title}</h4>
              <p>{video.channel}</p>
            </div>
          </a>
        ))}
      </div>

    </div>
  );
}
function LessonHero() {
  return (
    <div className="lesson-hero">
      <div className="lesson-hero-content">
        <span className="badge badge-primary">Current Lesson</span>

        <h3>Programming Fundamentals</h3>

        <p>
          Master variables, loops, and conditionals to build a strong foundation.
        </p>

        <div className="lesson-hero-actions">
          <button className="btn btn-primary">
            <MdPlayCircle size={20} />
            Resume Learning
          </button>

          <button className="btn btn-secondary">
            View Outline
          </button>
        </div>
      </div>

      <div className="lesson-hero-bg-icon">
        <MdCode size={120} />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, iconClass, label, value, badgeText, badgeClass }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div className={`stat-icon ${iconClass}`}>
          <Icon size={22} />
        </div>

        <span className={`stat-badge ${badgeClass}`}>{badgeText}</span>
      </div>

      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function ProgressSection() {
  return (
    <section>
      <div className="section-header">
        <h3 className="section-title">Statistics</h3>
        <button className="link-btn">Full Analytics</button>
      </div>

      <div className="stats-grid">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
    </section>
  );
}

function CtaBanner() {
  const navigate = useNavigate();

  return (
    <div className="cta-banner">
      <div>
        <h3>Tailor Your Path</h3>
        <p>Interact with AI to create your own learning path.</p>
      </div>

      <button
        className="btn btn-white"
        onClick={() => navigate("/LearningPath")}
      >
        Go to Learning Path
      </button>
    </div>
  );
}

function AssessmentsBanner() {
  const navigate = useNavigate();

  return (
    <div className="cta-banner">
      <div>
        <h3>Challenge of the day</h3>
        <p>Test your skills with daily programming challenges.</p>
      </div>

      <button
        className="btn btn-white"
        onClick={() => navigate("/challenges")}
      >
        Start challenge
      </button>
    </div>
  );
}

/* ---------------- DASHBOARD ---------------- */

function getProgressMessage(user) {
  if (user?.isNew) {
    return "Start your learning journey today. Let’s build momentum.";
  }

  if (!user?.progress) {
    return "You’ve started your learning path. Keep going.";
  }

  if (user.progress < 100) {
    return `You've completed ${user.progress}% of your path. Keep going.`;
  }

  return "You’ve completed your learning path. Great work!";
}

export default function Dashboard() {
  const [hasStartedLearning] = useState(false);

  const greeting = user?.isNew ? "Welcome" : "Welcome back";

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main">
        <Header />

        <div className="content">
          <div className="content-inner">

            <div className="welcome">
              <h2>
                {greeting}, {user.name}! 👋
              </h2>

              <p>{getProgressMessage(user)}</p>
            </div>

            <div className="section-stack">
              {hasStartedLearning
                ? <LessonHero />
                : <RecommendedLessons />
              }

              <ProgressSection />
              <CtaBanner />
              <AssessmentsBanner />
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}