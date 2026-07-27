import React, { useEffect, useRef, useState } from "react";
import "./ForgotPassword.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [devResetLink, setDevResetLink] = useState("");
  const [popup, setPopup] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const popupTimeoutRef = useRef(null);

  const showPopup = (type, text) => {
    setPopup({ type, text });
    window.clearTimeout(popupTimeoutRef.current);
    popupTimeoutRef.current = window.setTimeout(() => {
      setPopup(null);
    }, 6000);
  };

  useEffect(() => {
    return () => window.clearTimeout(popupTimeoutRef.current);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setErrorMessage("");
    setDevResetLink("");
    setPopup(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await response.json();
      console.log("Forgot password response:", data);

      if (response.ok) {
        const successMessage = data.devReason || data.message || "If that email exists, a reset link has been sent.";
        setMessage(successMessage);
        showPopup(data.devReason ? "warning" : "success", successMessage);
        if (data.devResetLink) {
          setDevResetLink(data.devResetLink);
        }
      } else {
        const requestError = data.error || "Failed to send reset link";
        setErrorMessage(requestError);
        showPopup("error", requestError);
      }
    } catch (error) {
      console.error("Error occurred while requesting password reset:", error);
      const networkError = "Unable to connect to the server";
      setErrorMessage(networkError);
      showPopup("error", networkError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="forgot-page">
      {popup ? (
        <div className={`forgot-popup ${popup.type}`} role="status" aria-live="polite">
          <button type="button" className="forgot-popup-close" onClick={() => setPopup(null)}>
            x
          </button>
          <p>{popup.text}</p>
        </div>
      ) : null}

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

          <button type="submit" className="btn-primary">
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {message ? <p className="forgot-message">{message}</p> : null}
        {errorMessage ? <p className="forgot-error">{errorMessage}</p> : null}
        {devResetLink ? (
          <p className="forgot-message">
            Dev reset link: <a href={devResetLink}>{devResetLink}</a>
          </p>
        ) : null}

        <p className="back-login">
          Remembered your password? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
}
