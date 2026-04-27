import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginMessage("");

    try {
      const response = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("Login response:", data);

      if (response.ok) {
        navigate("/dashboard");
      } else {
        setLoginMessage(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginMessage("Unable to connect to the server");
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:3000/auth/google";
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

          <button type="submit" className="btn-primary">
            Login
          </button>
        </form>

        {loginMessage ? <p className="forgot-password">{loginMessage}</p> : null}
        

        

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
    </div>
  );
}
