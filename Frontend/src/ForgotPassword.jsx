import React, { useState } from "react";
import AuthFeedbackModal from "./Components/AuthFeedbackModal";
import "./ForgotPassword.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [developmentResetLink, setDevelopmentResetLink] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setFeedback(null);
    setRequestSent(false);
    setDevelopmentResetLink("");
    setIsSubmitting(true);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch("/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setRequestSent(true);
        setDevelopmentResetLink(data.devResetLink || "");
        setFeedback({
          type: "success",
          title: data.devResetLink ? "Development reset link ready" : "Check your email",
          message: data.devResetLink
            ? "Email delivery is not configured in this development environment. Open the reset link below."
            : "If an account exists for this email address, you will find a password-reset link in your inbox shortly. Please also check your spam or junk folder.",
          actionLabel: "Got it",
        });
      } else {
        const requestError = data.error || "Failed to send reset link";
        setFeedback({ type: "error", title: "We couldn't send the reset link", message: requestError });
      }
    } catch (error) {
      console.error("Error occurred while requesting password reset:", error);
      const timedOut = error.name === "AbortError";
      setFeedback({
        type: "error",
        title: timedOut ? "The email request took too long" : "We couldn't reach the server",
        message: timedOut ? "Please try again in a moment. If the problem continues, contact support." : "Please check your internet connection and try again.",
      });
    } finally {
      window.clearTimeout(timeoutId);
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
        {developmentResetLink ? <p className="forgot-message"><a href={developmentResetLink}>Open development reset link</a></p> : null}

        <p className="back-login">
          Remembered your password? <a href="/login">Go back to Login</a>
        </p>
      </div>
      <AuthFeedbackModal feedback={feedback} onClose={() => setFeedback(null)} />
    </div>
  );
}
