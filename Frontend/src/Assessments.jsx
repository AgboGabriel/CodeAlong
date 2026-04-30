import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "./assets/Code along_logo-03.png";
import "./Assessments.css";

import {
  MdDashboard,
  MdMenuBook,
  MdAccountTree,
  MdFolderOpen,
  MdSettings,
  MdNotifications,
  MdSearch,
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
        <input
          className="search-input"
          type="text"
          placeholder="Search assessments..."
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

  

  

export default function Assessments() {
  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main">
        <Header />

        <div className="content">
          <div className="content-inner">
            
          </div>
        </div>
      </main>
    </div>
  );
}
