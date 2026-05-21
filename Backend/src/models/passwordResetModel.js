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

  async findValidToken(token_hash) {
    try {
      const query = `
        SELECT id, user_id, token_hash, expires_at, used_at, created_at
        FROM password_reset_tokens
        WHERE token_hash = $1
          AND used_at IS NULL
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
        SET used_at = NOW()
        WHERE id = $1
        RETURNING id, user_id, used_at
      `;

      const result = await database.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error in markTokenUsed:", error);
      throw error;
    }
  }

  async invalidateUserTokens(user_id) {
    try {
      const query = `
        UPDATE password_reset_tokens
        SET used_at = NOW()
        WHERE user_id = $1
          AND used_at IS NULL
      `;

      await database.query(query, [user_id]);
    } catch (error) {
      console.error("Error in invalidateUserTokens:", error);
      throw error;
    }
  }
}

export default new PasswordResetModel();
