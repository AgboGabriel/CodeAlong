import "./UserProfile.css";
import { defaultUser, getUserDisplayName } from "./userData";

function getInitials(name) {
  if (!name) return "U";

  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function UserProfile({ small, onClick, user }) {
  const displayUser = user || defaultUser;
  const displayName = getUserDisplayName(displayUser);
  const initials = getInitials(displayName);
  const avatarSource = displayUser?.avatar_url || displayUser?.avatar || null;

  return (
    <>
      <div className={`avatar ${small ? "avatar-sm" : ""}`} onClick={onClick}>
        {avatarSource ? (
          <img src={avatarSource} alt={displayName} />
        ) : (
          <span className="avatar-initials">{initials}</span>
        )}
      </div>

      {!small && (
        <div className="user-info">
          <div className="user-name">{displayName}</div>
        </div>
      )}
    </>
  );
}