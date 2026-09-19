import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Dashboard.css";
import Sidebar from "./Components/Sidebar.jsx";
import Header from "./Components/Header.jsx";
import UserProfile from "./Components/UserProfile.jsx";
import { getUserDisplayName } from "./Components/userData.js";
import { useUser } from "./Components/useUser";
import {
  MdAssessment,
  MdCode,
  MdPlayCircle,
  MdQuiz,
  MdTrendingUp,
} from "react-icons/md";

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

function ProgressCard({ icon, tone, label, value, helper }) {
  const Icon = icon;

  return (
    <article className="progress-card">
      <div className={`progress-icon ${tone}`}><Icon size={22} /></div>
      <div>
        <p className="progress-label">{label}</p>
        <strong className="progress-value">{value}</strong>
        <span className="progress-helper">{helper}</span>
      </div>
    </article>
  );
}

function ProgressSection({ analytics, loading }) {
  const topics = analytics.topics || [];
  const quizzes = analytics.quizzes || [];
  const challenges = analytics.challenges || [];
  const completedTopics = topics.filter((topic) => topic.topic_status === "completed").length;
  const attemptedTopics = topics.filter((topic) => Number(topic.attempts) > 0);
  const averageMastery = attemptedTopics.length
    ? Math.round((attemptedTopics.reduce((sum, topic) => sum + Number(topic.mastery_probability || 0), 0) / attemptedTopics.length) * 100)
    : 0;
  const passedQuizzes = quizzes.filter((quiz) => quiz.passed).length;
  const passedChallenges = challenges.filter((challenge) => Number(challenge.passed_submission_count) > 0).length;
  const summary = [
    { icon: MdAssessment, tone: "blue", label: "Curriculum progress", value: topics.length ? `${completedTopics}/${topics.length}` : "—", helper: topics.length ? `${Math.round((completedTopics / topics.length) * 100)}% topics completed` : "Create a learning path to begin" },
    { icon: MdTrendingUp, tone: "purple", label: "Average mastery", value: attemptedTopics.length ? `${averageMastery}%` : "—", helper: attemptedTopics.length ? `Across ${attemptedTopics.length} attempted topic${attemptedTopics.length === 1 ? "" : "s"}` : "Complete a quiz to measure mastery" },
    { icon: MdQuiz, tone: "orange", label: "Quiz outcomes", value: `${passedQuizzes}/${quizzes.length}`, helper: "Passed assessments" },
    { icon: MdCode, tone: "green", label: "Challenges solved", value: `${passedChallenges}/${challenges.length}`, helper: "Topics with a passing submission" },
  ];

  return (
    <section>
      <div className="section-header">
        <h3 className="section-title">Learning Progress</h3>
        <Link className="link-btn" to="/analytics">Full Analytics</Link>
      </div>

      <div className="progress-summary-grid" aria-busy={loading}>
        {summary.map((metric) => (
          <ProgressCard key={metric.label} {...metric} />
        ))}
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <div className="cta-banner">
      <div>
        <h3>Design Your Own Course</h3>
        <p>Interact our AI assistant to create a step-by-step roadmap for any topic you want to master.</p>
      </div>

      <button className="btn btn-white" onClick={() => window.location.assign("/LearningPath")}>
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
        <h3>Additional Resources</h3>
        <p>Test your understanding on topics you have completed with additional assessments.</p>
      </div>

      <button className="btn btn-white" onClick={() => navigate("/Assessments")}>
       Go to Assessments
      </button>
    </div>
  );
}

function RecommendedLessons({ recommendations, loading, navigate }) {
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

  const handleVideoClick = (video) => {
    navigate("/Videolesson", {
      state: {
        video: {
          videoId: video.videoId,
          video_id: video.videoId,
          title: video.title,
          description: video.description || "",
          channel_title: video.channelTitle || video.channel || "",
          channelTitle: video.channelTitle || video.channel || "",
          thumbnail: video.thumbnail,
          url: video.url,
          duration: video.duration || "",
          view_count: video.viewCount || 0,
          like_count: video.likeCount || 0,
        },
        topic: { title: video.title, id: null },
        moduleId: null,
      },
    });
  };

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
          <div
            key={video.videoId || video.url || index}
            className="video-card"
            onClick={() => handleVideoClick(video)}
            style={{ cursor: "pointer" }}
          >
            <div className="video-thumbnail">
              <img src={video.thumbnail} alt={video.title} />
            </div>

            <div className="video-info">
              <h4>{video.title}</h4>
              <p>{video.channelTitle || video.channel}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user: currentUser } = useUser();
  // /dashboard is always the normal learner experience. Administrators use
  // /admin for the console and may deliberately switch back here.
  return <LearnerDashboard user={currentUser} navigate={navigate} />;
}

function LearnerDashboard({ user, navigate }) {
  const [hasStartedLearning] = useState(false);
  const [recommendedVideos, setRecommendedVideos] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [analytics, setAnalytics] = useState({ topics: [], quizzes: [], challenges: [] });
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  useEffect(() => {
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

    loadRecommendations();
  }, []);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const response = await fetch("/api/analytics/me", { credentials: "include" });
        if (!response.ok) throw new Error("Failed to fetch analytics");
        setAnalytics(await response.json());
      } catch (error) {
        console.error("Error loading analytics:", error);
      } finally {
        setLoadingAnalytics(false);
      }
    }

    loadAnalytics();
  }, []);

  const displayName = getUserDisplayName(user);
  const greeting = user ? "Welcome back" : "Welcome";

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main">
        <Header user={user} page="Dashboard" />

        <div className="content">
          <div className="content-inner">
            <div className="welcome">
              <h2>
                {greeting}, {displayName}!
              </h2>
              <p>{getProgressMessage(user)}</p>
            </div>

            <div className="section-stack">
              {hasStartedLearning ? (
                <LessonHero />
              ) : (
                <RecommendedLessons
                  recommendations={recommendedVideos}
                  loading={loadingRecommendations}
                  navigate={navigate}
                />
              )}

              <ProgressSection analytics={analytics} loading={loadingAnalytics} />
              <CtaBanner />
              <AssessmentsBanner />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
