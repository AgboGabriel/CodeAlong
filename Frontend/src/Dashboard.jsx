import React from "react";
import { Link, useNavigate } from "react-router-dom"; // <-- import useNavigate
import "./Dashboard.css";
import logo from "./assets/Code along_logo-04.png";

function Dashboard() {
  const navigate = useNavigate(); // <-- initialize navigate

  const handleLogout = () => {
    // TODO: clear auth tokens here if using authentication
    navigate("/"); // navigate to homepage
  };

  return (
    <div className="dashboard">
      {/* Navbar */}
      <nav className="navbar">
        <img className="logo-img" src={logo} alt="Logo" />

        <div className="nav-links">
          <Link to="/lessons">Lessons</Link>
          <Link to="/challenges">Challenges</Link>
          <Link to="/profile">Settings</Link>
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

      {/* Content */}
      <div className="container">
        {/* Welcome Section */}
        <div className="welcome-box">
          <div className="welcome-text">
            <h2>Welcome back!</h2>
            <p>Ready to dive back into your last lesson?</p>
          </div>
          <button className="btn">Continue Your Last Lesson</button>
        </div>

        {/* Progress */}
        <h3 className="section-title">My Progress</h3>
        <div className="progress-boxes">
          <div className="progress-card">
            <h3>Programming Languages</h3>
            <p>9</p>
          </div>
          <div className="progress-card">
            <h3>Lessons Available</h3>
            <p>32</p>
          </div>
          <div className="progress-card">
            <h3>Lessons Completed</h3>
            <p>16</p>
          </div>
        </div>

        {/* Recommended Lessons */}
        <h3 className="section-title">Recommended Lessons</h3>
        <div className="lesson-grid">
          <div className="recommended-lesson-card">
            <span className="dashboard-tag beginner">Beginner</span>
            <h4>Introduction to Variables</h4>
            <p>Learn the basics of storing and using data in Python.</p>
            <button className="dashboard-start-btn">Start Lesson</button>
          </div>

          <div className="recommended-lesson-card">
            <span className="dashboard-tag beginner">Beginner</span>
            <h4>Mastering For Loops</h4>
            <p>Understand how to iterate over sequences efficiently.</p>
            <button className="dashboard-start-btn">Start Lesson</button>
          </div>

          <div className="recommended-lesson-card">
            <span className="dashboard-tag intermediate">Intermediate</span>
            <h4>Functions and Scope</h4>
            <p>Deep dive into creating and using functions in your code.</p>
            <button className="dashboard-start-btn">Start Lesson</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
