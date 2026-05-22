import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import UserProfile, { user } from "./components/UserProfile";
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
