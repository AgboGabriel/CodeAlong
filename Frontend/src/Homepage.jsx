import { Link } from "react-router-dom";
import "./Homepage.css";
import avatar from "./assets/IMG-20251125-WA0013.jpg";
import logo from "./assets/Code along_logo-04.png";

export default function Homepage() {
  return (
    <div className="homepage">
      {/* NAVBAR */}            
      <nav className="homepage-nav">
        <img className="logo-img" src={logo}/>
        <h1 className="logo-name">Code<span className="along">Along</span></h1>

        {/* Get Started Button */}
        <Link
          to="/signup"
          className="btn-primary"
          style={{ textDecoration: "none", color: "white" }}
        >
          Get Started
        </Link>

        <div className="menu-icon">☰</div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to CodeAlong</h1>
          <h2>Level Up Your Coding Skills</h2>
          <p>
            Learn programming the fun way — interactive lessons, challenges, and
            real support.
          </p>

          {/* Login Button */}
          <Link to="/login" style={{ textDecoration: "none" }}>
            <button
              className="btn-primary hero-login-btn"
              style={{ marginTop: "20px" }}
            >
              Login and start learning
            </button>
          </Link>
        </div>

        <div className="hero-image">
          <img
            src={avatar}
            alt="coding"
          />
        </div>
      </section>

      {/* FEATURES */}
      <section className="features">
        <h1>Why Choose CodeAlong?</h1>

        <div className="feature-grid">
          <div className="feature-box">
            <h3>Beginner Friendly</h3>
            <p>Start from scratch, no stress.</p>
          </div>

          <div className="feature-box">
            <h3>Interactive Lessons</h3>
            <p>Hands-on tasks that make you improve fast.</p>
          </div>

          <div className="feature-box">
            <h3>Real Challenges</h3>
            <p>Push your limits with real coding tasks.</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <p>© {new Date().getFullYear()} ProgrammingTutor. All rights reserved.</p>
      </footer>
    </div>
  );
}

