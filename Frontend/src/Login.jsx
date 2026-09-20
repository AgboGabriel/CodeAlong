import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import AuthFeedbackModal from "./Components/AuthFeedbackModal";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        if (data.user?.role === "admin") {
          navigate("/admin");
        } else if (!data.user?.questionnaire_completed) {
          navigate("/Questionnaire");
        } else {
          navigate("/dashboard");
        }
      } else {
        setFeedback({
          type: "error",
          title: "We couldn't sign you in",
          message: data.error || "Check your email and password, then try again.",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      setFeedback({
        type: "error",
        title: "We couldn't reach the server",
        message: "Please check your internet connection and try again in a moment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "/auth/google";
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Login</h1>

        <form className="login-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Login"}
          </button>
        </form>
        

        

        <p className="back-to-landing-page-link">
          Don't have an account?{" "}
          <span
            onClick={() => navigate("/")}
            style={{ color: "#2b7cee", cursor: "pointer" }}
          >
            Back to Landing Page
          </span>
        </p>

        <p className="forgot-password">
          <a href="/reset-password" style={{ color: "#2b7cee" }}>
            Forgot Password?
          </a>
        </p>
        <button type="button" className="Lp-social-btn" onClick={handleGoogleLogin}>
            <FcGoogle size={30} />
            Continue with Google
          </button>
      </div>
      <AuthFeedbackModal feedback={feedback} onClose={() => setFeedback(null)} />
    </div>
  );
}
