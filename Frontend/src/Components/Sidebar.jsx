import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/Code along_logo-03.png";
import "./Sidebar.css";

import {
  MdDashboard,
  MdMenuBook,
  MdAccountTree,
  MdFolderOpen,
  MdLogout,
} from "react-icons/md";

const NAV_ITEMS = [
  { icon: MdDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: MdMenuBook, label: "My Lessons", path: "/MyLessons" },
  { icon: MdAccountTree, label: "Learning Path", path: "/LearningPath" },
  { icon: MdFolderOpen, label: "Assessments", path: "/Assessments" },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <aside className="sidebar">

      <div className="sidebar-logo">
        <div className="logo-icon">
          <img className="logo-img" src={logo} alt="Logo" />
        </div>

        <span className="logo-text">
          CodeAlong
        </span>
      </div>

      <nav className="sidebar-nav">

        {NAV_ITEMS.map(({ icon, label, path }) => {
          const Icon = icon;

          return (
            <Link
              key={label}
              to={path}
              className={`nav-item ${
                location.pathname === path
                  ? "active"
                  : ""
              }`}
            >
              <Icon size={30} />
              {label}
            </Link>
          );
        })}

      </nav>

      <div className="sidebar-footer">

        <button
          className="logout-btn"
          onClick={handleLogout}
        >
          <MdLogout size={30} />
          <span>Logout</span>
        </button>

      </div>
    </aside>
  );
}