import "./UserProfile.css";

export const user = {
  name: "Alex Rivera",
  avatar:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCHkmMqD5gKaMYLSydOBQc_Zi7wsLqmErMbtpFZ_5-AzR8-GBVVggx2vz3YzNgs5Hoy-od2NIrLSCZxHox3QfDozggMjyXwAkivdXCAnN8X0SPM_4icaBffmPVNgH8o7hrt7pZetO5A34GxGG7-Wo5ffA5JXpfZ9BYdN4-hnrlIM9xG9MtFYNRE-V08HC6Rw_Eeg7AFzzK5lLrWd9H9tOt37FmZS5CIAKG6brXAECIkUSxxGH6SXwrAFI7L8CN5DIz9nBnx5RSp6YE",
  isNew: true,
  progress: 0,
};

export default function UserProfile({ small, onClick }) {
  return (
    <>
      <div className={`avatar ${small ? "avatar-sm" : ""}`} onClick={onClick}>
        <img src={user.avatar} alt={user.name} />
      </div>

      {!small && (
        <div className="user-info">
          <div className="user-name">{user.name}</div>
        </div>
      )}
    </>
  );
}