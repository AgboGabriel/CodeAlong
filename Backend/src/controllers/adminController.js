import database from "../config/database.js";
import assessmentContentService from "../services/assessmentContent.service.js";

const PAGE_SIZE = 50;
const list = (res, result, page = 1) =>
  res.json({ data: result.rows, total: Number(result.rows[0]?.total_count || 0), page: Number(page) });
const fail = (res, error) => {
  console.error("Admin API error:", error);
  return res.status(500).json({ error: { message: "Unable to complete the admin request", code: "ADMIN_QUERY_FAILED" } });
};

class AdminController {
  async channels(req, res) {
    try {
      const { search = "", status, sort = "channel_name" } = req.query;
      const orderBy = { channel_name: "channel_name", trust_score: "trust_score", created_at: "created_at" }[sort] || "channel_name";
      const result = await database.query(
        `SELECT *, COUNT(*) OVER() AS total_count FROM trusted_channels
         WHERE ($1 = '' OR channel_name ILIKE '%' || $1 || '%')
           AND ($2 = '' OR status = $2)
         ORDER BY ${orderBy} ASC`,
        [search, status && status !== "all" ? status : ""]
      );
      return list(res, result);
    } catch (error) { return fail(res, error); }
  }

  async createChannel(req, res) {
    try {
      const { channel_name, youtube_channel_id = null, trust_score = 100 } = req.body;
      if (!channel_name?.trim()) return res.status(400).json({ error: { message: "channel_name is required", code: "VALIDATION_ERROR" } });
      const result = await database.query(
        `INSERT INTO trusted_channels (channel_name, youtube_channel_id, trust_score)
         VALUES ($1, $2, $3) RETURNING *`, [channel_name.trim(), youtube_channel_id, Number(trust_score)]);
      return res.status(201).json(result.rows[0]);
    } catch (error) { return fail(res, error); }
  }

  async updateChannel(req, res) {
    try {
      const allowed = ["channel_name", "trust_score", "status"];
      const entries = allowed.filter((key) => req.body[key] !== undefined).map((key) => [key, req.body[key]]);
      if (!entries.length) return res.status(400).json({ error: { message: "No editable fields supplied", code: "VALIDATION_ERROR" } });
      const set = entries.map(([key], index) => `${key} = $${index + 1}`).join(", ");
      const result = await database.query(`UPDATE trusted_channels SET ${set}, updated_at = NOW() WHERE id = $${entries.length + 1} RETURNING *`, [...entries.map(([, value]) => value), req.params.id]);
      if (!result.rows[0]) return res.status(404).json({ error: { message: "Channel not found", code: "NOT_FOUND" } });
      return res.json(result.rows[0]);
    } catch (error) { return fail(res, error); }
  }

  async deleteChannel(req, res) {
    try {
      const result = await database.query("DELETE FROM trusted_channels WHERE id = $1 RETURNING *", [req.params.id]);
      if (!result.rows[0]) return res.status(404).json({ error: { message: "Channel not found", code: "NOT_FOUND" } });
      return res.json(result.rows[0]);
    } catch (error) { return fail(res, error); }
  }

