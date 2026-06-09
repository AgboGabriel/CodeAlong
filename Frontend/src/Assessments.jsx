import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Components/Sidebar";
import Header from "./Components/Header";
import UserProfile, { user } from "./Components/UserProfile";
import "./Assessments.css";





export default function Assessments() {
  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main">
        <Header />

        <div className="content">
          <div className="content-inner">
            
          </div>
        </div>
      </main>
    </div>
  );
}
