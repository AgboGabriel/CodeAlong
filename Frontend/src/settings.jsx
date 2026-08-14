import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { updateCachedUser } from "./Components/useUser";
import "./settings.css";

import {
  FiEdit2,
  FiUser,
  FiLock,
  FiMail,
  FiCheckCircle,
  FiUpload,
  FiTrash2,
} from "react-icons/fi";


function Icon({ name, className = "" }) {

  const icons = {
    edit: <FiEdit2 />,
    person: <FiUser />,
    lock: <FiLock />,
    mail: <FiMail />,
    verified_user: <FiCheckCircle />,
    upload: <FiUpload />,
    delete: <FiTrash2 />,
  };


  return (
    <span className={`sett-icon ${className}`}>
      {icons[name]}
    </span>
  );
}

function ActionButton({ label, variant = "primary", onConfirm, className = "" }) {
  const [status, setStatus] = useState("idle");

  const handleClick = () => {
    if (status !== "idle") return;

    setStatus("loading");

    Promise.resolve(onConfirm?.())
      .then(() => {
        setStatus("success");
        setTimeout(() => setStatus("idle"), 2000);
      })
      .catch(() => {
        // The save handler displays the useful API error; re-enable the button.
        setStatus("idle");
      });
  };


  const text =
    status === "loading"
      ? "Updating..."
      : status === "success"
      ? "Success!"
      : label;


  return (
    <button
      type="button"
      className={`sett-btn sett-btn--${variant} ${
        status === "success" ? "sett-btn--success" : ""
      } ${className}`}
      onClick={handleClick}
      disabled={status !== "idle"}
    >
      {text}
    </button>
  );
}


