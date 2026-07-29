import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Components/Sidebar";
import Header from "./Components/Header";
import UserProfile, { user } from "./Components/UserProfile";
import "./Assessments.css";
import Challenges from "./Challenges";
import CompletedAssessments from "./CompletedAssessments";

import {
  MdChevronRight,
  MdFilterList,
  MdSearch,
  MdTimer,
  MdVisibility,
  MdCheckCircle,
  MdTerminal,
  MdFolder,
  MdPlayArrow,
  MdCss,
  MdStorage,
  MdCheck,
} from "react-icons/md";


export default function Assessments() {

      const navigate = useNavigate();

      const [searchTerm, setSearchTerm] = useState("");
      const [filter, setFilter] = useState("All Levels");


      const assessments = [
  {
    id: 1,
    title: "Variables & Data Types",
    course: "Frontend Development with React",
    level: "Intermediate",
  },
];


      const filteredAssessments = assessments.filter((assessment) => {
      const matchesSearch = assessment.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesFilter =
        filter === "All Levels" ||
        assessment.level === filter;

      return matchesSearch && matchesFilter;
    });

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main">
        <Header page="Assessments" />

        <div className="content">
          <div className="content-inner">
            {/* Page header */}
            <div className="ass-page-head">
              <div>
                <h1 className="ass-page-title">Assessments</h1>
                <p className="ass-page-subtitle">
                  Track your progress and complete additional assessments on the lessons you have taken.
                </p>
              </div>
            </div>

            {/* Stats */}
                          <div className="ass-stats">
                <div className="ass-stat ass-stat--available">
                  <div className="ass-stat__content">
                    <p className="ass-stat__label">Available</p>
                    <h3 className="ass-stat__value">1</h3>
                  </div>
                  <MdTimer className="ass-stat__bg-icon" />
                </div>

                <div className="ass-stat ass-stat--review">
                  <div>
                    <p className="ass-stat__label ass-stat__label--muted">
                      In Review
                    </p>
                    <h3 className="ass-stat__value">0</h3>
                  </div>
                  <MdVisibility className="ass-stat__bg-icon" />
                </div>

                <div className="ass-stat ass-stat--completed">
                  <div>
                    <p className="ass-stat__label ass-stat__label--muted">
                      Completed
                    </p>
                    <h3 className="ass-stat__value">2</h3>
                  </div>
                  <MdCheckCircle className="ass-stat__bg-icon" />
                </div>
              </div>

            {/* Upcoming Deliverables */}
            <section className="ass-section">
              <div>
                <h2 className="ass-section__title">Available Assessments</h2>

                <div className="ass-lesson-controls">
                  <div className="ass-lesson-search">
                    <MdSearch className="ass-lesson-search-icon" size={22} />

                    <input
                      type="text"
                      placeholder="Search available assessments..."
                      className="ass-lesson-search-input"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="ass-filter-wrap">
                    <MdFilterList className="ass-filter-icon" size={22} />

                    <select
                      className="ass-lesson-filter"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <option>All Levels</option>
                      <option>Beginner</option>
                      <option>Intermediate</option>
                      <option>Advanced</option>
                    </select>
                  </div>
                </div>

              </div>

              <div className="ass-list">
                  {filteredAssessments.length > 0 ? (
                    filteredAssessments.map((assessment) => (
                      <div className="ass-card ass-card--accent" key={assessment.id}>
                        <div className="ass-card__row">
                          <div className="ass-card__lead">
                            <div className="ass-card__icon ass-card__icon--primary">
                              <MdTerminal />
                            </div>

                            <div>
                              <h4 className="ass-card__title">
                                {assessment.title}
                              </h4>

                              <div className="ass-card__meta">
                                <span className="ass-meta-item">
                                  <MdFolder />
                                  {assessment.course}
                                </span>

                                <span className="ass-tag ass-tag--amber">
                                  {assessment.level}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="ass-card__actions">
                            <button
                              className="ass-btn ass-btn--outline"
                              onClick={() => navigate("/Challenges")}
                            >
                              Start
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="ass-no-results">
                      <MdSearch size={48} className="ass-no-results__icon" />
                      <h3>No results found</h3>
                      <p>Try searching with a different keyword or change the filter.</p>
                    </div>
                  )}
                </div>

            </section>

            {/* Recently Completed */}
            <section className="ass-section ass-section--pad-bottom">
              <div className="ass-section__head ass-section__head--bordered">
                <h2 className="ass-section__title">Recently Completed</h2>
                <p className="ass-link-btn"
                onClick={() => navigate("/CompletedAssessments")}
                >
                  View all</p>
              </div>

              <div className="ass-success-grid">
                <div className="ass-success-card">
                  <div className="ass-success-card__lead">
                    <div className="ass-success-card__check">
                      <MdCheck />
                    </div>
                    <div>
                      <h5 className="ass-success-card__title">
                        Intro to TypeScript
                      </h5>
                      <p className="ass-success-card__meta">
                        Grade: 98/100 • Oct 12
                      </p>
                    </div>
                  </div>
                 <p className="ass-status">Passed</p>
                </div>
              </div>


              <div className="ass-success-grid">
                <div className="ass-success-card ass-success-card--failed">

                  <div className="ass-success-card__lead">

                    <div className="ass-success-card__check">
                      <MdCheck />
                    </div>

                    <div>
                      <h5 className="ass-success-card__title">
                        React State Management
                      </h5>

                      <p className="ass-success-card__meta">
                        Grade: 45/100 • Oct 18
                      </p>
                    </div>

                  </div>


                  <p
                  className="ass-status--failed">
                  Failed
                  </p>

                </div>
              </div>

             
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}