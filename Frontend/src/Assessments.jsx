import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Components/Sidebar";
import Header from "./Components/Header";
import "./Assessments.css";

export default function Assessments() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/auth/me", {
          credentials: "include",
        });

        const data = await response.json();

        if (response.ok && data.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };

    fetchUser();
  }, []);

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main">
        <Header user={user} />

        <div className="content">
          <div className="content-inner">
            
          </div>
        </div>
      </main>
    </div>
  );
}
