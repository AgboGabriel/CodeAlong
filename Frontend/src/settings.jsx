import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "./assets/Code along_logo-04.png";
import "./settings.css";

export default function Profile() {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Profile states
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [profileImage, setProfileImage] = useState(null);

  // Notifications states
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState("");

  // Password states
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setProfileImage(URL.createObjectURL(file));
  };

  return (
    <div className="profile-page">
      {/* Top Bar */}
      <div className="navbar">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
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

          {/* Centered logo name only on settings page and large screens */}
  {activeSection && (
    <h1 className="logo-name settings-logo">Code<span className="along">Along</span></h1>
  )}
      </div>

      <div className="settings-layout">
        {/* Sidebar */}
        <aside className={`settings-sidebar ${sidebarOpen ? "show" : ""}`}>
          {/* Close button only on small screens */}
          <span className="close-sidebar" onClick={() => setSidebarOpen(false)}>
            ×
          </span>

          <h3>Settings</h3>

          <button
            className={activeSection === "profile" ? "active" : ""}
            onClick={() => setActiveSection("profile")}
          >
            Edit Profile
          </button>

          <button
            className={activeSection === "notifications" ? "active" : ""}
            onClick={() => setActiveSection("notifications")}
          >
            Notifications
          </button>

          <button
            className={activeSection === "password" ? "active" : ""}
            onClick={() => setActiveSection("password")}
          >
            Change Password
          </button>
        </aside>

        {/* Main Content */}
        <main className="settings-content">
          {/* ================= PROFILE ================= */}
          {activeSection === "profile" && (
            <div className="profile-card">
              <h2>My Profile</h2>

              <label className="upload-label">
                {profileImage ? (
                  <>
                    <img
                      src={profileImage}
                      alt="Profile Preview"
                      className="profile-preview"
                    />
                    <span>Click to change profile image</span>
                  </>
                ) : (
                  <span>Click to upload profile image</span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>

              <label>
                Name
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>

              <label>
                Bio
                <textarea
                  placeholder="Tell us about yourself"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </label>

              <label>
                Pronouns
                <select
                  value={pronouns}
                  onChange={(e) => setPronouns(e.target.value)}
                >
                  <option value="">Select your pronouns</option>
                  <option value="she/her">She/Her</option>
                  <option value="he/him">He/Him</option>
                  <option value="they/them">They/Them</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <button className="save-btn">Save Changes</button>
            </div>
          )}

          {/* ================= NOTIFICATIONS ================= */}
          {activeSection === "notifications" && (
            <div className="profile-card">
              <h2>Notifications</h2>

              <p
                style={{
                  color: "#cbd5e1",
                  fontSize: "0.95rem",
                  marginBottom: "16px",
                }}
              >
                Turn on email notifications to receive alerts whenever new
                courses are uploaded by the admin. You can also specify the
                email address where you'd like to receive these notifications.
              </p>

              {/* Toggle switch */}
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                />
                <span className={`slider ${emailNotifications ? "on" : "off"}`}></span>
                <span className="switch-label">Enable Email Notifications</span>
              </label>

              {/* Email input and save button appear only if toggle is on */}
              {emailNotifications && (
                <>
                  <label>
                    Notification Email
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={notificationEmail}
                      onChange={(e) => setNotificationEmail(e.target.value)}
                    />
                  </label>

                  <button
                    className="save-btn"
                    onClick={() => {
                      alert(
                        `Email Notifications: ON\nEmail: ${notificationEmail}`
                      );
                    }}
                  >
                    Save Notification Settings
                  </button>
                </>
              )}
            </div>
          )}

          {/* ================= PASSWORD ================= */}
          {activeSection === "password" && (
            <div className="profile-card">
              <h2>Change Password</h2>

              <p
                style={{
                  color: "#cbd5e1",
                  fontSize: "0.95rem",
                  marginBottom: "16px",
                }}
              >
                Use this form to update your account password. Make sure your
                new password is strong and secure.
              </p>

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
