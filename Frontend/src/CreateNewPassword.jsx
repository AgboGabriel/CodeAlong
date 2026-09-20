import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthFeedbackModal from "./Components/AuthFeedbackModal";
import "./CreateNewPassword.css";

export default function CreateNewPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!token){
      setFeedback({ type: "error", title: "Reset link is invalid", message: "Request a new password-reset link and use the most recent email we sent." });
      return;
    }
    if(password !== confirmPassword){
      setFeedback({ type: "error", title: "Passwords do not match", message: "Enter the same new password in both fields and try again." });
      return;
    }
    setFeedback(null);
    setIsSubmitting(true);
    try{
       const response=await fetch("/auth/reset-password", {
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
        setFeedback({ type: "success", title: "Password changed", message: "Your password has been updated. You can now sign in with it.", actionLabel: "Go to login" });
        window.setTimeout(() => {
          navigate("/login");
        }, 1200);
    }catch(error){
      console.error("Error occurred while resetting password:", error);
      setFeedback({ type: "error", title: "We couldn't reset your password", message: error.message || "Please try again or request a new reset link." });
    } finally {
      setIsSubmitting(false);
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

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <p className="back-login">
          Remembered your password? <a href="/login">Login</a>
        </p>
      </div>
      <AuthFeedbackModal
        feedback={feedback}
        onClose={() => {
          setFeedback(null);
          if (feedback?.type === "success") navigate("/login");
        }}
      />
    </div>
  );
}
