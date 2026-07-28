import { useNavigate } from "react-router-dom";
import Sidebar from "./Components/Sidebar";
import Header from "./Components/Header";
import "./CompletedAssessments.css";

import {
  MdCheck,
} from "react-icons/md";


export default function CompletedAssessments() {

  const navigate = useNavigate();

  const completedAssessments = [
  {
    id: 1,
    title: "Intro to TypeScript",
    grade: "98/100",
    date: "Oct 12",
    status: "Passed",
  },
  {
    id: 2,
    title: "React State Management",
    grade: "45/100",
    date: "Oct 18",
    status: "Failed",
  }
];

const handleBack = () => {
  navigate(-1);
};

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main">
        <Header page="Completed Assessments" />

        <div className="content">
          <div className="content-inner">

            <section>

              <div className="completed-cap-section__head">
                <button className="completed-back-btn" onClick={handleBack}>
                    ← Back
                </button>
                <h2 className="cap-completed-section__title">
                  Your Completed Assessments
                </h2>
              </div>


              <div className="cap-completed-grid">

                {completedAssessments.map((assessment) => (
                    <div 
                        className={`cap-completed-card ${
                        assessment.status === "Failed" 
                            ? "cap-completed-card--failed" 
                            : "cap-completed-card--passed"
                        }`}
                        key={assessment.id}
                    >

                        <div className="cap-completed-card__lead">

                        <div className="cap-completed-card__check">
                            <MdCheck />
                        </div>


                        <div>
                            <h5 className="cap-completed-card__title">
                            {assessment.title}
                            </h5>

                            <p className="cap-completed-card__meta">
                            Grade: {assessment.grade} • {assessment.date}
                            </p>

                            <span className="cap-completed-card__status">
                            {assessment.status}
                            </span>

                        </div>

                        </div>


                        <button
                        className="cap-completed-icon-btn"
                        onClick={() => navigate("/Challenges")}
                        >
                        {assessment.status === "Failed" ? "Retry" : "Generate New"}
                        </button>

                    </div>
                    ))}

              </div>

            </section>

          </div>
        </div>
      </main>
    </div>
  );
}