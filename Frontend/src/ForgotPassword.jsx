import React, { useState } from "react";
import AuthFeedbackModal from "./Components/AuthFeedbackModal";
import "./ForgotPassword.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setFeedback(null);
    setRequestSent(false);
    setIsSubmitting(true);

    try {
      const response = await fetch("/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setRequestSent(true);
        setFeedback({
          type: "success",
          title: "Check your email",
          message: "If an account exists for this email address, you will find a password-reset link in your inbox shortly. Please also check your spam or junk folder.",
          actionLabel: "Got it",
        });
      } else {
        const requestError = data.error || "Failed to send reset link";
        setFeedback({ type: "error", title: "We couldn't send the reset link", message: requestError });
      }
    } catch (error) {
      console.error("Error occurred while requesting password reset:", error);
      setFeedback({ type: "error", title: "We couldn't reach the server", message: "Please check your internet connection and try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="forgot-page">
      <div className="forgot-container">
        <h1>Forgot Password</h1>
        <p>Enter your valid email and we'll send you a link to reset your password.</p>

        <form className="forgot-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : requestSent ? "Reset link sent" : "Send Reset Link"}
          </button>
        </form>

        {requestSent ? <p className="forgot-message">If an account exists for this email, check your inbox and spam folder for the reset link.</p> : null}

        <p className="back-login">
          Remembered your password? <a href="/login">Go back to Login</a>
        </p>
      </div>
      <AuthFeedbackModal feedback={feedback} onClose={() => setFeedback(null)} />
    </div>
  );
}