  async videos(req, res) {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1), offset = (page - 1) * PAGE_SIZE;
      const result = await database.query(
        `SELECT tv.video_id, MAX(tv.title) AS title, MAX(tv.channel_title) AS channel_title,
                ARRAY_AGG(DISTINCT ct.title) AS topic_titles, AVG(tv.score) AS avg_relevance_score,
                COUNT(*)::int AS times_recommended, COUNT(*) OVER() AS total_count
         FROM topic_videos tv JOIN curriculum_topics ct ON ct.id = tv.topic_id
         WHERE NOT EXISTS (SELECT 1 FROM blacklisted_videos bv WHERE bv.video_id = tv.video_id)
           AND ($1::int IS NULL OR tv.topic_id = $1) AND ($2 = '' OR tv.channel_title ILIKE '%' || $2 || '%')
         GROUP BY tv.video_id ORDER BY times_recommended DESC LIMIT $3 OFFSET $4`,
        [req.query.topic_id || null, req.query.channel_title || "", PAGE_SIZE, offset]);
      return list(res, result, page);
    } catch (error) { return fail(res, error); }
  }

  async blacklistVideo(req, res) {
    try {
      const result = await database.query(
        `INSERT INTO blacklisted_videos (video_id, reason, blacklisted_by) VALUES ($1, $2, $3)
         ON CONFLICT (video_id) DO UPDATE SET reason = EXCLUDED.reason, blacklisted_by = EXCLUDED.blacklisted_by
         RETURNING *`, [req.params.videoId, req.body.reason || null, req.user.id]);
      return res.status(201).json(result.rows[0]);
    } catch (error) { return fail(res, error); }
  }

  async flags(req, res) {
    try {
      const result = await database.query(
        `SELECT cf.*, ct.title AS topic_title, COUNT(*) OVER() AS total_count FROM content_flags cf
         LEFT JOIN curriculum_topics ct ON ct.id = cf.topic_id
         WHERE ($1 = '' OR cf.status = $1) ORDER BY cf.created_at DESC`, [req.query.status || ""]);
      return list(res, result);
    } catch (error) { return fail(res, error); }
  }

  async updateFlag(req, res) {
    try {
      if (!['dismissed', 'resolved', 'open'].includes(req.body.status)) return res.status(400).json({ error: { message: "Invalid flag status", code: "VALIDATION_ERROR" } });
      const result = await database.query("UPDATE content_flags SET status = $1, resolved_at = CASE WHEN $1 = 'open' THEN NULL ELSE NOW() END WHERE id = $2 RETURNING *", [req.body.status, req.params.id]);
      if (!result.rows[0]) return res.status(404).json({ error: { message: "Flag not found", code: "NOT_FOUND" } });
      return res.json(result.rows[0]);
    } catch (error) { return fail(res, error); }
  }

  async blacklistFlag(req, res) {
    const client = await database.getClient();
    try {
      await client.query("BEGIN");
      const flag = await client.query("SELECT * FROM content_flags WHERE id = $1 FOR UPDATE", [req.params.id]);
      if (!flag.rows[0]) { await client.query("ROLLBACK"); return res.status(404).json({ error: { message: "Flag not found", code: "NOT_FOUND" } }); }
      const video = await client.query(`INSERT INTO blacklisted_videos (video_id, reason, blacklisted_by) VALUES ($1, $2, $3) ON CONFLICT (video_id) DO UPDATE SET reason = EXCLUDED.reason RETURNING *`, [flag.rows[0].video_id, flag.rows[0].reason, req.user.id]);
      await client.query("UPDATE content_flags SET status = 'resolved', resolved_at = NOW() WHERE id = $1", [req.params.id]);
      await client.query("COMMIT");
      return res.json(video.rows[0]);
    } catch (error) { await client.query("ROLLBACK"); return fail(res, error); } finally { client.release(); }
  }

  async curricula(req, res) {
    try {
      const result = await database.query(
        `SELECT uc.*, u.username, u.email, COUNT(cm.id)::int AS module_count, COUNT(ct.id)::int AS topic_count, COUNT(*) OVER() AS total_count
         FROM user_curriculums uc JOIN users u ON u.id = uc.user_id LEFT JOIN curriculum_modules cm ON cm.curriculum_id = uc.id LEFT JOIN curriculum_topics ct ON ct.module_id = cm.id
         WHERE ($1::int IS NULL OR uc.user_id = $1) AND ($2 = '' OR uc.status = $2) AND ($3 = '' OR uc.title ILIKE '%' || $3 || '%')
         GROUP BY uc.id, u.id ORDER BY uc.updated_at DESC`, [req.query.user_id || null, req.query.status || "", req.query.search || ""]);
      return list(res, result);
    } catch (error) { return fail(res, error); }
  }

  async curriculumDetail(req, res) {
    try {
      const curriculum = await database.query("SELECT uc.*, u.username, u.email FROM user_curriculums uc JOIN users u ON u.id = uc.user_id WHERE uc.id = $1", [req.params.id]);
      if (!curriculum.rows[0]) return res.status(404).json({ error: { message: "Curriculum not found", code: "NOT_FOUND" } });
      const modules = await database.query(`SELECT cm.*, COALESCE(json_agg(ct ORDER BY ct.topic_index) FILTER (WHERE ct.id IS NOT NULL), '[]') AS topics FROM curriculum_modules cm LEFT JOIN curriculum_topics ct ON ct.module_id = cm.id WHERE cm.curriculum_id = $1 GROUP BY cm.id ORDER BY cm.module_index`, [req.params.id]);
      return res.json({ ...curriculum.rows[0], modules: modules.rows });
    } catch (error) { return fail(res, error); }
  }

  async regenerateCurriculum(req, res) {
    return res.status(501).json({ error: { message: "Curriculum regeneration has no reusable generator yet; use the existing curriculum chat flow to create a replacement.", code: "NOT_IMPLEMENTED" } });
  }

  async assessments(req, res) {
    try {
      const type = req.query.type || "challenge";
      if (!['challenge', 'quiz'].includes(type)) return res.status(400).json({ error: { message: "type must be challenge or quiz", code: "VALIDATION_ERROR" } });
      const table = type === 'challenge' ? 'topic_challenges' : 'topic_quizzes';
      const fields = type === 'challenge' ? 'a.id, a.title, a.difficulty, a.created_at, a.review_status' : 'a.id, a.quiz_type, a.score, a.passed, a.created_at, a.review_status';
      const result = await database.query(`SELECT ${fields}, ct.title AS topic_title, u.username, a.user_id, a.topic_id, COUNT(*) OVER() AS total_count FROM ${table} a JOIN curriculum_topics ct ON ct.id = a.topic_id JOIN users u ON u.id = a.user_id WHERE ($1::int IS NULL OR a.topic_id = $1) AND ($2 = '' OR a.review_status = $2) AND ($3::int IS NULL OR a.user_id = $3) ORDER BY a.created_at DESC`, [req.query.topic_id || null, req.query.review_status || "", req.query.user_id || null]);
      return list(res, result);
    } catch (error) { return fail(res, error); }
  }

  async challengeDetail(req, res) {
    try { const result = await database.query("SELECT id, title, prompt, instructions, starter_code_by_language, public_tests, difficulty, review_status FROM topic_challenges WHERE id = $1", [req.params.id]); if (!result.rows[0]) return res.status(404).json({ error: { message: "Challenge not found", code: "NOT_FOUND" } }); return res.json(result.rows[0]); } catch (error) { return fail(res, error); }
  }
  async quizDetail(req, res) {
    try { const result = await database.query("SELECT id, quiz_type, questions, score, passed, review_status FROM topic_quizzes WHERE id = $1", [req.params.id]); if (!result.rows[0]) return res.status(404).json({ error: { message: "Quiz not found", code: "NOT_FOUND" } }); return res.json(result.rows[0]); } catch (error) { return fail(res, error); }
  }
  async updateAssessment(req, res) {
    try { if (!['ok', 'flagged'].includes(req.body.review_status)) return res.status(400).json({ error: { message: "Invalid review status", code: "VALIDATION_ERROR" } }); const table = req.params.type === 'challenges' ? 'topic_challenges' : 'topic_quizzes'; const result = await database.query(`UPDATE ${table} SET review_status = $1 WHERE id = $2 RETURNING *`, [req.body.review_status, req.params.id]); if (!result.rows[0]) return res.status(404).json({ error: { message: "Assessment not found", code: "NOT_FOUND" } }); return res.json(result.rows[0]); } catch (error) { return fail(res, error); }
  }
  async regenerateChallenge(req, res) {
    try { const found = await database.query("SELECT user_id, topic_id, module_id, challenge_type FROM topic_challenges WHERE id = $1", [req.params.id]); if (!found.rows[0]) return res.status(404).json({ error: { message: "Challenge not found", code: "NOT_FOUND" } }); const challenge = await assessmentContentService.generateTopicChallenge({ userId: found.rows[0].user_id, topicId: found.rows[0].topic_id, moduleId: found.rows[0].module_id, challengeType: found.rows[0].challenge_type }); return res.json(challenge); } catch (error) { return fail(res, error); }
  }

  async users(req, res) {
    try { const result = await database.query(`SELECT u.id, u.username, u.email, u.full_name, u.role, u.is_active, u.created_at, u.last_login, q.career_path, q.skill_level, COUNT(uc.id)::int AS curriculum_count, COUNT(*) OVER() AS total_count FROM users u LEFT JOIN user_questionnaires q ON q.user_id = u.id LEFT JOIN user_curriculums uc ON uc.user_id = u.id WHERE ($1 = '' OR u.username ILIKE '%' || $1 || '%' OR u.email ILIKE '%' || $1 || '%') AND ($2 = '' OR u.role = $2) AND ($3::boolean IS NULL OR u.is_active = $3) GROUP BY u.id, q.id ORDER BY u.created_at DESC`, [req.query.search || "", req.query.role || "", req.query.is_active === undefined || req.query.is_active === "all" ? null : req.query.is_active === "true"]); return list(res, result); } catch (error) { return fail(res, error); }
  }
  async userDetail(req, res) {
    try { const user = await database.query(`SELECT u.id, u.username, u.email, u.full_name, u.avatar_url, u.role, u.is_active, u.created_at, u.last_login, q.career_path, q.skill_level, q.known_languages, q.learning_languages, (SELECT COUNT(*)::int FROM user_curriculums uc WHERE uc.user_id = u.id) AS curriculum_count, (SELECT COUNT(*)::int FROM curriculum_topics ct JOIN curriculum_modules cm ON cm.id = ct.module_id JOIN user_curriculums uc ON uc.id = cm.curriculum_id WHERE uc.user_id = u.id AND ct.status = 'completed') AS completed_topics FROM users u LEFT JOIN user_questionnaires q ON q.user_id = u.id WHERE u.id = $1`, [req.params.id]); if (!user.rows[0]) return res.status(404).json({ error: { message: "User not found", code: "NOT_FOUND" } }); return res.json(user.rows[0]); } catch (error) { return fail(res, error); }
  }
  async updateUser(req, res) {
    try { const field = req.params.field === 'role' ? 'role' : 'is_active'; const value = req.body[field]; if ((field === 'role' && !['student','instructor','admin'].includes(value)) || (field === 'is_active' && typeof value !== 'boolean')) return res.status(400).json({ error: { message: "Invalid user update", code: "VALIDATION_ERROR" } }); const result = await database.query(`UPDATE users SET ${field} = $1, updated_at = NOW() WHERE id = $2 RETURNING id, username, email, role, is_active`, [value, req.params.id]); if (!result.rows[0]) return res.status(404).json({ error: { message: "User not found", code: "NOT_FOUND" } }); return res.json(result.rows[0]); } catch (error) { return fail(res, error); }
  }

  async dashboard(req, res) {
    try { const [summary, channels, assessments] = await Promise.all([database.query(`SELECT (SELECT COUNT(*)::int FROM users WHERE role = 'student' AND is_active) AS total_learners, (SELECT COUNT(*)::int FROM trusted_channels WHERE status = 'active') AS total_channels, (SELECT COUNT(*)::int FROM curriculum_topics ct WHERE (SELECT COUNT(*) FROM topic_videos tv WHERE tv.topic_id = ct.id) < 2) AS weak_coverage_topics_count, (SELECT COUNT(*)::int FROM content_flags WHERE status = 'open') AS open_flags_count, ((SELECT COUNT(*) FROM topic_challenges WHERE created_at >= CURRENT_DATE) + (SELECT COUNT(*) FROM topic_quizzes WHERE created_at >= CURRENT_DATE))::int AS assessments_generated_today`), database.query(`SELECT channel_title, COUNT(*)::int AS times_recommended FROM topic_videos WHERE channel_title IS NOT NULL GROUP BY channel_title ORDER BY times_recommended DESC LIMIT 10`), database.query(`SELECT COUNT(*) FILTER (WHERE passed)::int AS passed, COUNT(*) FILTER (WHERE NOT passed)::int AS failed, COUNT(*)::int AS total FROM (SELECT passed FROM topic_challenge_submissions UNION ALL SELECT passed FROM topic_quizzes WHERE passed IS NOT NULL) attempts`)]); return res.json({ summary: summary.rows[0], top_channels: channels.rows, assessment_stats: assessments.rows[0] }); } catch (error) { return fail(res, error); }
  }
  async topChannels(req, res) {
    try {
      const result = await database.query(`SELECT channel_title, COUNT(*)::int AS times_recommended FROM topic_videos WHERE channel_title IS NOT NULL GROUP BY channel_title ORDER BY times_recommended DESC LIMIT $1`, [Math.min(Math.max(Number(req.query.limit) || 10, 1), 100)]);
      return res.json({ data: result.rows, total: result.rows.length, page: 1 });
    } catch (error) { return fail(res, error); }
  }
  async assessmentStats(req, res) {
    try {
      const result = await database.query(`SELECT COUNT(*) FILTER (WHERE passed)::int AS passed, COUNT(*) FILTER (WHERE NOT passed)::int AS failed, COUNT(*)::int AS total FROM (SELECT passed FROM topic_challenge_submissions UNION ALL SELECT passed FROM topic_quizzes WHERE passed IS NOT NULL) attempts`);
      return res.json(result.rows[0]);
    } catch (error) { return fail(res, error); }
  }
}
export default new AdminController();
