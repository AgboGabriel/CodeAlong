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
  const [completedTopics, setCompletedTopics] = useState([]);
  const [completedAssessments, setCompletedAssessments] = useState([]);
  const [loadingAssessments, setLoadingAssessments] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatorMessage, setGeneratorMessage] = useState("");
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All Levels");
  const [selectedDifficulty, setSelectedDifficulty] = useState("medium");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");

  const buildAssessmentList = async () => {
    try {
      setLoadingAssessments(true);

      const curriculumResponse = await fetch("/api/curriculum", { credentials: "include" });

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

            // An assessment is learner-initiated. Every completed topic stays
            // selectable, including topics the learner wants to assess again.
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
        setCompletedTopics([]);
        return;
      }

      const availableTopics = completedEntries.map(({ topicId, moduleId, curriculumTitle, moduleTitle, topicTitle }) => ({
        topicId,
        moduleId,
        topicTitle,
        moduleTitle,
        curriculumTitle,
      }));
      setCompletedTopics(availableTopics);
      setSelectedTopicId((current) =>
        availableTopics.some((assessment) => String(assessment.topicId) === String(current))
          ? current
          : String(availableTopics[0]?.topicId || "")
      );
    } catch (error) {
      console.error("Failed to load completed topics:", error);
      setCompletedTopics([]);
    } finally {
      setLoadingAssessments(false);
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const loadCompletedAssessments = async () => {
    try {
      const response = await fetch("/api/assessment/attempts", { credentials: "include" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Failed to load assessment attempts");
      setCompletedAssessments(data.attempts || []);
    } catch (error) {
      console.error("Failed to load completed assessments:", error);
      setCompletedAssessments([]);
    }
  };

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

  const loadGeneratedAssessments = async () => {
    try {
      const response = await fetch("/api/assessment/available", { credentials: "include" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Failed to load available assessments");
      setAssessments((data.assessments || []).map((assessment) => ({
        ...assessment, id: assessment.challenge_id, topicId: assessment.topic_id, moduleId: assessment.module_id,
        topicTitle: assessment.topic_title, moduleTitle: assessment.module_title,
        title: assessment.title || `${assessment.topic_title} practice assessment`,
        course: `${assessment.curriculum_title} • ${assessment.module_title}`,
        level: ({ easy: "Beginner", medium: "Intermediate", hard: "Advanced" })[assessment.difficulty] || "Intermediate",
      })));
    } catch (error) {
      console.error("Failed to load available assessments:", error);
      setAssessments([]);
    }
  };

  const selectedAssessment = completedTopics.find(
    (assessment) => String(assessment.topicId) === String(selectedTopicId)
  );

  const startAssessment = async () => {
    if (!selectedAssessment) return;
    setIsGenerating(true);
    setGeneratorMessage("");
    try {
      const response = await fetch("/api/assessment/challenge", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId: selectedAssessment.topicId, moduleId: selectedAssessment.moduleId, challengeType: "assessment", forceRegenerate: true, difficulty: selectedDifficulty, language: selectedLanguage }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to generate the assessment");
      await loadGeneratedAssessments();
      setGeneratorMessage(`“${data.challenge.title}” is ready in Available Assessments.`);
    } catch (error) {
      setGeneratorMessage(error.message || "Unable to generate the assessment. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

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
    loadGeneratedAssessments();
    loadCompletedAssessments();
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
                  <h3 className="ass-stat__value">{completedAssessments.length}</h3>
                </div>
                <MdCheckCircle className="ass-stat__bg-icon" />
              </div>
            </div>

            {/* Available Assessments */}
            <section className="ass-section">
              <div>
                <h2 className="ass-section__title">Available Assessments</h2>

                <div className="assessment-generator">
                  <div className="assessment-generator__header">
                    <div className="assessment-generator__icon"><MdTerminal /></div>
                    <div>
                      <span className="assessment-generator__eyebrow">Personalized practice</span>
                      <h3>Build a coding assessment</h3>
                      <p>Select a completed lesson and configure the assessment you want to take. It will include runnable test cases and instant feedback.</p>
                    </div>
                  </div>

                  <div className="assessment-generator__fields">
                    <label className="assessment-generator__field assessment-generator__field--topic">
                      <span>Completed topic</span>
                      <select value={selectedTopicId} onChange={(e) => setSelectedTopicId(e.target.value)} aria-label="Completed topic">
                        {completedTopics.length === 0 ? <option value="">No completed topics available</option> : completedTopics.map((assessment) => (
                          <option key={assessment.topicId} value={assessment.topicId}>{assessment.topicTitle} — {assessment.moduleTitle}</option>
                        ))}
                      </select>
                    </label>
                    <label className="assessment-generator__field">
                      <span>Difficulty</span>
                      <select value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)} aria-label="Assessment difficulty">
                        <option value="easy">Beginner</option>
                        <option value="medium">Intermediate</option>
                        <option value="hard">Advanced</option>
                      </select>
                    </label>
                    <label className="assessment-generator__field">
                      <span>Coding language</span>
                      <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} aria-label="Assessment language">
                        <option value="javascript">JavaScript</option><option value="python">Python</option><option value="java">Java</option><option value="cpp">C++</option><option value="c">C</option><option value="csharp">C#</option><option value="go">Go</option><option value="ruby">Ruby</option><option value="rust">Rust</option>
                      </select>
                    </label>
                  </div>

                  <div className="assessment-generator__footer">
                    <p>{generatorMessage || (selectedAssessment ? <><strong>{selectedAssessment.topicTitle}</strong> is ready to assess.</> : "Complete a topic to create your first assessment.")}</p>
                    <button className="ass-btn ass-btn--outline" onClick={startAssessment} disabled={!selectedAssessment || isGenerating}>{isGenerating ? "Generating…" : <>Generate assessment <span aria-hidden="true">→</span></>}</button>
                  </div>
                </div>

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
                    <h3>Loading completed topics...</h3>
                    <p>We are checking which completed topics are eligible for a new assessment.</p>
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
                            onClick={() => navigate("/challenges", { state: {
                              moduleId: assessment.moduleId,
                              challengeType: "assessment",
                              forceRegenerate: false,
                              challengeId: assessment.challenge_id,
                              difficulty: assessment.difficulty,
                              initialLanguage: ({ 63: "javascript", 71: "python", 62: "java", 54: "cpp", 50: "c", 51: "csharp", 60: "go", 72: "ruby", 73: "rust" })[assessment.language_id] || "javascript",
                              topic: { id: assessment.topicId, title: assessment.topicTitle },
                            }})}
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
                        ? "Generate an assessment from a completed topic to see it here."
                        : "Try searching with a different keyword or change the filter."}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Recently Completed */}
            {completedAssessments.length > 0 && (
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
                  {completedAssessments.length ? completedAssessments.slice(0, 3).map((attempt) => (
                    <div className="ass-card" key={attempt.id}>
                      <div className="ass-card__row">
                        <div className="ass-card__lead">
                          <div className="ass-card__icon ass-card__icon--primary"><MdCheck /></div>
                          <div>
                            <h4 className="ass-card__title">{attempt.title || `${attempt.topic_title} practice assessment`}</h4>
                            <div className="ass-card__meta">
                              <span className="ass-meta-item">{attempt.passed ? "Passed" : "Needs retry"}</span>
                              <span className="ass-meta-item">{Math.round(Number(attempt.score || 0) * 100)}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="ass-card__actions">
                          {attempt.passed ? (
                            <span className="ass-tag ass-tag--green">Completed</span>
                          ) : (
                            <button className="ass-btn ass-btn--outline" onClick={() => navigate("/challenges", { state: {
                              moduleId: attempt.module_id,
                              challengeType: "assessment",
                              forceRegenerate: false,
                              challengeId: attempt.challenge_id,
                              difficulty: selectedDifficulty,
                              initialLanguage: ({ 63: "javascript", 71: "python", 62: "java", 54: "cpp", 50: "c", 51: "csharp", 60: "go", 72: "ruby", 73: "rust" })[attempt.language_id] || "javascript",
                              topic: { id: attempt.topic_id, title: attempt.topic_title },
                            } })}>
                              Retry
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="ass-no-results">
                      <MdSearch size={36} className="ass-no-results__icon" />
                      <h3>No completed assessments yet</h3>
                      <p>Once you finish an assessment, it will appear here.</p>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
