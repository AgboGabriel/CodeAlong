import { createElement, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdAssessment,
  MdCheckCircle,
  MdCode,
  MdEmojiEvents,
  MdInsights,
  MdQuiz,
  MdTrendingUp,
} from "react-icons/md";
import Sidebar from "./Components/Sidebar";
import Header from "./Components/Header";
import "./Analytics.css";

const percent = (value) => `${Math.round(Number(value || 0) * 100)}%`;
const scorePercent = (value) => {
  const number = Number(value || 0);
  return `${Math.round(number <= 1 ? number * 100 : number)}%`;
};

function formatDate(value) {
  if (!value) return "Not attempted yet";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function MetricCard({ icon: Icon, label, value, helper, tone }) {
  return (
    <article className="analytics-metric-card">
      <div className={`analytics-metric-icon ${tone}`}>{createElement(Icon, { size: 22 })}</div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{helper}</span>
      </div>
    </article>
  );
}

function EmptyState({ title, description }) {
  return <div className="analytics-empty"><MdInsights size={30} /><h3>{title}</h3><p>{description}</p></div>;
}

export default function Analytics() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState({ topics: [], quizzes: [], challenges: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const response = await fetch("/api/analytics/me", { credentials: "include" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load your analytics.");
        setAnalytics(data);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  const overview = useMemo(() => {
    const total = analytics.topics.length;
    const completed = analytics.topics.filter((topic) => topic.topic_status === "completed").length;
    const attemptedTopics = analytics.topics.filter((topic) => Number(topic.attempts) > 0);
    const averageMastery = attemptedTopics.length
      ? attemptedTopics.reduce((sum, topic) => sum + Number(topic.mastery_probability || 0), 0) / attemptedTopics.length
      : 0;
    const passedQuizzes = analytics.quizzes.filter((quiz) => quiz.passed).length;
    const passedChallenges = analytics.challenges.filter((challenge) => Number(challenge.passed_submission_count) > 0).length;
    return { total, completed, attemptedTopics, averageMastery, passedQuizzes, passedChallenges };
  }, [analytics]);

  const curriculums = useMemo(() => {
    const grouped = new Map();
    analytics.topics.forEach((topic) => {
      const curriculumKey = String(topic.curriculum_id);
      if (!grouped.has(curriculumKey)) {
        grouped.set(curriculumKey, {
          id: topic.curriculum_id,
          title: topic.curriculum_title,
          modules: new Map(),
        });
      }
      const curriculum = grouped.get(curriculumKey);
      const moduleKey = String(topic.module_id);
      if (!curriculum.modules.has(moduleKey)) {
        curriculum.modules.set(moduleKey, { id: topic.module_id, title: topic.module_title, topics: [] });
      }
      curriculum.modules.get(moduleKey).topics.push(topic);
    });
    return [...grouped.values()].map((curriculum) => ({
      ...curriculum,
      modules: [...curriculum.modules.values()],
    }));
  }, [analytics.topics]);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main">
        <Header page="Analytics" previousPage="Dashboard" />
        <div className="content analytics-content">
          <div className="content-inner analytics-inner">
            <section className="analytics-hero">
              <div>
                <span className="analytics-eyebrow"><MdInsights size={16} /> Learning analytics</span>
                <h1>See your progress at a glance.</h1>
                <p>Track topic mastery, assessment outcomes, and challenge performance as you learn.</p>
              </div>
              <button className="analytics-path-button" onClick={() => navigate("/LearningPath")}>Continue learning <MdTrendingUp size={18} /></button>
            </section>

            {loading ? <div className="analytics-loading">Loading your learning data…</div> : error ? (
              <div className="analytics-error">{error}</div>
            ) : (
              <>
                <section className="analytics-metrics" aria-label="Learning summary">
                  <MetricCard icon={MdAssessment} tone="blue" label="Curriculum progress" value={overview.total ? `${overview.completed}/${overview.total}` : "—"} helper={overview.total ? `${Math.round((overview.completed / overview.total) * 100)}% topics completed` : "Create a learning path to begin"} />
                  <MetricCard icon={MdTrendingUp} tone="purple" label="Average mastery" value={overview.attemptedTopics.length ? percent(overview.averageMastery) : "—"} helper={overview.attemptedTopics.length ? `Across ${overview.attemptedTopics.length} attempted topics` : "Complete a quiz to measure mastery"} />
                  <MetricCard icon={MdQuiz} tone="orange" label="Quiz outcomes" value={`${overview.passedQuizzes}/${analytics.quizzes.length}`} helper="Passed assessments" />
                  <MetricCard icon={MdCode} tone="green" label="Challenges solved" value={`${overview.passedChallenges}/${analytics.challenges.length}`} helper="Topics with a passing submission" />
                </section>

                <section className="analytics-panel">
                  <div className="analytics-panel-heading"><div><span>Curriculum</span><h2>Topic mastery & progress</h2></div><p>{overview.total ? `${overview.completed} of ${overview.total} topics complete` : "No learning path yet"}</p></div>
                  {!curriculums.length ? <EmptyState title="Your learning path will appear here" description="Create a personalized curriculum to start tracking topic-level progress." /> : (
                    <div className="analytics-curriculums">
                      {curriculums.map((curriculum) => {
                        const curriculumTopics = curriculum.modules.flatMap((module) => module.topics);
                        const curriculumCompleted = curriculumTopics.filter((topic) => topic.topic_status === "completed").length;
                        return <section className="analytics-curriculum-section" key={curriculum.id}>
                          <div className="analytics-curriculum-header">
                            <div><span>Learning path</span><h3>{curriculum.title}</h3><p>{curriculum.modules.length} module{curriculum.modules.length === 1 ? "" : "s"} · {curriculumTopics.length} topic{curriculumTopics.length === 1 ? "" : "s"}</p></div>
                            <div className="analytics-curriculum-progress"><strong>{curriculumCompleted}/{curriculumTopics.length}</strong><span>topics complete</span></div>
                          </div>
                          <div className="analytics-modules">
                            {curriculum.modules.map((module) => {
                              const completed = module.topics.filter((topic) => topic.topic_status === "completed").length;
                              return <div className="analytics-module" key={module.id}>
                                <div className="analytics-module-header"><div><small>Module</small><h3>{module.title}</h3></div><span>{completed}/{module.topics.length} complete</span></div>
                                <div className="analytics-topic-list">
                                  {module.topics.map((topic) => <div className="analytics-topic" key={topic.topic_id}>
                                    <div className={`analytics-status-dot ${topic.topic_status === "completed" ? "complete" : topic.topic_status === "locked" ? "locked" : "active"}`} />
                                    <div className="analytics-topic-name"><strong>{topic.topic_title}</strong><span>{topic.attempts ? `${topic.attempts} quiz attempt${Number(topic.attempts) === 1 ? "" : "s"}` : "Not assessed"}</span></div>
                                    <div className="analytics-mastery"><div><span>Mastery</span><strong>{percent(topic.mastery_probability)}</strong></div><div className="analytics-progress-track"><i style={{ width: percent(topic.mastery_probability) }} /></div></div>
                                    <span className={`analytics-status-label ${topic.topic_status}`}>{topic.topic_status === "completed" ? "Complete" : topic.topic_status === "locked" ? "Locked" : "In progress"}</span>
                                  </div>)}
                                </div>
                              </div>;
                            })}
                          </div>
                        </section>;
                      })}
                    </div>
                  )}
                </section>

                <div className="analytics-two-column">
                  <section className="analytics-panel">
                    <div className="analytics-panel-heading"><div><span>Assessments</span><h2>Quiz pass/fail history</h2></div><MdQuiz className="analytics-heading-icon" /></div>
                    {!analytics.quizzes.length ? <EmptyState title="No quiz attempts yet" description="Your pretest and posttest results will be shown here." /> : <div className="analytics-history-list">
                      {analytics.quizzes.map((quiz) => <div className="analytics-history-item" key={quiz.id}>
                        <div className={`analytics-result-icon ${quiz.passed ? "pass" : "fail"}`}>{quiz.passed ? <MdCheckCircle size={20} /> : <MdAssessment size={20} />}</div>
                        <div><strong>{quiz.topic_title}</strong><span>{quiz.quiz_type === "pretest" ? "Pretest" : "Posttest"} · {quiz.module_title} · {formatDate(quiz.submitted_at)}</span></div>
                        <div className="analytics-result-score"><strong>{scorePercent(quiz.score)}</strong><span className={quiz.passed ? "pass-text" : "fail-text"}>{quiz.passed ? "Passed" : "Not passed"}</span></div>
                      </div>)}
                    </div>}
                  </section>

                  <section className="analytics-panel">
                    <div className="analytics-panel-heading"><div><span>Practice</span><h2>Challenge progress</h2></div><MdEmojiEvents className="analytics-heading-icon" /></div>
                    {!analytics.challenges.length ? <EmptyState title="No challenges generated yet" description="Topic challenges and your submissions will appear here." /> : <div className="analytics-history-list">
                      {analytics.challenges.map((challenge) => {
                        const passed = Number(challenge.passed_submission_count) > 0;
                        return <div className="analytics-history-item" key={challenge.topic_id}>
                          <div className={`analytics-result-icon ${passed ? "pass" : "neutral"}`}><MdCode size={20} /></div>
                          <div><strong>{challenge.topic_title}</strong><span>{Number(challenge.submission_count) ? `${challenge.submission_count} submission${Number(challenge.submission_count) === 1 ? "" : "s"} · ${formatDate(challenge.last_attempt_at)}` : "Challenge ready to start"}</span></div>
                          <div className="analytics-result-score"><strong>{Number(challenge.submission_count) ? scorePercent(challenge.best_score) : "—"}</strong><span className={passed ? "pass-text" : "neutral-text"}>{passed ? "Solved" : "Pending"}</span></div>
                        </div>;
                      })}
                    </div>}
                  </section>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
