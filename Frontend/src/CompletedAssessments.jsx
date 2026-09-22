import { useNavigate } from "react-router-dom";
import Sidebar from "./Components/Sidebar";
import Header from "./Components/Header";
import "./CompletedAssessments.css";

import {
  MdCheck,
  MdSearch,
  MdFilterList,
} from "react-icons/md";

import { useEffect, useState } from "react";


export default function CompletedAssessments() {

  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All Assessments");

  const [completedAssessments, setCompletedAssessments] = useState([]);

  useEffect(() => {
    const loadAttempts = async () => {
      try {
        const response = await fetch("/api/assessment/attempts", { credentials: "include" });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Unable to load completed assessments");
        setCompletedAssessments((data.attempts || []).map((attempt) => ({
          ...attempt,
          title: `${attempt.topic_title} Assessment`,
          status: attempt.passed ? "Passed" : "Failed",
          grade: `${Math.round(Number(attempt.score || 0) * 100)}%`,
          date: new Date(attempt.created_at).toLocaleDateString(),
        })));
      } catch (error) {
        console.error("Unable to load completed assessments:", error);
      }
    };
    loadAttempts();
  }, []);

const handleBack = () => {
  navigate(-1);
};


const filteredAssessments = completedAssessments.filter((assessment) => {
  const matchesSearch = assessment.title
    .toLowerCase()
    .includes(searchTerm.toLowerCase());

  const matchesFilter =
    filter === "All Assessments" ||
    assessment.status === filter;

  return matchesSearch && matchesFilter;
});

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main">
        <Header page="Completed Assessments" />

        <div className="content">
          <div className="content-inner">

            <section>

              <div className="cass-section__head">
                <button className="cass-back-btn" onClick={handleBack}>
                    ← Back
                </button>
                <h2 className="cass-section__title">
                  Your Completed Assessments
                </h2>

                <div className="cass-lesson-controls">
                    <div className="cass-lesson-search">
                      <MdSearch className="cass-lesson-search-icon" size={22} />

                      <input
                        type="text"
                        placeholder="Search completed assessments..."
                        className="cass-lesson-search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    <div className="cass-filter-wrap">
                      <MdFilterList className="cass-filter-icon" size={22} />

                      <select
                        className="cass-lesson-filter"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                      >
                        <option>All Assessments</option>
                        <option>Passed</option>
                        <option>Failed</option>
                      </select>
                    </div>
                  </div>
              </div>


              <div className="cass-grid">
                  {filteredAssessments.length > 0 ? (
                    filteredAssessments.map((assessment) => (
                      <div
                        className={`cass-card ${
                          assessment.status === "Failed"
                            ? "cass-card--failed"
                            : "cass-card--passed"
                        }`}
                        key={assessment.id}
                      >
                        <div className="cass-card__lead">
                          <div className="cass-card__check">
                            <MdCheck />
                          </div>

                          <div>
                            <h5 className="cass-card__title">
                              {assessment.title}
                            </h5>

                            <p className="cass-card__meta">
                              Grade: {assessment.grade} • {assessment.date}
                            </p>

                            <span className="cass-card__status">
                              {assessment.status}
                            </span>
                          </div>
                        </div>

                        {assessment.status === "Failed" ? (
                          <button
                            className="cass-icon-btn"
                            onClick={() => navigate("/challenges", { state: {
                              moduleId: assessment.module_id,
                              challengeType: "assessment",
                              forceRegenerate: true,
                              topic: { id: assessment.topic_id, title: assessment.topic_title },
                            } })}
                          >
                            Retry
                          </button>
                        ) : (
                          <span className="cass-card__status">Completed</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="cass-no-results">
                      <MdSearch size={48} className="cass-no-results__icon" />
                      <h3>No results found</h3>
                      <p>Try searching with a different keyword or change the filter.</p>
                    </div>
                  )}
                </div>

            </section>

          </div>
        </div>
      </main>
    </div>
  );
}
