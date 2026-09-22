import database from "../config/database.js";

class ChallengeModel {
  async createTopicChallenge({ userId, curriculumId, moduleId, topicId, challengeType = "section", challenge }) {
    if (challengeType === "assessment") {
      const result = await database.query(
        `INSERT INTO topic_challenges
          (user_id, curriculum_id, module_id, topic_id, challenge_type, title, prompt, instructions, expected_concepts, difficulty, starter_code_by_language, public_tests, hidden_tests, structural_expectations, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         RETURNING *`,
        [userId, curriculumId, moduleId, topicId, challengeType, challenge.title, challenge.prompt,
          JSON.stringify(challenge.instructions || []), challenge.expectedConcepts || [], challenge.difficulty || "medium",
          JSON.stringify(challenge.starterCodeByLanguage || {}), JSON.stringify(challenge.publicTests || []),
          JSON.stringify(challenge.hiddenTests || []), JSON.stringify(challenge.structuralExpectations || {}),
          challenge.source || "ai_generated_topic_aligned"]
      );
      return result.rows[0];
    }

    const query = `
      INSERT INTO topic_challenges
        (user_id, curriculum_id, module_id, topic_id, challenge_type, title, prompt, instructions, expected_concepts, difficulty, starter_code_by_language, public_tests, hidden_tests, structural_expectations, source)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (user_id, topic_id) WHERE challenge_type = 'section' DO UPDATE SET
        title                    = EXCLUDED.title,
        prompt                   = EXCLUDED.prompt,
        instructions             = EXCLUDED.instructions,
        expected_concepts        = EXCLUDED.expected_concepts,
        difficulty               = EXCLUDED.difficulty,
        starter_code_by_language = EXCLUDED.starter_code_by_language,
        public_tests             = EXCLUDED.public_tests,
        hidden_tests             = EXCLUDED.hidden_tests,
        structural_expectations  = EXCLUDED.structural_expectations,
        source                   = EXCLUDED.source,
        updated_at               = NOW()
      RETURNING *
    `;

    const result = await database.query(query, [
      userId,
      curriculumId,
      moduleId,
      topicId,
      challengeType,
      challenge.title,
      challenge.prompt,
      JSON.stringify(challenge.instructions || []),
      challenge.expectedConcepts || [],
      challenge.difficulty || "medium",
      JSON.stringify(challenge.starterCodeByLanguage || {}),
      JSON.stringify(challenge.publicTests || []),
      JSON.stringify(challenge.hiddenTests || []),
      JSON.stringify(challenge.structuralExpectations || {}),
      challenge.source || "ai_generated_topic_aligned",
    ]);

    return result.rows[0];
  }

