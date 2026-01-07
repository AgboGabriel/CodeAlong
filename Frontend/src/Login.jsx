import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // TODO: Add real authentication logic here
    navigate("/dashboard");
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

        {/* Signup Redirect */}
        <p className="signup-link">
          Don’t have an account?{" "}
          <a href="/signup" style={{ color: "#2b7cee" }}>
            Sign Up
          </a>
        </p>

        {/* Forgot Password */}
        <p className="forgot-password">
          <a href="/reset-password" style={{ color: "#2b7cee" }}>
            Forgot Password?
          </a>
        </p>
      </div>
    </div>
  );
}




