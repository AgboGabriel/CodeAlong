import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./AdminDashboard.css";
import logo from "./assets/Code along_logo-04.png";

function AdminDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/"); // navigate to homepage
  };

  // Live date & time
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="admin-dashboard">
      {/* Navbar */}
      <nav className="navbar">
        <img className="logo-img" src={logo} alt="Logo" />

        <div className="nav-links">
          <Link to="/admin/users">User Management</Link>
          <Link to="/admin/lessons">Lessons Management</Link>
          <Link to="/admin-settings">AdminSettings</Link>
        </div>

        {/* User profile + Logout */}
        <div className="user-actions">
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>

          <div
            className="profile-icon"
            style={{
              backgroundImage:
                'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCUF8I3FC-fsfea1K4rjwjF44ixDD3cnB32c-19qEkVoNHbtjmSuJYFh3Q8D0fzC7OzhDenitFwUDGirziIIsekmy34xYdk_-3VETY2-ztj_FwRHhWxLXqz1gNWuwUOtm6WloruFINK-sFK6hR9RJfDuzbxcdk9ChUYHc6gp_wWHZaYNbGPK4r75i5D7zT-J3wmiKDgQX77W4xlPMwL0C2xo0s4Evr2g3t4wmSKHBkKSVN9EPM1TMjAPuoS1UrTJD6Q_82oTtYNwMgD")',
            }}
          ></div>
        </div>
      </nav>

      {/* Admin Stats */}
      <div className="container">
        <div className="dashboard-header">
          <h2>Admin Dashboard</h2>
          <span className="dashboard-date">{currentTime.toLocaleDateString()}</span>
        </div>

        <div className="stats-boxes">
          <div className="stat-card">
            <h3>Total Users</h3>
            <p>0</p>
          </div>
          <div className="stat-card">
            <h3>Total Lessons Available</h3>
            <p>0</p>
          </div>
          <div className="stat-card">
            <h3>Programming Languages</h3>
            <p>9</p>
          </div>
        </div>

        <h3 className="section-title">Quick Actions</h3>
        <div className="action-grid">
          <div className="action-card">
            <h4>Manage Users</h4>
            <p>Add, edit, or remove users.</p>
            <Link to="/admin/users">
              <button className="action-btn">Go</button>
            </Link>
          </div>

          <div className="action-card">
            <h4>Manage Lessons</h4>
            <p>Create, update, or delete lessons.</p>
            <Link to="/admin/lessons">
              <button className="action-btn">Go</button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Live Time */}
      <div className="live-datetime">
        {currentTime.toLocaleTimeString()}
      </div>

            {/* FOOTER */}
      <footer className="admin-footer">
        <p>© {new Date().getFullYear()} CodeAlong. All rights reserved.</p>
      </footer>

    </div>
  );
}

export default AdminDashboard;
