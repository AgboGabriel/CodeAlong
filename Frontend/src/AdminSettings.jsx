import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "./assets/Code along_logo-04.png";
import "./Adminsettings.css";

export default function AdminSettings() {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("email");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Email form state
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");

  // Password states
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return (
    <div className="profile-page">
      {/* Top Bar */}
      <div className="navbar">
        <button className="back-btn" onClick={() => navigate("/admin-dashboard")}>
          ← Back to Admin Dashboard
        </button>

        {/* Hamburger for small screens */}
        <div
          className={`hamburger ${sidebarOpen ? "open" : ""}`}
          onClick={() => setSidebarOpen(true)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

        <img src={logo} alt="App Logo" className="logo-img" />

        {activeSection && (
          <h1 className="logo-name settings-logo">
            Code<span className="along">Along</span>
          </h1>
        )}
      </div>

      <div className="settings-layout">
        {/* Sidebar */}
        <aside className={`settings-sidebar ${sidebarOpen ? "show" : ""}`}>
          <span className="close-sidebar" onClick={() => setSidebarOpen(false)}>
            ×
          </span>

          <h3>Settings</h3>

          <button
            className={activeSection === "email" ? "active" : ""}
            onClick={() => setActiveSection("email")}
          >
            Change Admin Email
          </button>

          <button
            className={activeSection === "password" ? "active" : ""}
            onClick={() => setActiveSection("password")}
          >
            Change Admin Password
          </button>
        </aside>

        {/* Main Content */}
        <main className="settings-content">
          {/* ================= EMAIL ================= */}
          {activeSection === "email" && (
            <div className="profile-card">
              <h2>Change Email</h2>

              <label>
                Current Email
                <input
                  type="email"
                  placeholder="Enter your current email"
                  value={currentEmail}
                  onChange={(e) => setCurrentEmail(e.target.value)}
                />
              </label>

              <label>
                New Email
                <input
                  type="email"
                  placeholder="Enter your new email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </label>

              <label>
                Confirm New Email
                <input
                  type="email"
                  placeholder="Confirm your new email"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                />
              </label>

              <button
                className="save-btn"
                onClick={() => {
                  if (!currentEmail || !newEmail || !confirmEmail) {
                    alert("Please fill in all fields.");
                    return;
                  }
                  if (newEmail !== confirmEmail) {
                    alert("New emails do not match.");
                    return;
                  }
                  alert("Email updated successfully!");
                  setCurrentEmail("");
                  setNewEmail("");
                  setConfirmEmail("");
                }}
              >
                Save Changes
              </button>
            </div>
          )}

          {/* ================= PASSWORD ================= */}
          {activeSection === "password" && (
            <div className="profile-card">
              <h2>Change Password</h2>

              <label>
                Old Password
                <input
                  type="password"
                  placeholder="Enter your current password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
              </label>

              <label>
                New Password
                <input
                  type="password"
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </label>

              <label>
                Confirm New Password
                <input
                  type="password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </label>

              <button
                className="save-btn"
                onClick={() => {
                  if (!oldPassword || !newPassword || !confirmPassword) {
                    alert("Please fill in all fields.");
                    return;
                  }
                  if (newPassword !== confirmPassword) {
                    alert("New passwords do not match.");
                    return;
                  }
                  alert("Password updated successfully!");
                  setOldPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
              >
                Save Changes
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
