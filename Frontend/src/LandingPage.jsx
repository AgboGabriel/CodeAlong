import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBrain,
  FaLaptopCode,
  FaUsers,
  FaUser,
  FaEnvelope,
  FaLock,
} from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import logo from "./assets/Code along_logo-03.png";
import "./LandingPage.css";

const features = [
  {
    icon: <FaBrain size={32} color="#256af4" />,
    title: "Adaptive Curriculum",
    desc: "Our system analyzes your performance and adapts your learning path to match your pace and skill level.",
  },
  {
    icon: <FaLaptopCode size={32} color="#256af4" />,
    title: "In-Browser IDE",
    desc: "Write, run, and submit code directly in your browser for instant assessment.",
  },
  {
    icon: <FaUsers size={32} color="#256af4" />,
    title: "Expert Support",
    desc: "Get 24/7 assistance from our AI mentor and connect with a global community of aspiring developers.",
  },
];

export default function CodeAI() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    terms: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  const handleRegister = async (e)=>{
    e.preventDefault();
    if(!form.terms){
      alert("You must agree to the terms and conditions");
      return;
    }
    try{
      const response= await fetch("http://localhost:3000/auth/register",{
      method: "POST",
      headers:{
        "Content-Type":"application/json"
      },
      body: JSON.stringify({
        username: form.username,
        email:form.email,
        password: form.password
      })
    });
    const data= await response.json();
    console.log("Registration response:", data);
    
    if(response.ok){
      navigate("/Questionnaire");
    }else{
      alert(data.error || "Registration failed");
    }

    }catch(error){
      console.error("Error during registration:", error);
      alert("Unable to connect to the server");}
   
  }

  const handleGoogleLogin = ()=>{
    window.location.href= "http://localhost:3000/auth/google";
  }
 
  return (
    <div className="Lp-root">
      {/* Header */}
      <header className="Lp-header">
        <div className="Lp-logo">
          <div className="Lp-logo-icon">
            <img className="logo-img" src={logo} alt="Logo" />
          </div>
          <span className="Lp-logo-text">CodeAlong</span>
        </div>

       

        <button
          className="Lp-btn-primary Lp-login"
          onClick={() => navigate("/login")}
        >
          Login
        </button>
      </header>

      {/* Hero */}
      <main className="Lp-main">
        <section className="Lp-hero">

          {/* Left */}
          <div className="Lp-hero-left">

            <div className="Lp-badge">
              <span className="Lp-badge-bolt">⚡</span>
              Powered by Next-Gen AI
            </div>

            <div className="Lp-hero-copy">
              <h1 className="Lp-headline">
                Personalized Learning, <span className="Lp-highlight">AI-Driven Results</span>
              </h1>

              <p className="Lp-subhead">
                Master coding with our AI-powered tutoring system. Personalized learning paths, real-time feedback, adaptive curriculum, and daily challenges to take you from beginner to confident developer.
              </p>
            </div>

            <div className="Lp-social-proof">
              <div className="Lp-avatars">
                <div className="Lp-avatar Lp-avatar-1" />
                <div className="Lp-avatar Lp-avatar-2" />
                <div className="Lp-avatar Lp-avatar-3" />
              </div>
              <span className="Lp-proof-text">
                Joined by 10,000+ developers
              </span>
            </div>

            {/* Video / Code Mockup */}
            <div className="Lp-video-preview">

              <div className="Lp-video-overlay" />

              <button className="Lp-play-btn" aria-label="Play demo video">
                <span className="Lp-play-icon">▶</span>
              </button>

              <div className="Lp-code-mockup">

                <div className="Lp-dots">
                  <span className="dot red" />
                  <span className="dot yellow" />
                  <span className="dot green" />
                </div>

                <div className="Lp-code-lines">
                  <div className="Lp-code-line w75 pulse" />
                  <div className="Lp-code-line w50 pulse delay1" />
                  <div className="Lp-code-line w85 pulse delay2" />
                  <div className="Lp-code-line w60 pulse delay3" />
                </div>

              </div>
            </div>

          </div>

          {/* Right — Sign Up */}
          <div className="Lp-hero-right">

            <div className="Lp-form-card">

              <div className="Lp-form-header">
                <h2>Create your account</h2>
                <p>
                  Start your journey today with our AI-powered coding platform.
                </p>
              </div>

              <div className="Lp-form">

                <div className="Lp-field">
                  <label>Username</label>

                  <div className="Lp-input-wrap">
                    <FaUser className="Lp-input-icon" />
                    <input
                      type="text"
                      name="username"
                      placeholder="Choose a username"
                      value={form.username}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="Lp-field">
                  <label>Email Address</label>

                  <div className="Lp-input-wrap">
                    <FaEnvelope className="Lp-input-icon" />
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      value={form.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="Lp-field">
                  <label>Password</label>

                  <div className="Lp-input-wrap">
                    <FaLock className="Lp-input-icon" />
                    <input
                      type="password"
                      name="password"
                      placeholder="Create a password"
                      value={form.password}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="Lp-checkbox-row">
                  <input
                    type="checkbox"
                    name="terms"
                    checked={form.terms}
                    onChange={handleChange}
                  />

                  <label>
                    I agree to the <a href="#">Terms</a> and{" "}
                    <a href="#">Privacy Policy</a>
                  </label>
                </div>

                <button
                  className="Lp-btn-primary Lp-submit"
                  onClick={handleRegister}
                >
                  Get Started Now
                </button>

              </div>

              <div className="Lp-divider">
                <span>Or continue with</span>
              </div>

              <div className="Lp-social-btns">

                <button className="Lp-social-btn" onClick={handleGoogleLogin}>
                  <FcGoogle size={24} /> Google
                </button>


              </div>

            </div>
          </div>

        </section>

        {/* Features */}
        <section className="Lp-features">

          <div className="Lp-features-inner">

            {features.map((f) => (
              <div className="Lp-feature-card" key={f.title}>

                <div className="Lp-feature-icon">
                  {f.icon}
                </div>

                <h3>{f.title}</h3>

                <p>{f.desc}</p>

              </div>
            ))}

          </div>

        </section>

      </main>

      {/* Footer */}
      <footer className="Lp-footer">

        <div className="Lp-footer-inner">

          <div className="Lp-footer-brand">
            <img className="logo-img" src={logo} alt="Logo" />
            <span>CodeAlong © 2026</span>
          </div>

          <div className="Lp-footer-links">
            <a href="#">Twitter</a>
            <a href="#">Discord</a>
            <a href="#">Blog</a>
            <a href="#">Privacy</a>
          </div>

        </div>

      </footer>

    </div>
  );
}