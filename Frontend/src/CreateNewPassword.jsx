import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateNewPassword.css";

export default function CreateNewPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // You can add validation logic here
    alert("Password successfully changed!");
    navigate("/login");
  };

  return (
    <div className="newpass-page">
      <div className="newpass-container">
        <h1>Create New Password</h1>
        <p>Enter a new password for your account.</p>

        <form className="newpass-form" onSubmit={handleSubmit}>
          {/* Password */}
          <div className="input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New Password"
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
              placeholder="Confirm New Password"
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
            Reset Password
          </button>
        </form>

        <p className="back-login">
          Remembered your password? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
}
