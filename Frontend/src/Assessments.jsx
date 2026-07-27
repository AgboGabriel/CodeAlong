import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Components/Sidebar";
import Header from "./Components/Header";
import "./Assessments.css";

import {
  MdChevronRight,
  MdFilterList,
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
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/auth/me", {
          credentials: "include",
        });

        const data = await response.json();

        if (response.ok && data.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };

    fetchUser();
  }, []);

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main">
        <Header user={user} />

        <div className="content">
          <div className="content-inner">
            {/* Page header */}
            <div className="cap-page-head">
              <div>
                <h1 className="cap-page-title">Assignments</h1>
                <p className="cap-page-subtitle">
                  Track your progress and complete pending labs.
                </p>
              </div>
              <div className="cap-page-actions">
                <button className="cap-btn cap-btn--ghost">
                  <MdFilterList />
                  Filter
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="cap-stats">
              <div className="cap-stat cap-stat--primary">
                <div className="cap-stat__content">
                  <p className="cap-stat__label">Pending</p>
                  <h3 className="cap-stat__value">4</h3>
                </div>
                <MdTimer className="cap-stat__bg-icon" />
              </div>

              <div className="cap-stat">
                <div>
                  <p className="cap-stat__label cap-stat__label--muted">
                    In Review
                  </p>
                  <h3 className="cap-stat__value cap-stat__value--dark">2</h3>
                </div>
                <MdVisibility className="cap-stat__bg-icon cap-stat__bg-icon--light" />
              </div>

              <div className="cap-stat">
                <div>
                  <p className="cap-stat__label cap-stat__label--muted">
                    Completed
                  </p>
                  <h3 className="cap-stat__value cap-stat__value--dark">12</h3>
                </div>
                <MdCheckCircle className="cap-stat__bg-icon cap-stat__bg-icon--light" />
              </div>
            </div>

            {/* Available Assignments */}
            <section className="cap-section">
              <div className="cap-section__head">
                <h2 className="cap-section__title">Available Assignments</h2>
              </div>

              <div className="cap-list">
                <div className="cap-card cap-card--accent">
                  <div className="cap-card__row">
                    <div className="cap-card__lead">
                      <div className="cap-card__icon cap-card__icon--primary">
                        <MdTerminal />
                      </div>
                      <div>
                        <h4 className="cap-card__title">
                          React State Management Lab
                        </h4>
                        <div className="cap-card__meta">
                          <span className="cap-meta-item">
                            <MdFolder />
                            Frontend Development
                          </span>
                          <span className="cap-tag cap-tag--amber">
                            Intermediate
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="cap-card__actions">
                      <button className="cap-btn cap-btn--outline">
                        Start Assignment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Recently Completed */}
            <section className="cap-section cap-section--pad-bottom">
              <div className="cap-section__head cap-section__head--bordered">
                <h2 className="cap-section__title">Recently Completed</h2>
              </div>

              <div className="cap-success-grid">
                <div className="cap-success-card">
                  <div className="cap-success-card__lead">
                    <div className="cap-success-card__check">
                      <MdCheck />
                    </div>
                    <div>
                      <h5 className="cap-success-card__title">
                        Intro to TypeScript
                      </h5>
                      <p className="cap-success-card__meta">
                        Grade: 98/100 • Oct 12
                      </p>
                    </div>
                  </div>
                  <button
                    className="cap-icon-btn cap-icon-btn--ghost"
                    aria-label="Download"
                  >
                    Retake
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}