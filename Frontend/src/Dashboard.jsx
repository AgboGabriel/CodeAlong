import React from "react";
import "./Dashboard.css";
import logo from "./assets/Code along_logo-04.png";

function Dashboard() {
  return (
    <div className="dashboard">

      {/* Navbar */}
      <nav className="navbar">
        <img className="logo-img" src={logo}/>

        <div className="nav-links">
          <a href="#">Lessons</a>
          <a href="#">Challenges</a>
          <a href="#">Profile</a>
        </div>

        <div className="profile-icon"></div>
      </nav>

      {/* Content */}
      <div className="container">

        {/* Welcome Section */}
        <div className="welcome-box">
          <img
            src="/profile.png"
            alt="profile"
          />

          <div className="welcome-text">
            <h2>Welcome back, Alex!</h2>
            <p>Ready to dive back into Python? Let’s master those coding skills.</p>
          </div>

          <button className="btn">Continue Your Last Lesson</button>
        </div>

        {/* Progress */}
        <h3 className="section-title">My Progress</h3>
        <div className="progress-boxes">
          <div className="progress-card">
            <h3>Overall Progress</h3>
            <p>65%</p>
          </div>
          <div className="progress-card">
            <h3>Lessons Completed</h3>
            <p>12</p>
          </div>
          <div className="progress-card">
            <h3>XP Gained</h3>
            <p>1500</p>
          </div>
        </div>

        {/* Recommended Lessons */}
        <h3 className="section-title">Recommended Lessons</h3>

        <div className="lesson-grid">
          <div className="lesson-card">
            <span className="tag beginner">Beginner</span>
            <h4>Introduction to Variables</h4>
            <p>Learn the basics of storing and using data in Python.</p>
            <button className="start-btn">Start Lesson</button>
          </div>

          <div className="lesson-card">
            <span className="tag beginner">Beginner</span>
            <h4>Mastering For Loops</h4>
            <p>Understand how to iterate over sequences efficiently.</p>
            <button className="start-btn">Start Lesson</button>
          </div>

          <div className="lesson-card">
            <span className="tag intermediate">Intermediate</span>
            <h4>Functions and Scope</h4>
            <p>Deep dive into creating and using functions in your code.</p>
            <button className="start-btn">Start Lesson</button>
          </div>
        </div>

        {/* Challenges */}
        <h3 className="section-title">Test Your Skills</h3>

        <div className="challenge-list">
          <div className="challenge-item">
            <span>
              Palindrome Checker{" "}
              <span className="difficulty easy">Easy</span>
            </span>
            <button className="challenge-btn">Start Challenge</button>
          </div>

          <div className="challenge-item">
            <span>
              Array Sorting Algorithm{" "}
              <span className="difficulty intermediate">Intermediate</span>
            </span>
            <button className="challenge-btn">Start Challenge</button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