export default function AccountSettings() {

    const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePath, setProfileImagePath] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const PROFILE_BUCKET = "Profile Image";
  const PROFILE_IMAGE_FOLDER = "Image";

  const loadProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/profile/me", {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate("/login");
          return;
        }
        throw new Error("Unable to read profile");
      }

      const payload = await response.json();
      const profile = payload.user;

      setUsername(profile.username || "");
      setFullName(profile.full_name || "");
      setEmail(profile.email || "");
      setProfileImage(profile.avatar_url || null);
      setProfileImagePath(null);
    } catch (error) {
      console.error("Failed to load profile", error);
    }
  }, [navigate]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const saveProfileToApi = async (payload) => {
    try {
      const response = await fetch("/api/profile/me", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error || "Unable to save profile");
      }

      const updatedPayload = await response.json();
      const updatedUser = updatedPayload.user;

      updateCachedUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error("Profile update failed", error);
      throw error;
    }
  };

  const handleSaveProfile = async () => {
    try {
      await saveProfileToApi({
        username,
        email,
        full_name: fullName,
        avatar_url: profileImage,
      });
    } catch (error) {
      alert(error.message || "Unable to save profile");
      throw error;
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    const extension = file.name.includes(".")
      ? file.name.slice(file.name.lastIndexOf(".") + 1)
      : "jpg";

    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1_000_000)}.${extension}`;
    const storagePath = `${PROFILE_IMAGE_FOLDER}/${uniqueName}`;

    try {
      setIsUploading(true);

      const { error: uploadError } = await supabase.storage
        .from(PROFILE_BUCKET)
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from(PROFILE_BUCKET)
        .getPublicUrl(storagePath);

      const nextPublicUrl = publicUrlData.publicUrl;
      setProfileImage(nextPublicUrl);
      setProfileImagePath(storagePath);

      await saveProfileToApi({
        avatar_url: nextPublicUrl,
        username,
        email,
        full_name: fullName,
      });
    } catch (error) {
      console.error("Supabase profile image upload failed", error);
      alert("Unable to upload the profile image to Supabase Storage.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleRemoveImage = async () => {
    if (profileImagePath) {
      const { error } = await supabase.storage
        .from(PROFILE_BUCKET)
        .remove([profileImagePath]);

      if (error) {
        console.error("Removing profile image failed", error);
      }
    }

    setProfileImage(null);
    setProfileImagePath(null);

    try {
      await saveProfileToApi({
        avatar_url: null,
        username,
        email,
        full_name: fullName,
      });
    } catch (error) {
      alert(error.message || "Unable to remove the profile image");
    }
  };

  const handleBack = () => {
  navigate(-1);
};

  return (
    <div className="sett-settings-page">

      <div className="sett-page-container">


        <div className="sett-page-header">
            <button className="sett-back-btn " onClick={handleBack}>
                    ← Back
                </button>

        </div>


        <div className="sett-bento-grid">


          <section className="sett-card sett-profile-card">

            <div className="sett-avatar-lg-wrap">

              <div className="sett-avatar-lg">

                {profileImage ? (

                  <img
                    src={profileImage}
                    alt="Profile"
                  />

                ) : (

                  <div className="sett-default-avatar">
                    <FiUser />
                  </div>

                )}

                  <button
                    className="sett-avatar-edit-btn"
                    type="button"
                    aria-label="Edit profile picture"
                    onClick={() => fileInputRef.current.click()}
                  >
                    <Icon name="edit" />
                  </button>

              </div>


          

            </div>


            <div>
              <h3 className="sett-profile-card__name">
                {fullName || username || "Your Profile"}
              </h3>

              <p className="sett-profile-card__role">
                {username || "Student"}
              </p>
            </div>


            <div className="sett-profile-card__actions">

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleImageUpload}
                  />

                  <button
                className="sett-btn sett-btn--primary"
                type="button"
                onClick={() => fileInputRef.current.click()}
                disabled={isUploading}
              >
                <Icon name="upload" />
                {isUploading ? "Uploading..." : "Upload Photo"}
              </button>

                <button
                  className="sett-btn sett-btn--outline"
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={isUploading}
                >
                  <Icon name="delete" />
                  Remove
                </button>

            </div>


          </section>




          <section className="sett-card sett-details-card">


            <div className="sett-section-heading">

              <div className="sett-section-heading__icon">
                <Icon name="person" />
              </div>

              <h3>Personal Details</h3>

            </div>



            <form
              className="sett-form"
              onSubmit={(e)=>e.preventDefault()}
            >


              <div className="sett-form-row">


                <div className="sett-field">

                  <label htmlFor="username">
                    Username
                  </label>

                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e)=>setUsername(e.target.value)}
                  />

                </div>



                <div className="sett-field">

                  <label htmlFor="fullName">
                    Full Name
                  </label>

                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e)=>setFullName(e.target.value)}
                  />

                </div>


              </div>



              <div className="sett-field">

                <label htmlFor="email">
                  Email Address
                </label>


                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e)=>setEmail(e.target.value)}
                />


              </div>



              <div className="sett-form-actions">

                <ActionButton
                  label="Save Changes"
                  variant="primary"
                  onConfirm={handleSaveProfile}
                />

              </div>


            </form>


          </section>


        </div>





        <section className="sett-card sett-security-section">


          <div className="sett-section-heading">

            <div className="sett-section-heading__icon">
              <Icon name="lock" />
            </div>

            <h3>
              Security &amp; Password
            </h3>

          </div>



          <div className="sett-security-grid">


            <div className="sett-security-info">


              <div className="sett-info-box">

                <p>
                  Keeping your account secure is our priority.
                  Ensure your password is at least 10 characters
                  long and contains a mix of numbers and symbols.
                </p>

              </div>



            </div>





            <div className="sett-security-form-col">


              <form
                className="sett-form"
                onSubmit={(e)=>e.preventDefault()}
              >


             <div className="sett-form-row">


                  <div className="sett-field">

                    <label htmlFor="currentPassword">
                      Current Password
                    </label>

                    <input
                      id="currentPassword"
                      type="password"
                      placeholder="••••••••••••"
                      value={currentPassword}
                      onChange={(e)=>setCurrentPassword(e.target.value)}
                    />

                  </div>



                  <div className="sett-field">

                    <label htmlFor="newPassword">
                      New Password
                    </label>

                    <input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••••••"
                      value={newPassword}
                      onChange={(e)=>setNewPassword(e.target.value)}
                    />

                  </div>


                </div>



                <div className="sett-form-row">


                  <div className="sett-field">

                    <label htmlFor="confirmPassword">
                      Confirm New Password
                    </label>

                    <input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••••••"
                      value={confirmPassword}
                      onChange={(e)=>setConfirmPassword(e.target.value)}
                    />

                  </div>



                  <div className="sett-form-actions">

                    <ActionButton
                      label="Update Password"
                      variant="primary"
                    />

                  </div>


                </div>


              </form>


            </div>


          </div>


        </section>



      </div>

    </div>
  );
}
