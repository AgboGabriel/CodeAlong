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
import AuthFeedbackModal from "./Components/AuthFeedbackModal";
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
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const passwordChecks = [
    ["12+ characters", form.password.length >= 12],
    ["uppercase", /[A-Z]/.test(form.password)],
    ["lowercase", /[a-z]/.test(form.password)],
    ["number", /[0-9]/.test(form.password)],
    ["special character", /[^A-Za-z0-9]/.test(form.password)],
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  
  const handleRegister = async (e)=>{
    e.preventDefault();
    setFeedback(null);
    if(!form.username.trim() || !form.email.trim() || !form.password){
      setFeedback({ type: "error", title: "Complete your details", message: "Enter a username, email address, and password before creating your account." });
      return;
    }
    if(
      form.password.length < 12 ||
      !/[A-Z]/.test(form.password) ||
      !/[a-z]/.test(form.password) ||
      !/[0-9]/.test(form.password) ||
      !/[^A-Za-z0-9]/.test(form.password)
    ){
      setFeedback({ type: "error", title: "Choose a stronger password", message: "Use at least 12 characters with uppercase, lowercase, a number, and a special character." });
      return;
    }
    if(!form.terms){
      setFeedback({ type: "error", title: "Terms acceptance required", message: "Please agree to the Terms and Privacy Policy before creating your account." });
      return;
    }
    setIsSubmitting(true);
    try{
      const response= await fetch("/auth/register",{
      method: "POST",
      credentials: "include",
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
    if(response.ok){
      navigate("/Questionnaire");
    }else{
      setFeedback({ type: "error", title: "We couldn't create your account", message: data.error || "Please review your details and try again." });
    }

    }catch(error){
      console.error("Error during registration:", error);
      setFeedback({ type: "error", title: "We couldn't reach the server", message: "Please check your internet connection and try again in a moment." });
    } finally {
      setIsSubmitting(false);
    }
   
  }

  const handleGoogleLogin = ()=>{
    window.location.href= "/auth/google";
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

          

            <div className="Lp-hero-copy">
              <h1 className="Lp-headline">
                Personalized Learning, <span className="Lp-highlight">AI-Driven Results</span>
              </h1>

              <p className="Lp-subhead">
                Master coding with our AI-powered tutoring system. Personalized learning paths, real-time feedback, adaptive curriculum, and daily challenges to take you from beginner to confident developer.
              </p>
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

              <form className="Lp-form" onSubmit={handleRegister}>

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
                      required
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
                      required
                    />
                  </div>
                </div>

                <div className="Lp-field">
                  <label>Password</label>

                  <div className="Lp-input-wrap">
                    <FaLock className="Lp-input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Create a password"
                      value={form.password}
                      onChange={handleChange}
                      minLength={12}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                  <div className="Lp-password-tools">
                    <label><input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} /> Show password</label>
                    <div className="Lp-password-checks">
                      {passwordChecks.map(([label, passed]) => <span key={label} className={passed ? "passed" : ""}>{passed ? "✓" : "○"} {label}</span>)}
                    </div>
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
                  type="submit"
                  className="Lp-btn-primary Lp-submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating account..." : "Get Started Now"}
                </button>

              </form>

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
      <AuthFeedbackModal feedback={feedback} onClose={() => setFeedback(null)} />

    </div>
  );
}
