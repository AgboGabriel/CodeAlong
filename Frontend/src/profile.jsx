import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "./assets/Code along_logo-04.png";
import "./profile.css";

export default function Profile() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [profileImage, setProfileImage] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(URL.createObjectURL(file));
    }
  };

  return (
    <div className="profile-page">
      {/* Back button + App Logo */}
      <div className="navbar">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          &larr; Back to Dashboard
        </button>
        <img src={logo} alt="App Logo" className="logo-img" />
      </div>

      {/* Profile Form */}
      <div className="profile-card">
        <h2>My Profile</h2>

        {/* Profile Image Upload */}
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
          <input type="file" accept="image/*" onChange={handleImageChange} />
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
    </div>
  );
}
