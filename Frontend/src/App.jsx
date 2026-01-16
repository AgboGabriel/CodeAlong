import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./Homepage";
import Dashboard from "./Dashboard";
import SignUp from "./SignUp";
import Login from "./Login";
import ForgotPassword from "./ForgotPassword";
import CreateNewPassword from "./CreateNewPassword";
import Lessons from "./lessons";
import Settings from "./settings";
import Challenges from "./challenges";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/lessons" element={<Lessons />} />
        <Route path="/challenges" element={<Challenges />} />
        <Route path="/profile" element={<Settings />} />
        <Route path="/reset-password" element={<ForgotPassword />} />
        <Route path="/create-new-password" element={<CreateNewPassword />} />
      </Routes>
    </Router>
  );
}

export default App;
