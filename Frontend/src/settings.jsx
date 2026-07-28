import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Settings.css";

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

    setTimeout(() => {
      setStatus("success");

      if (onConfirm) onConfirm();

      setTimeout(() => setStatus("idle"), 2000);
    }, 800);
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

  const [username, setUsername] = useState("alexc_dev");
  const [fullName, setFullName] = useState("Alex Chen");
  const [email, setEmail] = useState("alex.chen@codealongpro.edu");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileImage, setProfileImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    alert("Please select an image file");
    return;
  }
  const imageURL = URL.createObjectURL(file);
  setProfileImage(imageURL);
};

  const handleRemoveImage = () => {
  setProfileImage(null);
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
                Alex Chen
              </h3>

              <p className="sett-profile-card__role">
                Senior Student
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
              >
                <Icon name="upload" />
                Upload Photo
              </button>

                <button
                  className="sett-btn sett-btn--outline"
                  type="button"
                  onClick={handleRemoveImage}
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