import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "./assets/Code along_logo-03.png";
import "./Dashboard.css";

import {
  MdDashboard,
  MdMenuBook,
  MdAccountTree,
  MdFolderOpen,
  MdDataUsage,
  MdLocalFireDepartment,
  MdVerifiedUser,
  MdSettings,
  MdNotifications,
  MdSearch,
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
  { icon: MdMenuBook, label: "My Lessons", path: "" },
  { icon: MdAccountTree, label: "Learning Path", path: "" },
  { icon: MdFolderOpen, label: "Assessment", path: "" },
];

const STATS = [
  {
    icon: MdDataUsage,
    iconClass: "blue",
    label: "Completion Rate",
    value: "00.0%",
    badgeText: "+0%",
    badgeClass: "green",
  },
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
  const [activeItem, setActiveItem] = useState("Dashboard");

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
              className={`nav-item ${activeItem === label ? "active" : ""}`}
              onClick={() => setActiveItem(label)}
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
        <input
          className="search-input"
          type="text"
          placeholder="Search lessons..."
        />
        <MdSearch className="search-icon" size={25} />
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
        <h3 className="section-title">My Progress</h3>
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
        onClick={() => navigate("")}
      >
        Go to Learning Path
      </button>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main">
        <Header />

        <div className="content">
          <div className="content-inner">
            <div className="welcome">
              <h2>Welcome back, {user.name}! 👋</h2>
              <p>
                You've completed 65% of your current path. Keep the momentum
                going.
              </p>
            </div>

            <div className="section-stack">
              <LessonHero />
              <ProgressSection />
              <CtaBanner />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
