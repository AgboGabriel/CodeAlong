import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import logo from "./assets/Code along_logo-03.png";
import "./Dashboard.css";


import {
  MdDashboard,
  MdMenuBook,
  MdAccountTree,
  MdFolderOpen,
  MdLocalFireDepartment,
  MdVerifiedUser,
  MdSettings,
  MdNotifications,
  MdPlayCircle,
  MdCode
} from "react-icons/md";

const user = {
  name: "Alex Rivera",
  avatar:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCHkmMqD5gKaMYLSydOBQc_Zi7wsLqmErMbtpFZ_5-AzR8-GBVVggx2vz3YzNgs5Hoy-od2NIrLSCZxHox3QfDozggMjyXwAkivdXCAnN8X0SPM_4icaBffmPVNgH8o7hrt7pZetO5A34GxGG7-Wo5ffA5JXpfZ9BYdN4-hnrlIM9xG9MtFYNRE-V08HC6Rw_Eeg7AFzzK5lLrWd9H9tOt37FmZS5CIAKG6brXAECIkUSxxGH6SXwrAFI7L8CN5DIz9nBnx5RSp6YE",
};

const NAV_ITEMS = [
  { icon: MdDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: MdMenuBook, label: "My Lessons", path: "/MyLessons" },
  { icon: MdAccountTree, label: "Learning Path", path: "/LearningPath" },
  { icon: MdFolderOpen, label: "Assessments", path: "/Assessments" },
];

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





function UserProfile({ small, onClick }) {
  return (
    <>
      <div className={`avatar ${small ? "avatar-sm" : ""}`} onClick={onClick}>
        <img src={user.avatar} alt={user.name} />
      </div>

      {!small && (
        <div className="user-info">
          <div className="user-name">{user.name}</div>
        </div>
      )}
    </>
  );
}

function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <img className="logo-img" src={logo} alt="Logo" />
        </div>
        <span className="logo-text">CodeAlong</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ icon, label, path }) => {
          const Icon = icon;

          return (
            <Link
              key={label}
              to={path}
              className={`nav-item ${
                location.pathname === path ? "active" : ""
              }`}
            >
              <Icon size={30} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    navigate("/"); // Redirect to landing page
  };

  return (
    <header className="header">
      <div className="search-wrap">
      </div>

      <div className="header-right">
        <button className="notif-btn" aria-label="Notifications">
          <MdNotifications size={30} />
          <span className="notif-dot" />
        </button>

        <div className="divider-v" />

        <div className="header-user" ref={dropdownRef}>
          <div
            className="header-user-text"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="user-name">{user.name}</div>
          </div>

          <UserProfile small onClick={() => setDropdownOpen(!dropdownOpen)} />

          <button className="icon-btn" aria-label="Settings">
            <MdSettings size={30} />
          </button>

          {dropdownOpen && (
            <div className="user-dropdown">
              <button className="dropdown-item" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function LessonHero() {
  const navigate = useNavigate();

  return (
    <div className="lesson-hero">
      <div className="lesson-hero-content">
        <span className="badge badge-primary">Current Lesson</span>

        <h3>Programming Fundamentals</h3>

        <p>
          Master the core concepts of variables, loops, and conditional logic
          to build a strong foundation.
        </p>

        <div className="lesson-hero-actions">
          <button
            className="btn btn-primary"
            onClick={() => navigate("")}
          >
            <MdPlayCircle size={20} />
            Resume Learning
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => navigate("")}
          >
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

function StatCard({ icon, iconClass, label, value, badgeText, badgeClass }) {
  const Icon = icon;

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
        <p>Interact with our AI to create your own learning path.</p>
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
        <p>Get random challenges daily to test your knowledge on the programming languages you already know.</p>
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

        <h3>Start Learning with Recommended videos</h3>

        <p>
          Curated beginner-friendly YouTube lessons to help you build real coding skills step by step.
        </p>
      </div>

      {/* VIDEO GRID */}
      <div className="video-grid">
        {videos.map((video, index) => (
          <a
            key={index}
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

export default function Dashboard() {
  const [hasStartedLearning, setHasStartedLearning] = useState(false);
   const greeting = user.isNew ? "Welcome" : "Welcome back";

   const getProgressMessage = (user) => {
  if (user?.isNew) {
    return "Start your learning journey today. Let’s build momentum.";
  }

  if (!user?.progress || user.progress === 0) {
    return "You’ve started your learning path. Let’s keep going.";
  }

  if (user.progress < 100) {
    return `You've completed ${user.progress}% of your current path. Keep the momentum going.`;
  }

  return "You’ve completed your learning path. Great work!";
};

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
             {hasStartedLearning ? <LessonHero /> : <RecommendedLessons />}
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
