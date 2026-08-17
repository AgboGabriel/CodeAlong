import database from "../config/database.js";

class AnalyticsModel {
  async getLearnerAnalytics(userId) {
    const [topicsResult, quizzesResult, challengesResult] = await Promise.all([
      database.query(
        `
          SELECT
            uc.id AS curriculum_id,
            uc.title AS curriculum_title,
            cm.id AS module_id,
            cm.title AS module_title,
            cm.module_index,
            ct.id AS topic_id,
            ct.title AS topic_title,
            ct.topic_index,
            ct.status AS topic_status,
            COALESCE(tm.mastery_probability, 0) AS mastery_probability,
            COALESCE(tm.attempts, 0) AS attempts,
            COALESCE(tm.correct_answers, 0) AS correct_answers,
            COALESCE(tm.incorrect_answers, 0) AS incorrect_answers,
            tm.updated_at AS mastery_updated_at
          FROM user_curriculums uc
          JOIN curriculum_modules cm ON cm.curriculum_id = uc.id
          JOIN curriculum_topics ct ON ct.module_id = cm.id
          LEFT JOIN topic_mastery tm ON tm.topic_id = ct.id AND tm.user_id = uc.user_id
          WHERE uc.user_id = $1
          ORDER BY uc.created_at DESC, cm.module_index ASC, ct.topic_index ASC
        `,
        [userId]
      ),
      database.query(
        `
          SELECT
            tq.id,
            tq.quiz_type,
            tq.score,
            tq.passed,
            tq.submitted_at,
            ct.id AS topic_id,
            ct.title AS topic_title,
            cm.title AS module_title
          FROM topic_quizzes tq
          JOIN curriculum_topics ct ON ct.id = tq.topic_id
          JOIN curriculum_modules cm ON cm.id = tq.module_id
          WHERE tq.user_id = $1 AND tq.submitted_at IS NOT NULL
          ORDER BY tq.submitted_at DESC
          LIMIT 30
        `,
        [userId]
      ),
      database.query(
        `
          SELECT
            tc.topic_id,
            ct.title AS topic_title,
            cm.title AS module_title,
            tc.title AS challenge_title,
            tc.created_at,
            COUNT(tcs.id)::int AS submission_count,
            COUNT(tcs.id) FILTER (WHERE tcs.passed)::int AS passed_submission_count,
            MAX(tcs.score) AS best_score,
            MAX(tcs.created_at) AS last_attempt_at
          FROM topic_challenges tc
          JOIN curriculum_topics ct ON ct.id = tc.topic_id
          JOIN curriculum_modules cm ON cm.id = tc.module_id
          LEFT JOIN topic_challenge_submissions tcs
            ON tcs.challenge_id = tc.id AND tcs.user_id = $1
          WHERE tc.user_id = $1
          GROUP BY tc.id, tc.topic_id, ct.title, cm.title, tc.title, tc.created_at
          ORDER BY COALESCE(MAX(tcs.created_at), tc.created_at) DESC
        `,
        [userId]
      ),
    ]);

    return {
      topics: topicsResult.rows,
      quizzes: quizzesResult.rows,
      challenges: challengesResult.rows,
    };
  }
}

export default new AnalyticsModel();
