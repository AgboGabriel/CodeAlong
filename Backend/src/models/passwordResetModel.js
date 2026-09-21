import database from "../config/database.js";

class PasswordResetModel {
  async createToken({ user_id, token_hash, expires_at }) {
    try {
      const query = `
        INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, created_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING id, user_id, expires_at, created_at
      `;

      const result = await database.query(query, [user_id, token_hash, expires_at]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error in createToken:", error);
      throw error;
    }
  }

  async countRecentTokens(user_id, hours = 24) {
    const result = await database.query(
      `
        SELECT COUNT(*)::int AS count
        FROM password_reset_tokens
        WHERE user_id = $1
          AND created_at >= NOW() - ($2 * INTERVAL '1 hour')
      `,
      [user_id, hours]
    );

    return Number(result.rows[0]?.count || 0);
  }

  async findLatestTokenCreatedAt(user_id) {
    const result = await database.query(
      `
        SELECT created_at
        FROM password_reset_tokens
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [user_id]
    );

    return result.rows[0]?.created_at || null;
  }

  async deleteToken(id) {
    await database.query("DELETE FROM password_reset_tokens WHERE id = $1", [id]);
  }

  async findValidToken(token_hash) {
    try {
      const query = `
        SELECT id, user_id, token_hash, expires_at, used, created_at
        FROM password_reset_tokens
        WHERE token_hash = $1
          AND COALESCE(used, false) = false
          AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
      `;

      const result = await database.query(query, [token_hash]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error in findValidToken:", error);
      throw error;
    }
  }

  async markTokenUsed(id) {
    try {
      const query = `
        UPDATE password_reset_tokens
        SET used = true
        WHERE id = $1
        RETURNING id, user_id, used
      `;

      const result = await database.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error in markTokenUsed:", error);
      throw error;
    }
  }

  async invalidateUserTokens(user_id, keepTokenId = null) {
    try {
      const query = `
        UPDATE password_reset_tokens
        SET used = true
        WHERE user_id = $1
          AND COALESCE(used, false) = false
          AND ($2::integer IS NULL OR id <> $2)
      `;

      await database.query(query, [user_id, keepTokenId]);
    } catch (error) {
      console.error("Error in invalidateUserTokens:", error);
      throw error;
    }
  }
}

export default new PasswordResetModel();
