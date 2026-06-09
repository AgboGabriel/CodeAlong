import { useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import UserProfile, { user } from "./Components/UserProfile";



import {
  MdCode,
  MdLocalFireDepartment,
  MdPlayCircle,
  MdVerifiedUser,
} from "react-icons/md";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { user as fallbackUser } from "./components/UserProfile";
import "./Dashboard.css";

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
  return (
    currentUser?.username ||
    currentUser?.full_name ||
    currentUser?.name ||
    currentUser?.email ||
    fallbackUser.name
  );
}

function getProgressMessage(currentUser) {
  if (currentUser?.isNew) {
    return "Start your learning journey today. Let's build momentum.";
  }

  if (!currentUser?.progress) {
    return "You've started your learning path. Keep going.";
  }

  if (currentUser.progress < 100) {
    return `You've completed ${currentUser.progress}% of your path. Keep going.`;
  }

  return "You've completed your learning path. Great work!";
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

          <button className="btn btn-secondary">View Outline</button>
        </div>
      </div>

      <div className="lesson-hero-bg-icon">
        <MdCode size={120} />
      </div>
    </div>
  );
}

function StatCard({ icon, iconClass, label, value, badgeText, badgeClass }) {
  const Icon = icon;

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
  return (
    <div className="cta-banner">
      <div>
        <h3>Tailor Your Path</h3>
        <p>Interact with AI to create your own learning path.</p>
      </div>

      <button className="btn btn-white" onClick={() => window.location.assign("/LearningPath")}>
        Go to Learning Path
      </button>
    </div>
  );
}

function AssessmentsBanner() {
  return (
    <div className="cta-banner">
      <div>
        <h3>Challenge of the day</h3>
        <p>Test your skills with daily programming challenges.</p>
      </div>

      <button className="btn btn-white" onClick={() => window.location.assign("/challenges")}>
        Start challenge
      </button>
    </div>
  );
}

function RecommendedLessons({ recommendations, loading }) {
  if (loading) {
    return (
      <div className="lesson-hero">
        <h3>Loading recommendations...</h3>
      </div>
    );
  }

  const videos = recommendations.flatMap((item) => item.videos || []);

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
        <span className="badge badge-primary">Recommended Videos</span>

        <h3>Start Learning with Recommended videos</h3>

        <p>
          Curated beginner-friendly YouTube lessons to help you build real coding
          skills step by step.
        </p>
      </div>

      <div className="video-grid">
        {videos.map((video, index) => (
          <a
            key={video.videoId || video.url || index}
            className="video-card"
            href={video.url || `https://www.youtube.com/watch?v=${video.videoId}`}
            target="_blank"
            rel="noreferrer"
          >
            <div className="video-thumbnail">
              <img src={video.thumbnail} alt={video.title} />
            </div>

            <div className="video-info">
              <h4>{video.title}</h4>
              <p>{video.channelTitle || video.channel}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [hasStartedLearning] = useState(false);
  const [recommendedVideos, setRecommendedVideos] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);

  useEffect(() => {
    async function loadCurrentUser() {
      try {
        const response = await fetch("/auth/me", {
          credentials: "include",
        });

        if (!response.ok) {
          return;
        }

        const userData = await response.json();
        setCurrentUser(userData.user);
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    }

    async function loadRecommendations() {
      try {
        const response = await fetch("/api/dashboard/recommendations", {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch recommendations");
        }

        const data = await response.json();
        setRecommendedVideos(data.recommendations || []);
      } catch (error) {
        console.error("Error loading recommendations:", error);
      } finally {
        setLoadingRecommendations(false);
      }
    }

    loadCurrentUser();
    loadRecommendations();
  }, []);

  const displayName = getDisplayName(currentUser);
  const greeting = currentUser ? "Welcome back" : "Welcome";

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
              <p>{getProgressMessage(currentUser || fallbackUser)}</p>
            </div>

            <div className="section-stack">
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
