import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./CreateNewPassword.css";

export default function CreateNewPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    // You can add validation logic here
    if(!token){
      alert("Invalid or missing token");
      return;
    }
    if(password !== confirmPassword){
      alert("Passwords do not match!");
      return;
    };
    try{
       const response=await fetch("http://localhost:3000/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }
        alert("Password successfully changed!");
        navigate("/login");
    }catch(error){
      console.error("Error occurred while resetting password:", error);
      alert(error.message || "Unable to connect to the server");
    }
    
    
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
