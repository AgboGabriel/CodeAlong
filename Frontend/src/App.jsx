import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./LandingPage";
import Questionnaire from "./Questionnaire";
import Dashboard from "./Dashboard";
import Login from "./Login";
import ForgotPassword from "./ForgotPassword";
import CreateNewPassword from "./CreateNewPassword";
import Challenges from "./challenges";
import Assessments from "./Assessments";
import MyLessons  from "./MyLessons";
import LearningPath  from "./LearningPath";
import Videolesson  from "./Videolesson";
import QuizPage  from "./QuizPage";
import Topics  from "./Topics";
import CompletedAssessments  from "./CompletedAssessments";
import Settings from "./settings";
import Analytics from "./Analytics";
import Admin from "./Admin";
import { useUser } from "./Components/useUser";

function ProtectedRoute({ children }) {
  const { user, loading } = useUser();

  if (loading) {
    return <div className="sett-loading">Loading your profile...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useUser();
  if (loading) return <div className="sett-loading">Loading your profile...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return user.role === "admin" ? children : <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/Questionnaire" element={<Questionnaire />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ForgotPassword />} />
        <Route path="/create-new-password" element={<CreateNewPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="/challenges" element={<Challenges />} />
        <Route path="/Assessments" element={<Assessments />} />
        <Route path="/MyLessons" element={<MyLessons />} />
        <Route path="/LearningPath" element={<LearningPath />} />
        <Route path="/Videolesson" element={<Videolesson />} />
        <Route path="/QuizPage" element={<QuizPage />} />
        <Route path="/Topics" element={<Topics />} />
        <Route path="/CompletedAssessments" element={<CompletedAssessments />} />
        <Route
          path="/Settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
