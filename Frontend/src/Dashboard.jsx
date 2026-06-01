import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "./assets/Code along_logo-03.png";
import "./Dashboard.css";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import UserProfile, { user } from "./components/UserProfile";

import {
  MdLocalFireDepartment,
  MdVerifiedUser,
  MdPlayCircle,
  MdCode,
} from "react-icons/md";

const fallbackUser = {
  name: "Learner",
  avatar: logo,
};

const NAV_ITEMS = [
  { icon: MdDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: MdMenuBook, label: "My Lessons", path: "/MyLessons" },
  { icon: MdAccountTree, label: "Learning Path", path: "/LearningPath" },
  { icon: MdFolderOpen, label: "Assessments", path: "/Assessments" },
];

const STATS = [
  {
    icon: MdLocalFireDepartment,
    iconClass: "orange",
    label: "Coding Streak",
    value: "0 Days",
    badgeText: "Today",
    badgeClass: "muted",
  },
  {
    icon: MdVerifiedUser,
    iconClass: "purple",
    label: "Badges",
    value: "0",
    badgeText: "Earned",
    badgeClass: "muted",
  },
];

function getDisplayName(currentUser) {
  return currentUser?.username || currentUser?.full_name || currentUser?.email || fallbackUser.name;
}

function getAvatar(currentUser) {
  return currentUser?.avatar_url && currentUser.avatar_url !== "default-avatar.png"
    ? currentUser.avatar_url
    : fallbackUser.avatar;
}

function UserProfile({ currentUser, small, onClick }) {
  const displayName = getDisplayName(currentUser);
  const avatar = getAvatar(currentUser);
  return (
    <>
      <div className={`avatar ${small ? "avatar-sm" : ""}`} onClick={onClick}>
        <img src={avatar} alt={displayName} />
      </div>

      {!small && (
        <div className="user-info">
          <div className="user-name">{displayName}</div>
        </div>
      )}
    </>
  );
}

