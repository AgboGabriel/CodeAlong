import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import googleIcon from "./assets/google.png";
import "./SignUp.css";

export default function SignUp() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <h1>Create Account</h1>

        <form className="signup-form" onSubmit={handleSubmit}>
          <input type="text" placeholder="Full Name" required />
          <input type="email" placeholder="Email" required />

          {/* Password */}
          <div className="input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span
              className="toggle-eye"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>

          {/* Confirm Password */}
          <div className="input-wrapper">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <span
              className="toggle-eye"
              onClick={() => setShowConfirm(!showConfirm)}
            >
              {showConfirm ? "🙈" : "👁️"}
            </span>
          </div>

          <button type="submit" className="btn-primary">
            Sign Up
          </button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <div className="google-section">
          <button className="google-btn">
            <img src={googleIcon} alt="Google" />
            Sign Up with Google
          </button>
        </div>
      </div>
    </div>
  );
}

