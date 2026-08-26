import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Admin.css";

const navItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "channels", label: "Channels" },
  { id: "content", label: "Content Review" },
  { id: "curriculum", label: "Curriculum & Assessments" },
  { id: "users", label: "Users" },
];

const initialChannels = [
  {
    id: "ch-001",
    name: "Practical Data Engineering",
    source: "YouTube",
    topic: "Data",
    status: "active",
    lastSynced: "Aug 21, 2026",
    serveRate: "92%",
    owner: "Learning Ops",
    notes: "Strong walkthroughs with current Python tooling.",
  },
  {
    id: "ch-002",
    name: "Frontend Field Notes",
    source: "YouTube",
    topic: "Web",
    status: "active",
    lastSynced: "Aug 20, 2026",
    serveRate: "87%",
    owner: "Curriculum",
    notes: "Useful for React, accessibility, and UI systems.",
  },
  {
    id: "ch-003",
    name: "Legacy Certification Hub",
    source: "YouTube",
    topic: "Cloud",
    status: "disabled",
    lastSynced: "Jul 29, 2026",
    serveRate: "0%",
    owner: "Admin",
    notes: "Disabled pending a source-quality review.",
  },
];

const initialServedVideos = [
  {
    id: "vid-101",
    title: "SQL Window Functions in Real Analytics Work",
    channel: "Practical Data Engineering",
    topic: "Data",
    status: "served",
    source: "YouTube",
    served: 384,
    flaggedReason: "",
  },
  {
    id: "vid-102",
    title: "Designing Form States That Users Understand",
    channel: "Frontend Field Notes",
    topic: "Web",
    status: "served",
    source: "YouTube",
    served: 219,
    flaggedReason: "",
  },
  {
    id: "vid-103",
    title: "Cloud Networking Crash Course",
    channel: "Legacy Certification Hub",
    topic: "Cloud",
    status: "flagged",
    source: "YouTube",
    served: 18,
    flaggedReason: "Outdated console UI in lesson body.",
  },
];

const initialCurricula = [
  {
    id: "cur-201",
    title: "Backend Developer Foundations",
    careerPath: "Backend Developer",
    level: "Beginner",
    status: "ready",
    lessons: 18,
    updatedAt: "Aug 22, 2026",
    generatedBy: "AI curriculum generator",
    instructions:
      "Review the generated learning path for sequencing, practical fit, and assessment coverage before release.",
    starterCode: `export async function getUserProfile(userId) {
  return {
    id: userId,
    role: "learner",
    skillLevel: "beginner",
  };
}`,
    testCases: [
      "Returns a learner role for a new user profile.",
      "Preserves the requested user id in the normalized object.",
      "Handles missing skill-level metadata with a beginner default.",
    ],
  },
  {
    id: "cur-202",
    title: "Data Analyst Interview Track",
    careerPath: "Data Analyst",
    level: "Intermediate",
    status: "flagged",
    lessons: 14,
    updatedAt: "Aug 19, 2026",
    generatedBy: "AI curriculum generator",
    instructions:
      "Check SQL practice coverage and ensure statistics content is not repeated across modules.",
    starterCode: `WITH weekly_signups AS (
  SELECT date_trunc('week', created_at) AS week, count(*) AS users
  FROM users
  GROUP BY 1
)
SELECT week, users
FROM weekly_signups
ORDER BY week DESC;`,
    testCases: [
      "Groups signups by week instead of by day.",
      "Orders the newest weekly cohorts first.",
      "Keeps query readable for learner debugging.",
    ],
  },
];

const initialAssessments = [
  {
    id: "asm-301",
    title: "React State Management Check",
    careerPath: "Frontend Developer",
    level: "Intermediate",
    status: "ready",
    lessons: 6,
    updatedAt: "Aug 21, 2026",
    generatedBy: "AI assessment generator",
    instructions:
      "Verify that the prompt tests state updates, derived UI, and accessible feedback without requiring backend access.",
    starterCode: `function ProgressToggle({ complete, onChange }) {
  return (
    <button aria-pressed={complete} onClick={() => onChange(!complete)}>
      {complete ? "Complete" : "Mark complete"}
    </button>
  );
}`,
    testCases: [
      "Button exposes aria-pressed for assistive technology.",
      "Clicking toggles completion through the provided callback.",
      "Label changes when the complete state changes.",
    ],
  },
  {
    id: "asm-302",
    title: "Python API Client Exercise",
    careerPath: "Backend Developer",
    level: "Advanced",
    status: "regenerating",
    lessons: 4,
    updatedAt: "Queued just now",
    generatedBy: "AI assessment generator",
    instructions:
      "Confirm that the task asks for retry handling and response validation, not private credential setup.",
    starterCode: `async def fetch_lesson(client, lesson_id):
    response = await client.get(f"/lessons/{lesson_id}")
    response.raise_for_status()
    return response.json()`,
    testCases: [
      "Raises for failed HTTP responses.",
      "Returns parsed JSON for a successful response.",
      "Keeps credentials outside the exercise starter.",
    ],
  },
];

