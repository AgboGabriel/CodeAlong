import database from "../config/database.js";

class ChallengeModel {
  async createTopicChallenge({ userId, curriculumId, moduleId, topicId, challenge }) {
    const query = `
      INSERT INTO topic_challenges
        (user_id, curriculum_id, module_id, topic_id, title, prompt, instructions, expected_concepts, difficulty, starter_code_by_language, public_tests, hidden_tests, structural_expectations, source)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (user_id, topic_id) DO UPDATE SET
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

  async findLatestByTopicId(topicId, userId) {
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
        source
      FROM topic_challenges
      WHERE topic_id = $1
        AND user_id  = $2
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await database.query(query, [topicId, userId]);
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
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
}

export default new ChallengeModel();