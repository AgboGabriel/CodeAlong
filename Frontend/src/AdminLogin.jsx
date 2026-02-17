import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css"; 

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // TODO: Replace with real admin authentication logic
    if (email === "admin@example.com" && password === "admin123") {
      navigate("/admin-dashboard"); // go to admin dashboard after login
    } else {
      alert("Invalid admin credentials");
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Admin Login</h1>

        <form className="login-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Admin Email"
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

        <p className="forgot-password">
          <a href="/reset-password" style={{ color: "#2b7cee" }}>
            Forgot Password?
          </a>
        </p>
      </div>
    </div>
  );
}
