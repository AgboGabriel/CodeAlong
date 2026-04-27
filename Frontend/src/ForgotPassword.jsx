import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ForgotPassword.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    // For now, skip actual email sending
    alert(`Password reset link sent to ${email}`);
    try{
      const response=await fetch("http://localhost:3000/auth/forgot-password",{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({ email })
      })
      const data= await response.json();
      console.log("Forgot password response:", data);
      if (response.ok) {
      alert(data.message || "If that email exists, a reset link has been sent.");
    } else {
      alert(data.error || "Failed to send reset link");
    }

    }catch(error){
      console.error("Error occurred while requesting password reset:", error);
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

          <button type="submit" className="btn-primary">
            Send Reset Link
          </button>
        </form>

        <p className="back-login">
          Remembered your password? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
}
