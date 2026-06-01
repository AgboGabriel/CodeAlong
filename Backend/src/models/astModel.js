import database from "../config/database.js";

class AstModel {
  async createAnalysis({
    userId = null,
    topicId = null,
    languageId,
    languageKey,
    parserEngine,
    parserStatus,
    sourceHash,
    summary,
    normalizedAst,
    diagnostics,
  }) {
    const query = `
      INSERT INTO ast_analyses
      (
        user_id,
        topic_id,
        language_id,
        language_key,
        parser_engine,
        parser_status,
        source_hash,
        summary,
        normalized_ast,
        diagnostics
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `;

    const values = [
      userId,
      topicId,
      languageId,
      languageKey,
      parserEngine,
      parserStatus,
      sourceHash,
      JSON.stringify(summary || {}),
      JSON.stringify(normalizedAst),
      JSON.stringify(diagnostics || []),
    ];

    const result = await database.query(query, values);
    return result.rows[0];
  }

  async findByUserAndTopic(userId, topicId, limit = 10) {
    const query = `
      SELECT *
      FROM ast_analyses
      WHERE user_id = $1
      AND ($2::INTEGER IS NULL OR topic_id = $2)
      ORDER BY created_at DESC
      LIMIT $3
    `;

    const result = await database.query(query, [userId, topicId, limit]);
    return result.rows;
  }
}

export default new AstModel();