function Sidebar() {
  const location = useLocation();

  return (
    <div className="lesson-hero recommended-wrapper">


//       <div className="lesson-hero-content">
//         <span className="badge badge-primary">
//           Recommended Videos
//         </span>

//         <h3>Start Learning with Recommended Videos</h3>

function Header({ currentUser }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const displayName = getDisplayName(currentUser);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await fetch("/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    navigate("/");
  };


        <p>
          Curated beginner-friendly YouTube lessons to help you build real coding skills step by step.
        </p>
      </div>

      <div className="video-grid">
        {videos.map((video) => (
          <a
            key={video.videoId}
            className="video-card"
            href={`https://www.youtube.com/watch?v=${video.videoId}`}
            target="_blank"
            rel="noreferrer"
          >
            <div className="user-name">{displayName}</div>
          </div>

          <UserProfile currentUser={currentUser} small onClick={() => setDropdownOpen(!dropdownOpen)} />

          <button className="icon-btn" aria-label="Settings">
            <MdSettings size={30} />
          </button>

            <div className="video-info">
              <h4>{video.title}</h4>
              <p>{video.channel}</p>
            </div>
          </a>
        ))}
      </div>

    </div>
  );
}
function LessonHero() {
  return (
    <div className="lesson-hero">
      <div className="lesson-hero-content">
        <span className="badge badge-primary">Current Lesson</span>

        <h3>Programming Fundamentals</h3>

        <p>
          Master variables, loops, and conditionals to build a strong foundation.
        </p>

        <div className="lesson-hero-actions">
          <button className="btn btn-primary">
            <MdPlayCircle size={20} />
            Resume Learning
          </button>

          <button className="btn btn-secondary">
            View Outline
          </button>
        </div>
      </div>

      <div className="lesson-hero-bg-icon">
        <MdCode size={120} />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, iconClass, label, value, badgeText, badgeClass }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div className={`stat-icon ${iconClass}`}>
          <Icon size={22} />
        </div>

        <span className={`stat-badge ${badgeClass}`}>{badgeText}</span>
      </div>

      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function ProgressSection() {
  return (
    <section>
      <div className="section-header">
        <h3 className="section-title">Statistics</h3>
        <button className="link-btn">Full Analytics</button>
      </div>

      <div className="stats-grid">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
    </section>
  );
}

function CtaBanner() {
  const navigate = useNavigate();

  return (
    <div className="cta-banner">
      <div>
        <h3>Tailor Your Path</h3>
        <p>Interact with AI to create your own learning path.</p>
      </div>

      <button
        className="btn btn-white"
        onClick={() => navigate("/LearningPath")}
      >
        Go to Learning Path
      </button>
    </div>
  );
}

function AssessmentsBanner() {
  const navigate = useNavigate();

  return (
    <div className="cta-banner">
      <div>
        <h3>Challenge of the day</h3>
        <p>Test your skills with daily programming challenges.</p>
      </div>

      <button
        className="btn btn-white"
        onClick={() => navigate("/challenges")}
      >
        Start challenge
      </button>
    </div>
  );
}

/* ---------------- DASHBOARD ---------------- */

function getProgressMessage(user) {
  if (user?.isNew) {
    return "Start your learning journey today. Let’s build momentum.";
  }

  if (!user?.progress) {
    return "You’ve started your learning path. Keep going.";
  }

  if (user.progress < 100) {
    return `You've completed ${user.progress}% of your path. Keep going.`;
  }

  return "You’ve completed your learning path. Great work!";
}

export default function Dashboard() {
  const [hasStartedLearning] = useState(false);

  const greeting = user?.isNew ? "Welcome" : "Welcome back";
function RecommendedLessons(
  {recommendations,
  loading,}) 
  {
   if (loading) {
    return (
      <div className="lesson-hero">
        <h3>Loading recommendations...</h3>
      </div>
    );
  }

  const videos =
    recommendations.flatMap(
      item => item.videos || []
    ); 
  
   if (videos.length === 0) {
    return (
      <div className="lesson-hero">
        <h3>No recommendations found yet.</h3>
      </div>
    );
  }
  
  return (
    <div className="lesson-hero recommended-wrapper">
      
      <div className="lesson-hero-content">
        <span className="badge badge-primary">
          Recommended Videos
        </span>

        <h3>Start Learning with Recommended videos</h3>

        <p>
          Curated beginner-friendly YouTube lessons to help you build real coding skills step by step.
        </p>
      </div>

      {/* VIDEO GRID */}
      <div className="video-grid">
        {videos.map((video, index) => (
          <a
            key={index}
            className="video-card"
            href={video.url}
            target="_blank"
            rel="noreferrer"
          >
            <div className="video-thumbnail">
              <img
                src={video.thumbnail}
                alt={video.title}
              />
            </div>

            <div className="video-info">
              <h4>{video.title}</h4>
               <p>{video.channelTitle}</p>
            </div>
          </a>
        ))}
      </div>

    </div>
  );
}

export default function Dashboard() {
  const [currentUser,setCurrentUser]= useState(null);
  const [hasStartedLearning, setHasStartedLearning] = useState(false);
  const [recommendedVideos, setRecommendedVideos] = useState([]);
const [loadingRecommendations, setLoadingRecommendations] = useState(true);
async function loadRecommendations() {
  try {
    const response = await fetch(
      "/api/dashboard/recommendations",
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch recommendations");
    }

    const data = await response.json();

    console.log(
      "Dashboard recommendations:",
      data
    );

    setRecommendedVideos(
      data.recommendations || []
    );

  } catch (error) {
    console.error(
      "Error loading recommendations:",
      error
    );
  } finally {
    setLoadingRecommendations(false);
  }
}
  useEffect(()=>{
    async function loadCurrentUser(){
      try{
        const response=await fetch("/auth/me",{
          credentials:"include",
  
          });
          if(!response.ok){
            console.log("No user logged in user found");
            return;
          }
          const userData=await response.json();
          console.log("Current user:", userData.user);
          setCurrentUser(userData.user);
        }catch(error){
          console.error("Error fetching current user:", error);
        }
      }
      loadCurrentUser();
      loadRecommendations();

    },[]);
 
  const displayName = getDisplayName(currentUser);
  const greeting = currentUser ? "Welcome back" : "Welcome";
  const progressMessage = hasStartedLearning
    ? "You've started your learning path. Let's keep going."
    : "Start your learning journey today. Let's build momentum.";
  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main">
        <Header currentUser={currentUser} />

        <div className="content">
          <div className="content-inner">

            <div className="welcome">
              <h2>
                {greeting}, {displayName}!
              </h2>



//               <p>{progressMessage}</p>// 
              <p>{getProgressMessage(user)}</p>
            </div>

            <div className="section-stack">
             {/* {hasStartedLearning ? <LessonHero /> : <RecommendedLessons />} */}
              {hasStartedLearning ? (
                  <LessonHero />
                ) : (
                  <RecommendedLessons
                    recommendations={recommendedVideos}
                    loading={loadingRecommendations}
                  />
                )}

              <ProgressSection />
              <CtaBanner />
              <AssessmentsBanner />
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}