  async createChallengeSubmission({ challengeId, userId, sourceCode, languageId, evaluation }) {
    const query = `
      INSERT INTO topic_challenge_submissions
        (challenge_id, user_id, source_code, language_id, evaluation, passed, score)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const passed = evaluation.failed === 0;
    const score = evaluation.total > 0 ? (evaluation.total - evaluation.failed) / evaluation.total : 0;

    const result = await database.query(query, [
      challengeId,
      userId,
      sourceCode,
      languageId,
      JSON.stringify(evaluation),
      passed,
      score,
    ]);

    return result.rows[0];
  }

  async recordLearnerWeakness({ userId, topicId, weaknessType, severity = 1.0, latestSubmissionId = null }) {
    const query = `
      INSERT INTO learner_weaknesses
        (user_id, topic_id, weakness_type, severity, occurrence_count, latest_submission_id)
      VALUES
        ($1, $2, $3, $4, 1, $5)
      RETURNING *
    `;

    const result = await database.query(query, [userId, topicId, weaknessType, severity, latestSubmissionId]);
    return result.rows[0];
  }

  async countTopicWeaknesses({ userId, topicId, weaknessType = "challenge_failure" }) {
    const result = await database.query(
      `
        SELECT COUNT(*)::int AS count
        FROM learner_weaknesses
        WHERE user_id = $1
          AND topic_id = $2
          AND weakness_type = $3
      `,
      [userId, topicId, weaknessType]
    );

    return Number(result.rows[0]?.count || 0);
  }

  async findLatestFailedEvaluation({ userId, topicId }) {
    const result = await database.query(
      `
        SELECT tcs.evaluation
        FROM topic_challenge_submissions tcs
        INNER JOIN topic_challenges tc ON tc.id = tcs.challenge_id
        WHERE tcs.user_id = $1
          AND tc.topic_id = $2
          AND tc.challenge_type = 'section'
          AND tcs.passed = false
        ORDER BY tcs.created_at DESC
        LIMIT 1
      `,
      [userId, topicId]
    );

    return result.rows[0]?.evaluation || null;
  }

  async findLatestByTopicId(topicId, userId, challengeType = "section") {
    const query = `
      SELECT
        id,
        title,
        prompt,
        instructions,
        expected_concepts,
        difficulty,
        starter_code_by_language,
        public_tests,
        hidden_tests,
        structural_expectations,
        source,
        challenge_type
      FROM topic_challenges
      WHERE topic_id = $1
        AND user_id  = $2
        AND challenge_type = $3
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await database.query(query, [topicId, userId, challengeType]);
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      challenge_type: row.challenge_type,
      challenge_data: {
        title:                  row.title,
        prompt:                 row.prompt,
        instructions:           row.instructions             || [],
        expectedConcepts:       row.expected_concepts        || [],
        difficulty:             row.difficulty               || "medium",
        starterCodeByLanguage:  row.starter_code_by_language || {},
        publicTests:            row.public_tests             || [],
        hiddenTests:            row.hidden_tests             || [],
        structuralExpectations: row.structural_expectations  || {},
        source:                 row.source                   || "ai_generated_topic_aligned",
      },
    };
  }

  async findAssessmentAttempts(userId) {
    const result = await database.query(
      `SELECT tcs.id, tcs.passed, tcs.score, tcs.language_id, tcs.created_at,
              tc.id AS challenge_id, tc.title, tc.topic_id,
              cm.id AS module_id, cm.title AS module_title,
              uc.id AS curriculum_id, uc.title AS curriculum_title,
              ct.title AS topic_title
       FROM topic_challenge_submissions tcs
       JOIN topic_challenges tc ON tc.id = tcs.challenge_id
       JOIN curriculum_topics ct ON ct.id = tc.topic_id
       JOIN curriculum_modules cm ON cm.id = tc.module_id
       JOIN user_curriculums uc ON uc.id = tc.curriculum_id
       WHERE tcs.user_id = $1 AND tc.challenge_type = 'assessment'
       ORDER BY tcs.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async findById(challengeId, userId, challengeType = "assessment") {
    const result = await database.query(
      `SELECT id, title, prompt, instructions, expected_concepts, difficulty, starter_code_by_language,
              public_tests, hidden_tests, structural_expectations, source, challenge_type
       FROM topic_challenges WHERE id = $1 AND user_id = $2 AND challenge_type = $3`,
      [challengeId, userId, challengeType]
    );
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return { id: row.id, challenge_type: row.challenge_type, challenge_data: {
      title: row.title, prompt: row.prompt, instructions: row.instructions || [], expectedConcepts: row.expected_concepts || [],
      difficulty: row.difficulty || "medium", starterCodeByLanguage: row.starter_code_by_language || {},
      publicTests: row.public_tests || [], hiddenTests: row.hidden_tests || [], structuralExpectations: row.structural_expectations || {}, source: row.source || "ai_generated_topic_aligned",
    }};
  }

  async findGeneratedAssessments(userId) {
    const result = await database.query(
      `SELECT tc.id AS challenge_id, tc.title, tc.difficulty, tc.topic_id, tc.module_id,
              ct.title AS topic_title, cm.title AS module_title, uc.title AS curriculum_title,
              tc.created_at, latest.language_id
       FROM topic_challenges tc
       JOIN curriculum_topics ct ON ct.id = tc.topic_id
       JOIN curriculum_modules cm ON cm.id = tc.module_id
       JOIN user_curriculums uc ON uc.id = tc.curriculum_id
       LEFT JOIN LATERAL (
         SELECT language_id FROM topic_challenge_submissions
         WHERE challenge_id = tc.id AND user_id = $1
         ORDER BY created_at DESC LIMIT 1
       ) latest ON true
       WHERE tc.user_id = $1
         AND tc.challenge_type = 'assessment'
         AND NOT EXISTS (
           SELECT 1 FROM topic_challenge_submissions passed_submission
           WHERE passed_submission.challenge_id = tc.id
             AND passed_submission.user_id = $1
             AND passed_submission.passed = true
         )
       ORDER BY tc.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async hasPassedAssessment({ userId, topicId }) {
    const result = await database.query(
      `SELECT 1
       FROM topic_challenge_submissions tcs
       JOIN topic_challenges tc ON tc.id = tcs.challenge_id
       WHERE tcs.user_id = $1
         AND tc.topic_id = $2
         AND tc.challenge_type = 'assessment'
         AND tcs.passed = true
       LIMIT 1`,
      [userId, topicId]
    );
    return result.rowCount > 0;
  }
}

export default new ChallengeModel();
