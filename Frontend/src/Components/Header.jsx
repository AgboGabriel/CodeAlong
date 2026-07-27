import { useState } from "react";
import { MdNotifications, MdSettings, MdChevronRight } from "react-icons/md";
import UserProfile, { user as defaultUser, getUserDisplayName } from "./UserProfile";
import "./Header.css";

const NOTIFICATIONS = [
  {
    id: 1,
    title: "New challenge available",
    message: "Try today's JavaScript challenge.",
    time: "2 mins ago",
  },
  {
    id: 2,
    title: "Lesson reminder",
    message: "Continue your React lesson.",
    time: "1 hour ago",
  },
];

export default function Header({ user, page, previousPage }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const displayUser = user || defaultUser;
  const displayName = getUserDisplayName(displayUser);

  return (
    <header className="header">
      <div className="header-left">
        {page && (
          <nav className="page-breadcrumb">
            <a href="#">{previousPage || "Previous"}</a>
            <MdChevronRight />
            <span className="page-current">{page}</span>
          </nav>
        )}
      </div>

      <div className="header-right">
        {/* Notifications */}
        <div className="notification-wrapper">
          <button
            className="notif-btn"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <MdNotifications size={30} />
            <span className="notif-dot" />
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">Notifications</div>
              {NOTIFICATIONS.map((item) => (
                <div className="notification-item" key={item.id}>
                  <h4>{item.title}</h4>
                  <p>{item.message}</p>
                  <span>{item.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="divider-v" />

        {/* User Section */}
        <div className="header-user">
          <div className="header-user-text">
            <div className="user-name">{displayName}</div>
          </div>

          <UserProfile small user={displayUser} />

          <button className="icon-btn">
            <MdSettings size={30} />
          </button>
        </div>
      </div>
    </header>
  );
}