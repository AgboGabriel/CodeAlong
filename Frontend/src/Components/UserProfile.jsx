import "./UserProfile.css";

export const user = {
  name: "Alex Rivera",
  avatar:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCHkmMqD5gKaMYLSydOBQc_Zi7wsLqmErMbtpFZ_5-AzR8-GBVVggx2vz3YzNgs5Hoy-od2NIrLSCZxHox3QfDozggMjyXwAkivdXCAnN8X0SPM_4icaBffmPVNgH8o7hrt7pZetO5A34GxGG7-Wo5ffA5JXpfZ9BYdN4-hnrlIM9xG9MtFYNRE-V08HC6Rw_Eeg7AFzzK5lLrWd9H9tOt37FmZS5CIAKG6brXAECIkUSxxGH6SXwrAFI7L8CN5DIz9nBnx5RSp6YE",
  isNew: true,
  progress: 0,
};

// Utility function to generate initials from user name
export const getInitials = (name) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// Utility function to get user display name
export const getUserDisplayName = (currentUser) => {
  return (
    currentUser?.username ||
    currentUser?.full_name ||
    currentUser?.name ||
    currentUser?.email ||
    user.name
  );
};

export default function UserProfile({ small, onClick, user: userData }) {
  const displayUser = userData || user;
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