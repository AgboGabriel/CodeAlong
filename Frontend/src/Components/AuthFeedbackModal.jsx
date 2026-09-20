import { useEffect } from "react";
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from "react-icons/fa";
import "./AuthFeedbackModal.css";

const icons = {
  error: FaExclamationCircle,
  success: FaCheckCircle,
  info: FaInfoCircle,
};

export default function AuthFeedbackModal({ feedback, onClose }) {
  useEffect(() => {
    if (!feedback) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [feedback, onClose]);

  if (!feedback) return null;

  const Icon = icons[feedback.type] || FaInfoCircle;

  return (
    <div className="auth-feedback-backdrop" onMouseDown={onClose}>
      <section
        className={`auth-feedback-modal auth-feedback-modal--${feedback.type || "info"}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="auth-feedback-title"
        aria-describedby="auth-feedback-message"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="auth-feedback-close" type="button" onClick={onClose} aria-label="Close message">
          <FaTimes />
        </button>
        <Icon className="auth-feedback-icon" aria-hidden="true" />
        <h2 id="auth-feedback-title">{feedback.title}</h2>
        <p id="auth-feedback-message">{feedback.message}</p>
        <button className="auth-feedback-action" type="button" onClick={onClose} autoFocus>
          {feedback.actionLabel || "Try again"}
        </button>
      </section>
    </div>
  );
}
