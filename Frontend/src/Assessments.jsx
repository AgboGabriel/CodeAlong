import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Components/Sidebar";
import Header from "./Components/Header";
import "./Assessments.css";

import {
  MdFilterList,
  MdSearch,
  MdTimer,
  MdVisibility,
  MdCheckCircle,
  MdTerminal,
  MdFolder,
  MdCheck,
} from "react-icons/md";

export default function Assessments() {
  const [user, setUser] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loadingAssessments, setLoadingAssessments] = useState(true);
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All Levels");

  const inferAssessmentDifficulty = (topicTitle = "", moduleTitle = "", curriculumTitle = "") => {
    const combinedText = `${topicTitle} ${moduleTitle} ${curriculumTitle}`.toLowerCase();

    const beginnerPatterns = [
      "intro",
      "introduction",
      "beginner",
      "basic",
      "basics",
      "fundamentals",
      "variables",
      "functions",
      "loops",
      "conditionals",
      "arrays",
      "objects",
      "strings",
      "operators",
      "syntax",
      "data types",
      "getting started",
    ];

    const advancedPatterns = [
      "advanced",
      "architecture",
      "performance",
      "security",
      "concurrency",
      "microservices",
      "distributed",
      "optimization",
      "scaling",
      "system design",
      "deployment",
      "refactor",
      "testing",
      "debugging",
      "production",
    ];

    if (beginnerPatterns.some((pattern) => combinedText.includes(pattern))) {
      return { level: "Beginner", rawDifficulty: "easy" };
    }

    if (advancedPatterns.some((pattern) => combinedText.includes(pattern))) {
      return { level: "Advanced", rawDifficulty: "hard" };
    }

    return { level: "Intermediate", rawDifficulty: "medium" };
  };

  const buildAssessmentList = async () => {
    try {
      setLoadingAssessments(true);

      const curriculumResponse = await fetch("/api/curriculum", {
        credentials: "include",
      });

      const curriculumData = await curriculumResponse.json();

      if (!curriculumResponse.ok || !curriculumData.success) {
        throw new Error(curriculumData.error || "Failed to fetch curriculum data");
      }

      const curriculumItems = Array.isArray(curriculumData.curriculum)
        ? curriculumData.curriculum
        : [];

      const completedEntries = [];

      curriculumItems.forEach((curriculum) => {
        const modules = Array.isArray(curriculum.modules) ? curriculum.modules : [];

        modules.forEach((module) => {
          const topics = Array.isArray(module.topics) ? module.topics : [];

          topics.forEach((topic) => {
            const status = String(topic.status || "").toLowerCase();

            if (status === "completed" || status === "complete") {
              completedEntries.push({
                topicId: topic.id,
                moduleId: module.id,
                curriculumTitle: curriculum.title || "Learning Path",
                moduleTitle: module.title || "Module",
                topicTitle: topic.title || "Topic",
              });
            }
          });
        });
      });

      if (completedEntries.length === 0) {
        setAssessments([]);
        return;
      }

      // Assessment content is generated only after the learner clicks Start.
      // This keeps the list fast and avoids unnecessary AI-generation calls.
      setAssessments(
        completedEntries.map(({ topicId, moduleId, curriculumTitle, moduleTitle, topicTitle }) => {
          const { level, rawDifficulty } = inferAssessmentDifficulty(
            topicTitle,
            moduleTitle,
            curriculumTitle
          );

          return {
            id: `assessment-${topicId}`,
            title: `${topicTitle} Assessment`,
            course: `${curriculumTitle} • ${moduleTitle}`,
            level,
            rawDifficulty,
            topicId,
            moduleId,
            topicTitle,
            moduleTitle,
            curriculumTitle,
          };
        })
      );
    } catch (error) {
      console.error("Failed to load generated assessments:", error);
      setAssessments([]);
    } finally {
      setLoadingAssessments(false);
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredAssessments = useMemo(() => {
    return assessments.filter((assessment) => {
      const searchableText = [
        assessment.title,
        assessment.course,
        assessment.level,
        assessment.topicTitle,
        assessment.moduleTitle,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedSearch.length === 0 || searchableText.includes(normalizedSearch);

      const matchesFilter =
        filter === "All Levels" || assessment.level === filter;

      return matchesSearch && matchesFilter;
    });
  }, [assessments, filter, normalizedSearch]);

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
    buildAssessmentList();
  }, []);

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main">
        <Header user={user} page="Assessments" />

        <div className="content">
          <div className="content-inner">
            {/* Page header */}
            <div className="ass-page-head">
              <div>
                <h1 className="ass-page-title">Assessments</h1>
                <p className="ass-page-subtitle">
                  Test your understanding on topics you have completed with additional assessments
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="ass-stats">
              <div className="ass-stat ass-stat--available">
                <div className="ass-stat__content">
                  <p className="ass-stat__label">Available</p>
                  <h3 className="ass-stat__value">
                    {loadingAssessments ? "..." : filteredAssessments.length}
                  </h3>
                </div>
                <MdTimer className="ass-stat__bg-icon" />
              </div>

              

              <div className="ass-stat ass-stat--completed">
                <div>
                  <p className="ass-stat__label ass-stat__label--muted">
                    Completed
                  </p>
                  <h3 className="ass-stat__value">0</h3>
                </div>
                <MdCheckCircle className="ass-stat__bg-icon" />
              </div>
            </div>

            {/* Available Assessments */}
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
                {loadingAssessments ? (
                  <div className="ass-no-results">
                    <MdSearch size={48} className="ass-no-results__icon" />
                    <h3>Loading AI-generated assessments...</h3>
                    <p>We are checking your completed topics and generating challenge-based assessments.</p>
                  </div>
                ) : filteredAssessments.length > 0 ? (
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
                            onClick={() => navigate("/challenges", {
                              state: {
                                moduleId: assessment.moduleId,
                                challengeType: "assessment",
                                topic: {
                                  id: assessment.topicId,
                                  title: assessment.topicTitle,
                                },
                              },
                            })}
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
                    <p>
                      {assessments.length === 0
                        ? "Complete a topic first so we can generate AI assessments for it."
                        : "Try searching with a different keyword or change the filter."}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Recently Completed */}
            {assessments.length > 0 && (
              <section className="ass-section ass-section--pad-bottom">
                <div className="ass-section__head ass-section__head--bordered">
                  <h2 className="ass-section__title">Recently Completed</h2>
                  <p
                    className="ass-link-btn"
                    onClick={() => navigate("/CompletedAssessments")}
                  >
                    View all
                  </p>
                </div>

                <div className="ass-success-grid">
                  <div className="ass-no-results">
                    <MdSearch size={36} className="ass-no-results__icon" />
                    <h3>No completed assessments yet</h3>
                    <p>Once you finish an assessment, it will appear here.</p>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