const initialUsers = [
  {
    id: "usr-401",
    name: "Maya Chen",
    email: "maya.chen@example.com",
    role: "learner",
    careerPath: "Data Analyst",
    skillLevel: "Intermediate",
    signupDate: "Aug 02, 2026",
    status: "active",
    progress: "72%",
  },
  {
    id: "usr-402",
    name: "Owen Brooks",
    email: "owen.brooks@example.com",
    role: "admin",
    careerPath: "Frontend Developer",
    skillLevel: "Advanced",
    signupDate: "Jul 16, 2026",
    status: "active",
    progress: "88%",
  },
  {
    id: "usr-403",
    name: "Nadia Price",
    email: "nadia.price@example.com",
    role: "learner",
    careerPath: "Backend Developer",
    skillLevel: "Beginner",
    signupDate: "Jun 30, 2026",
    status: "inactive",
    progress: "24%",
  },
];

const initialFilters = {
  channels: { query: "", status: "all", topic: "all" },
  content: { query: "", status: "all", source: "all" },
  curriculum: { query: "", status: "all", type: "all" },
  users: { query: "", role: "all", status: "all" },
};

function normalizeStatus(status) {
  return String(status || "").toLowerCase().replace(/\s+/g, "-");
}

function StatusBadge({ status }) {
  return (
    <span className={`admin-status admin-status--${normalizeStatus(status)}`}>
      {status}
    </span>
  );
}

function SearchFilterBar({ section, filters, values, onChange, actions }) {
  return (
    <div className="admin-toolbar">
      <div className="admin-filters">
        {filters.map((filter) => (
          <label
            className={`admin-field ${filter.type === "search" ? "admin-field--search" : ""}`}
            key={filter.key}
          >
            <span>{filter.label}</span>
            {filter.type === "search" ? (
              <input
                type="search"
                value={values[filter.key]}
                placeholder={filter.placeholder}
                onChange={(event) => onChange(section, filter.key, event.target.value)}
              />
            ) : (
              <select
                value={values[filter.key]}
                onChange={(event) => onChange(section, filter.key, event.target.value)}
              >
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </label>
        ))}
      </div>
      {actions ? <div className="admin-button-row">{actions}</div> : null}
    </div>
  );
}

function AdminTable({ columns, rows, actions = [] }) {
  if (!rows.length) {
    return <div className="admin-empty">No matching records.</div>;
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.label}>{column.label}</th>
            ))}
            {actions.length ? <th>Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => (
                <td key={column.label}>{column.render(row)}</td>
              ))}
              {actions.length ? (
                <td>
                  <div className="admin-button-row">
                    {actions
                      .filter((action) => !action.hidden?.(row))
                      .map((action) => {
                        const label =
                          typeof action.label === "function" ? action.label(row) : action.label;
                        const danger =
                          typeof action.danger === "function"
                            ? action.danger(row)
                            : action.danger;

                        return (
                          <button
                            className={`admin-action ${danger ? "admin-action--danger" : ""}`}
                            key={action.id}
                            type="button"
                            onClick={() => action.onClick(row)}
                          >
                            {label}
                          </button>
                        );
                      })}
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ConfirmModal({ title, body, confirmLabel, danger = true, onConfirm, onClose }) {
  return (
    <div className="admin-modal-backdrop" onMouseDown={onClose}>
      <section
        aria-labelledby="confirm-title"
        aria-modal="true"
        className="admin-modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="admin-modal-header">
          <h2 id="confirm-title">{title}</h2>
          <button aria-label="Close" className="admin-modal-close" type="button" onClick={onClose}>
            x
          </button>
        </header>
        <div className="admin-modal-body">
          <p>{body}</p>
        </div>
        <footer className="admin-modal-footer">
          <button className="admin-secondary-button" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className={danger ? "admin-danger-button" : "admin-primary-button"}
            type="button"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </footer>
      </section>
    </div>
  );
}

function FormModal({ title, fields, submitLabel, onSubmit, onClose }) {
  return (
    <div className="admin-modal-backdrop" onMouseDown={onClose}>
      <section
        aria-labelledby="form-title"
        aria-modal="true"
        className="admin-modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="admin-modal-header">
          <h2 id="form-title">{title}</h2>
          <button aria-label="Close" className="admin-modal-close" type="button" onClick={onClose}>
            x
          </button>
        </header>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(Object.fromEntries(new FormData(event.currentTarget).entries()));
          }}
        >
          <div className="admin-modal-body">
            <div className="admin-form-grid">
              {fields.map((field) => (
                <label
                  className={`admin-field ${field.type === "textarea" ? "admin-field--full" : ""}`}
                  key={field.name}
                >
                  <span>{field.label}</span>
                  {field.type === "select" ? (
                    <select name={field.name} defaultValue={field.value} required={field.required}>
                      {field.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea name={field.name} defaultValue={field.value} required={field.required} />
                  ) : (
                    <input
                      name={field.name}
                      defaultValue={field.value}
                      required={field.required}
                      type={field.type || "text"}
                    />
                  )}
                </label>
              ))}
            </div>
          </div>
          <footer className="admin-modal-footer">
            <button className="admin-secondary-button" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="admin-primary-button" type="submit">
              {submitLabel}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function PreviewModal({ item, onClose }) {
  return (
    <div className="admin-modal-backdrop" onMouseDown={onClose}>
      <section
        aria-labelledby="preview-title"
        aria-modal="true"
        className="admin-modal admin-modal--large"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="admin-modal-header">
          <div>
            <p className="admin-eyebrow">
              {item.careerPath} / {item.level}
            </p>
            <h2 id="preview-title">{item.title}</h2>
          </div>
          <button aria-label="Close" className="admin-modal-close" type="button" onClick={onClose}>
            x
          </button>
        </header>
        <div className="admin-modal-body">
          <div className="admin-preview-grid">
            <section className="admin-preview-block">
              <h3>Instructions</h3>
              <p>{item.instructions}</p>
            </section>
            <section className="admin-preview-block">
              <h3>Starter Code</h3>
              <pre>
                <code>{item.starterCode}</code>
              </pre>
            </section>
            <section className="admin-preview-block">
              <h3>Test Cases</h3>
              <ul>
                {item.testCases.map((testCase) => (
                  <li key={testCase}>{testCase}</li>
                ))}
              </ul>
            </section>
          </div>
        </div>
        <footer className="admin-modal-footer">
          <button className="admin-secondary-button" type="button" onClick={onClose}>
            Close
          </button>
        </footer>
      </section>
    </div>
  );
}

function DetailsModal({ title, children, onClose }) {
  return (
    <div className="admin-modal-backdrop" onMouseDown={onClose}>
      <section
        aria-labelledby="details-title"
        aria-modal="true"
        className="admin-modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="admin-modal-header">
          <h2 id="details-title">{title}</h2>
          <button aria-label="Close" className="admin-modal-close" type="button" onClick={onClose}>
            x
          </button>
        </header>
        <div className="admin-modal-body">{children}</div>
        <footer className="admin-modal-footer">
          <button className="admin-secondary-button" type="button" onClick={onClose}>
            Close
          </button>
        </footer>
      </section>
    </div>
  );
}

function Metric({ label, value, note }) {
  return (
    <section className="admin-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{note}</p>
    </section>
  );
}

function PrimaryCell({ title, subtitle }) {
  return (
    <div className="admin-primary-cell">
      <strong>{title}</strong>
      <span>{subtitle}</span>
    </div>
  );
}

function DetailList({ rows }) {
  return (
    <dl className="admin-detail-list">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function matchesQuery(row, query, keys) {
  if (!query) return true;
  const needle = query.toLowerCase();
  return keys.some((key) => String(row[key] || "").toLowerCase().includes(needle));
}

export default function Admin() {
  const navigate = useNavigate();
  const [section, setSection] = useState("channels");
  const [channels, setChannels] = useState(initialChannels);
  const [servedVideos, setServedVideos] = useState(initialServedVideos);
  const [curricula, setCurricula] = useState(initialCurricula);
  const [assessments, setAssessments] = useState(initialAssessments);
  const [users, setUsers] = useState(initialUsers);
  const [selectedItem, setSelectedItem] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [filters, setFilters] = useState(initialFilters);
  const [activeContentTab, setActiveContentTab] = useState("served");
  const [activeCurriculumTab, setActiveCurriculumTab] = useState("curricula");
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");

  async function adminRequest(path, options = {}) {
    const response = await fetch(`/api/admin${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error?.message || "Admin request failed");
    return payload;
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [channelResult, videoResult, curriculumResult, challengeResult, quizResult, userResult] = await Promise.all([
          adminRequest("/channels"), adminRequest("/content/videos"), adminRequest("/curricula"),
          adminRequest("/assessments?type=challenge"), adminRequest("/assessments?type=quiz"), adminRequest("/users"),
        ]);
        if (cancelled) return;
        setChannels(channelResult.data.map((row) => ({ id: row.id, name: row.channel_name, status: row.status, source: "YouTube", topic: "All", owner: "Admin", trustScore: row.trust_score, youtubeChannelId: row.youtube_channel_id, lastSynced: row.updated_at ? new Date(row.updated_at).toLocaleDateString() : "—", serveRate: `${row.trust_score}%` })));
        setServedVideos(videoResult.data.map((row) => ({ id: row.video_id, title: row.title, channel: row.channel_title, topic: row.topic_titles?.join(", ") || "—", source: "YouTube", served: row.times_recommended, status: "served", flaggedReason: "" })));
        setCurricula(curriculumResult.data.map((row) => ({ id: row.id, title: row.title || "Untitled curriculum", careerPath: row.username, level: "—", status: row.status === "active" ? "ready" : row.status, lessons: row.topic_count, updatedAt: new Date(row.updated_at).toLocaleDateString(), generatedBy: row.username })));
        setAssessments([...challengeResult.data.map((row) => ({ id: row.id, assessmentType: "challenge", title: row.title, careerPath: row.topic_title, level: row.difficulty, status: row.review_status, lessons: 1, updatedAt: new Date(row.created_at).toLocaleDateString(), generatedBy: row.username })), ...quizResult.data.map((row) => ({ id: row.id, assessmentType: "quiz", title: `${row.quiz_type} quiz: ${row.topic_title}`, careerPath: row.topic_title, level: "—", status: row.review_status, lessons: 1, updatedAt: new Date(row.created_at).toLocaleDateString(), generatedBy: row.username }))]);
        setUsers(userResult.data.map((row) => ({ id: row.id, name: row.full_name || row.username, email: row.email, role: row.role, careerPath: row.career_path || "—", skillLevel: row.skill_level || "—", signupDate: new Date(row.created_at).toLocaleDateString(), status: row.is_active ? "active" : "inactive", progress: `${row.curriculum_count} curricula` })));
      } catch (error) {
        if (!cancelled) {
          setToast(error.message);
          window.setTimeout(() => setToast(""), 2200);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function updateFilter(filterSection, key, value) {
    setFilters((current) => ({
      ...current,
      [filterSection]: { ...current[filterSection], [key]: value },
    }));
  }

  function flashToast(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }

  function closeModal() {
    setModal(null);
    setSelectedItem(null);
    setPreviewModalOpen(false);
  }

  function openChannelForm(channel = null) {
    setSelectedItem(channel);
    setModal({
      type: "form",
      title: channel ? "Edit Channel" : "Add Channel",
      submitLabel: channel ? "Save changes" : "Add channel",
      onSubmit: async (values) => {
        try {
          const saved = await adminRequest(channel ? `/channels/${channel.id}` : "/channels", {
            method: channel ? "PATCH" : "POST",
            body: JSON.stringify(channel ? { channel_name: values.name, trust_score: Number(values.trustScore), status: values.status } : { channel_name: values.name, youtube_channel_id: values.youtubeChannelId || null, trust_score: Number(values.trustScore) }),
          });
          const mapped = { id: saved.id, name: saved.channel_name, status: saved.status, source: "YouTube", topic: "All", owner: "Admin", trustScore: saved.trust_score, youtubeChannelId: saved.youtube_channel_id, lastSynced: "Just now", serveRate: `${saved.trust_score}%` };
          setChannels((current) => channel ? current.map((item) => item.id === channel.id ? mapped : item) : [mapped, ...current]);
          closeModal();
          flashToast(`${mapped.name} saved.`);
        } catch (error) { flashToast(error.message); }
      },
      fields: [
        { name: "name", label: "Channel Name", value: channel?.name || "", required: true },
        { name: "youtubeChannelId", label: "YouTube Channel ID", value: channel?.youtubeChannelId || "" },
        { name: "trustScore", label: "Trust score (0-100)", type: "number", value: channel?.trustScore ?? 100, required: true },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: ["active", "disabled"],
          value: channel?.status || "active",
        },
      ],
    });
  }

  function confirmChannelStatus(channel) {
    const nextStatus = channel.status === "active" ? "disabled" : "active";
    setModal({
      type: "confirm",
      title: `${nextStatus === "disabled" ? "Disable" : "Enable"} ${channel.name}`,
      body:
        nextStatus === "disabled"
          ? "This prevents the channel from being used for future served content until it is enabled again."
          : "This makes the channel available for normal serving again.",
      confirmLabel: nextStatus === "disabled" ? "Disable channel" : "Enable channel",
      danger: nextStatus === "disabled",
      onConfirm: async () => {
        try {
          await adminRequest(`/channels/${channel.id}`, { method: "PATCH", body: JSON.stringify({ status: nextStatus }) });
          setChannels((current) => current.map((item) => item.id === channel.id ? { ...item, status: nextStatus } : item));
          closeModal(); flashToast(`${channel.name} is now ${nextStatus}.`);
        } catch (error) { flashToast(error.message); }
      },
    });
  }

  function confirmChannelBlock(channel) {
    setModal({
      type: "confirm",
      title: `Blacklist ${channel.name}`,
      body: "This marks the channel as blocked and removes it from normal serving candidates.",
      confirmLabel: "Blacklist channel",
      danger: true,
      onConfirm: async () => {
        try {
          await adminRequest(`/channels/${channel.id}`, { method: "PATCH", body: JSON.stringify({ status: "disabled" }) });
          setChannels((current) => current.map((item) => item.id === channel.id ? { ...item, status: "disabled", serveRate: "0%" } : item));
          closeModal(); flashToast(`${channel.name} disabled.`);
        } catch (error) { flashToast(error.message); }
      },
    });
  }

  async function toggleVideoFlag(video) {
    try {
      await adminRequest(`/content/videos/${encodeURIComponent(video.id)}/blacklist`, { method: "POST", body: JSON.stringify({ reason: "Blacklisted from the admin console." }) });
      setServedVideos((current) => current.filter((item) => item.id !== video.id));
      flashToast(`${video.title} blacklisted.`);
    } catch (error) { flashToast(error.message); }
  }

  function blockVideoChannel(video) {
    setModal({
      type: "confirm",
      title: `Block ${video.channel}`,
      body: "This marks the source channel as blocked in the admin UI.",
      confirmLabel: "Block channel",
      danger: true,
      onConfirm: async () => {
        const channel = channels.find((item) => item.name === video.channel);
        if (!channel) return flashToast("This video channel is not in trusted channels.");
        try {
          await adminRequest(`/channels/${channel.id}`, { method: "PATCH", body: JSON.stringify({ status: "disabled" }) });
          setChannels((current) => current.map((item) => item.id === channel.id ? { ...item, status: "disabled", serveRate: "0%" } : item));
          closeModal(); flashToast(`${video.channel} disabled.`);
        } catch (error) { flashToast(error.message); }
      },
    });
  }

  function updateGeneratedItem(itemId, updater) {
    setCurricula((current) => current.map((item) => (item.id === itemId ? updater(item) : item)));
    setAssessments((current) => current.map((item) => (item.id === itemId ? updater(item) : item)));
  }

  async function toggleGeneratedFlag(item) {
    if (!item.assessmentType) return flashToast("Curriculum review state is not stored in the current schema.");
    try {
      const review_status = item.status === "flagged" ? "ok" : "flagged";
      await adminRequest(`/assessments/${item.assessmentType === "challenge" ? "challenges" : "quizzes"}/${item.id}`, { method: "PATCH", body: JSON.stringify({ review_status }) });
      updateGeneratedItem(item.id, (current) => ({ ...current, status: review_status }));
      flashToast(`${item.title} updated.`);
    } catch (error) { flashToast(error.message); }
  }

  async function regenerateGeneratedItem(item) {
    if (!item.assessmentType || item.assessmentType !== "challenge") return flashToast("Only topic challenges can be regenerated with the current generator.");
    try {
      await adminRequest(`/assessments/challenges/${item.id}/regenerate`, { method: "POST" });
      flashToast(`${item.title} regenerated.`);
    } catch (error) { flashToast(error.message); }
  }

  function confirmUserStatus(user) {
    const nextStatus = user.status === "active" ? "inactive" : "active";
    setModal({
      type: "confirm",
      title: `${nextStatus === "inactive" ? "Deactivate" : "Reactivate"} ${user.name}`,
      body:
        nextStatus === "inactive"
          ? "This prevents the account from normal access until it is reactivated."
          : "This restores normal access for the account.",
      confirmLabel: nextStatus === "inactive" ? "Deactivate account" : "Reactivate account",
      danger: nextStatus === "inactive",
      onConfirm: async () => {
        try {
          await adminRequest(`/users/${user.id}/status`, { method: "PATCH", body: JSON.stringify({ is_active: nextStatus === "active" }) });
          setUsers((current) => current.map((item) => item.id === user.id ? { ...item, status: nextStatus } : item));
          closeModal(); flashToast(`${user.name} is now ${nextStatus}.`);
        } catch (error) { flashToast(error.message); }
      },
    });
  }

  const channelRows = useMemo(() => {
    const channelFilters = filters.channels;
    return channels.filter(
      (channel) =>
        matchesQuery(channel, channelFilters.query, ["name", "topic", "owner"]) &&
        (channelFilters.status === "all" || channel.status === channelFilters.status) &&
        (channelFilters.topic === "all" || channel.topic === channelFilters.topic),
    );
  }, [channels, filters.channels]);

  const contentRows = useMemo(() => {
    const contentFilters = filters.content;
    const rows =
      activeContentTab === "flagged"
        ? servedVideos.filter((video) => video.status === "flagged")
        : servedVideos;

    return rows.filter(
      (video) =>
        matchesQuery(video, contentFilters.query, ["title", "channel", "topic"]) &&
        (contentFilters.status === "all" || video.status === contentFilters.status) &&
        (contentFilters.source === "all" || video.source === contentFilters.source),
    );
  }, [activeContentTab, filters.content, servedVideos]);

  const generatedRows = useMemo(() => {
    const curriculumFilters = filters.curriculum;
    const rows =
      activeCurriculumTab === "assessments"
        ? assessments.map((item) => ({ ...item, type: "Assessment" }))
        : curricula.map((item) => ({ ...item, type: "Curriculum" }));

    return rows.filter(
      (item) =>
        matchesQuery(item, curriculumFilters.query, ["title", "careerPath", "level"]) &&
        (curriculumFilters.status === "all" || item.status === curriculumFilters.status) &&
        (curriculumFilters.type === "all" || item.type === curriculumFilters.type),
    );
  }, [activeCurriculumTab, assessments, curricula, filters.curriculum]);

  const userRows = useMemo(() => {
    const userFilters = filters.users;
    return users.filter(
      (user) =>
        matchesQuery(user, userFilters.query, ["name", "email", "careerPath"]) &&
        (userFilters.role === "all" || user.role === userFilters.role) &&
        (userFilters.status === "all" || user.status === userFilters.status),
    );
  }, [filters.users, users]);

  const dashboardRows = useMemo(
    () => [
      ...curricula.map((item) => ({
        id: item.id,
        title: item.title,
        type: "Curriculum",
        area: item.careerPath,
        status: item.status,
        updated: item.updatedAt,
      })),
      ...assessments.map((item) => ({
        id: item.id,
        title: item.title,
        type: "Assessment",
        area: item.careerPath,
        status: item.status,
        updated: item.updatedAt,
      })),
      ...servedVideos.map((item) => ({
        id: item.id,
        title: item.title,
        type: "Video",
        area: item.topic,
        status: item.status,
        updated: `${item.served} serves`,
      })),
    ],
    [assessments, curricula, servedVideos],
  );

  const activeChannels = channels.filter((channel) => channel.status === "active").length;
  const flaggedVideos = servedVideos.filter((video) => video.status === "flagged").length;
  const flaggedGenerated = [...curricula, ...assessments].filter(
    (item) => item.status === "flagged",
  ).length;
  const activeUsers = users.filter((user) => user.status === "active").length;

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span>A</span>
          <strong>Admin Console</strong>
        </div>
        <nav aria-label="Admin sections" className="admin-nav">
          {navItems.map((item) => (
            <button
              className={section === item.id ? "is-active" : ""}
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <button className="admin-learner-view" type="button" onClick={() => navigate("/dashboard")}>
          Switch to learner view
        </button>
      </aside>

      <main className="admin-main">
        {section === "dashboard" ? (
          <>
            <PageTitle eyebrow="Overview" title="Dashboard" />
            <div className="admin-metric-grid">
              <Metric label="Active channels" value={activeChannels} note={`${channels.length} total`} />
              <Metric label="Flagged videos" value={flaggedVideos} note="Held out of normal serving" />
              <Metric
                label="Generated items flagged"
                value={flaggedGenerated}
                note="Curricula and assessments"
              />
              <Metric label="Active users" value={activeUsers} note={`${users.length} total`} />
            </div>
            <AdminSection title="Recent Review Activity">
              <AdminTable
                columns={[
                  {
                    label: "Item",
                    render: (row) => <PrimaryCell subtitle={row.type} title={row.title} />,
                  },
                  { label: "Area", render: (row) => row.area },
                  { label: "Status", render: (row) => <StatusBadge status={row.status} /> },
                  { label: "Updated", render: (row) => row.updated },
                ]}
                rows={dashboardRows.slice(0, 6)}
              />
            </AdminSection>
          </>
        ) : null}

        {section === "channels" ? (
          <>
            <PageTitle
              action={
                <button className="admin-primary-button" type="button" onClick={() => openChannelForm()}>
                  Add channel
                </button>
              }
              eyebrow="Admin"
              title="Channels"
            />
            <AdminSection>
              <SearchFilterBar
                filters={[
                  { key: "query", type: "search", label: "Search", placeholder: "Channel, topic, owner" },
                  {
                    key: "status",
                    label: "Status",
                    options: [
                      { value: "all", label: "All statuses" },
                      { value: "active", label: "Active" },
                      { value: "disabled", label: "Disabled" },
                      { value: "blocked", label: "Blocked" },
                    ],
                  },
                  {
                    key: "topic",
                    label: "Topic",
                    options: [
                      { value: "all", label: "All topics" },
                      { value: "Data", label: "Data" },
                      { value: "Web", label: "Web" },
                      { value: "Cloud", label: "Cloud" },
                    ],
                  },
                ]}
                onChange={updateFilter}
                section="channels"
                values={filters.channels}
              />
              <AdminTable
                actions={[
                  { id: "edit", label: "Edit", onClick: openChannelForm },
                  {
                    id: "status",
                    label: (row) => (row.status === "active" ? "Disable" : "Enable"),
                    danger: (row) => row.status === "active",
                    onClick: confirmChannelStatus,
                  },
                  {
                    id: "blacklist",
                    label: "Blacklist",
                    danger: true,
                    onClick: confirmChannelBlock,
                  },
                ]}
                columns={[
                  {
                    label: "Channel",
                    render: (row) => <PrimaryCell subtitle={row.owner} title={row.name} />,
                  },
                  { label: "Source", render: (row) => row.source },
                  { label: "Topic", render: (row) => row.topic },
                  { label: "Status", render: (row) => <StatusBadge status={row.status} /> },
                  { label: "Last synced", render: (row) => row.lastSynced },
                  { label: "Serve rate", render: (row) => row.serveRate },
                ]}
                rows={channelRows}
              />
            </AdminSection>
          </>
        ) : null}

        {section === "content" ? (
          <>
            <PageTitle eyebrow="Admin" title="Content Review" />
            <AdminSection>
              <Tabs
                active={activeContentTab}
                items={[
                  { id: "served", label: "Served Videos" },
                  { id: "flagged", label: "Flagged Queue" },
                ]}
                onChange={setActiveContentTab}
              />
              <SearchFilterBar
                filters={[
                  { key: "query", type: "search", label: "Search", placeholder: "Video, channel, topic" },
                  {
                    key: "status",
                    label: "Status",
                    options: [
                      { value: "all", label: "All statuses" },
                      { value: "served", label: "Served" },
                      { value: "flagged", label: "Flagged" },
                    ],
                  },
                  {
                    key: "source",
                    label: "Source",
                    options: [
                      { value: "all", label: "All sources" },
                      { value: "YouTube", label: "YouTube" },
                    ],
                  },
                ]}
                onChange={updateFilter}
                section="content"
                values={filters.content}
              />
              <AdminTable
                actions={[
                  {
                    id: "preview",
                    label: "Preview",
                    onClick: (row) =>
                      setModal({
                        type: "details",
                        title: row.title,
                        children: (
                          <DetailList
                            rows={[
                              ["Channel", row.channel],
                              ["Topic", row.topic],
                              ["Source", row.source],
                              ["Served", row.served],
                              ["Status", <StatusBadge status={row.status} />],
                              ["Reason", row.flaggedReason || "None"],
                            ]}
                          />
                        ),
                      }),
                  },
                  {
                    id: "flag",
                    label: "Blacklist",
                    danger: true,
                    onClick: toggleVideoFlag,
                  },
                  {
                    id: "block-channel",
                    label: "Block channel",
                    danger: true,
                    onClick: blockVideoChannel,
                  },
                ]}
                columns={[
                  {
                    label: "Video",
                    render: (row) => <PrimaryCell subtitle={row.channel} title={row.title} />,
                  },
                  { label: "Topic", render: (row) => row.topic },
                  { label: "Source", render: (row) => row.source },
                  { label: "Served", render: (row) => row.served },
                  { label: "Status", render: (row) => <StatusBadge status={row.status} /> },
                  { label: "Reason", render: (row) => row.flaggedReason || "None" },
                ]}
                rows={contentRows}
              />
            </AdminSection>
          </>
        ) : null}

        {section === "curriculum" ? (
          <>
            <PageTitle eyebrow="Admin" title="Curriculum & Assessments" />
            <AdminSection>
              <Tabs
                active={activeCurriculumTab}
                items={[
                  { id: "curricula", label: "Curricula" },
                  { id: "assessments", label: "Assessments" },
                ]}
                onChange={setActiveCurriculumTab}
              />
              <SearchFilterBar
                filters={[
                  { key: "query", type: "search", label: "Search", placeholder: "Title, path, level" },
                  {
                    key: "status",
                    label: "Status",
                    options: [
                      { value: "all", label: "All statuses" },
                      { value: "ready", label: "Ready" },
                      { value: "flagged", label: "Flagged" },
                      { value: "regenerating", label: "Regenerating" },
                      { value: "draft", label: "Draft" },
                    ],
                  },
                  {
                    key: "type",
                    label: "Type",
                    options: [
                      { value: "all", label: "All types" },
                      { value: "Curriculum", label: "Curriculum" },
                      { value: "Assessment", label: "Assessment" },
                    ],
                  },
                ]}
                onChange={updateFilter}
                section="curriculum"
                values={filters.curriculum}
              />
              <AdminTable
                actions={[
                  {
                    id: "preview",
                    label: "Preview",
                    onClick: (row) => {
                      setSelectedItem(row);
                      setPreviewModalOpen(true);
                    },
                  },
                  {
                    id: "regenerate",
                    label: "Regenerate",
                    onClick: regenerateGeneratedItem,
                  },
                  {
                    id: "flag",
                    label: (row) => (row.status === "flagged" ? "Unflag" : "Flag"),
                    danger: (row) => row.status !== "flagged",
                    onClick: toggleGeneratedFlag,
                  },
                ]}
                columns={[
                  {
                    label: "Item",
                    render: (row) => <PrimaryCell subtitle={row.generatedBy} title={row.title} />,
                  },
                  { label: "Type", render: (row) => row.type },
                  { label: "Career Path", render: (row) => row.careerPath },
                  { label: "Skill Level", render: (row) => row.level },
                  { label: "Units", render: (row) => row.lessons },
                  { label: "Updated", render: (row) => row.updatedAt },
                  { label: "Status", render: (row) => <StatusBadge status={row.status} /> },
                ]}
                rows={generatedRows}
              />
            </AdminSection>
          </>
        ) : null}

        {section === "users" ? (
          <>
            <PageTitle eyebrow="Admin" title="Users" />
            <AdminSection>
              <SearchFilterBar
                filters={[
                  { key: "query", type: "search", label: "Search", placeholder: "Name, email, path" },
                  {
                    key: "role",
                    label: "Role",
                    options: [
                      { value: "all", label: "All roles" },
                      { value: "learner", label: "Learner" },
                      { value: "admin", label: "Admin" },
                    ],
                  },
                  {
                    key: "status",
                    label: "Status",
                    options: [
                      { value: "all", label: "All statuses" },
                      { value: "active", label: "Active" },
                      { value: "inactive", label: "Inactive" },
                    ],
                  },
                ]}
                onChange={updateFilter}
                section="users"
                values={filters.users}
              />
              <AdminTable
                actions={[
                  {
                    id: "profile",
                    label: "View profile",
                    onClick: (row) =>
                      setModal({
                        type: "details",
                        title: row.name,
                        children: (
                          <DetailList
                            rows={[
                              ["Email", row.email],
                              ["Role", <StatusBadge status={row.role} />],
                              ["Career Path", row.careerPath],
                              ["Skill Level", row.skillLevel],
                              ["Signup Date", row.signupDate],
                              ["Status", <StatusBadge status={row.status} />],
                              ["Progress", row.progress],
                            ]}
                          />
                        ),
                      }),
                  },
                  {
                    id: "role",
                    label: (row) => (row.role === "admin" ? "Make learner" : "Make admin"),
                    onClick: async (row) => {
                      try {
                        const role = row.role === "admin" ? "student" : "admin";
                        await adminRequest(`/users/${row.id}/role`, { method: "PATCH", body: JSON.stringify({ role }) });
                        setUsers((current) => current.map((user) => user.id === row.id ? { ...user, role } : user));
                        flashToast(`${row.name} role updated.`);
                      } catch (error) { flashToast(error.message); }
                    },
                  },
                  {
                    id: "status",
                    label: (row) => (row.status === "active" ? "Deactivate" : "Reactivate"),
                    danger: (row) => row.status === "active",
                    onClick: confirmUserStatus,
                  },
                ]}
                columns={[
                  { label: "Name", render: (row) => row.name },
                  { label: "Email", render: (row) => row.email },
                  { label: "Role", render: (row) => <StatusBadge status={row.role} /> },
                  { label: "Career Path", render: (row) => row.careerPath },
                  { label: "Skill Level", render: (row) => row.skillLevel },
                  { label: "Signup Date", render: (row) => row.signupDate },
                  { label: "Status", render: (row) => <StatusBadge status={row.status} /> },
                ]}
                rows={userRows}
              />
            </AdminSection>
          </>
        ) : null}
      </main>

      {previewModalOpen && selectedItem ? <PreviewModal item={selectedItem} onClose={closeModal} /> : null}

      {modal?.type === "confirm" ? (
        <ConfirmModal
          body={modal.body}
          confirmLabel={modal.confirmLabel}
          danger={modal.danger}
          onClose={closeModal}
          onConfirm={modal.onConfirm}
          title={modal.title}
        />
      ) : null}

      {modal?.type === "form" ? (
        <FormModal
          fields={modal.fields}
          onClose={closeModal}
          onSubmit={modal.onSubmit}
          submitLabel={modal.submitLabel}
          title={modal.title}
        />
      ) : null}

      {modal?.type === "details" ? (
        <DetailsModal onClose={closeModal} title={modal.title}>
          {modal.children}
        </DetailsModal>
      ) : null}

      {toast ? <div className="admin-toast">{toast}</div> : null}
    </div>
  );
}

function PageTitle({ eyebrow, title, action }) {
  return (
    <div className="admin-page-title">
      <div>
        <p className="admin-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      {action}
    </div>
  );
}

function AdminSection({ title, children }) {
  return (
    <section className="admin-section">
      {title ? (
        <header className="admin-section-header">
          <h2>{title}</h2>
        </header>
      ) : null}
      {children}
    </section>
  );
}

function Tabs({ active, items, onChange }) {
  return (
    <div className="admin-tabs">
      {items.map((item) => (
        <button
          className={active === item.id ? "is-active" : ""}
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
