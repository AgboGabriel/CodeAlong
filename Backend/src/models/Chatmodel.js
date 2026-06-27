import database from "../config/database.js";

class ChatModel {
 

  /** Create a new conversation for a user. */
  async createConversation({ userId, context = "general" }) {
    const result = await database.query(
      `INSERT INTO chat_conversations (user_id, context)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, context]
    );
    return result.rows[0];
  }

  /**
   * Get the most recent conversation for a user 
   * Returns null if none exists.
   */
  async getLatestConversation({ userId, context = null }) {
    const values = [userId];
    const contextClause = context
      ? `AND context = $${values.push(context)}`
      : "";

    const result = await database.query(
      `SELECT * FROM chat_conversations
       WHERE user_id = $1 ${contextClause}
       ORDER BY updated_at DESC
       LIMIT 1`,
      values
    );
    return result.rows[0] ?? null;
  }

  /** Get all conversations for a user (most recent first). */
  async getConversationsByUser(userId) {
    const result = await database.query(
      `SELECT * FROM chat_conversations
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [userId]
    );
    return result.rows;
  }

  /** Touch updated_at so ordering stays correct after a new message. */
  async touchConversation(conversationId) {
    await database.query(
      `UPDATE chat_conversations
       SET updated_at = NOW()
       WHERE id = $1`,
      [conversationId]
    );
  }

  /** Delete a conversation and all its messages (CASCADE handles messages). */
  async deleteConversation(conversationId, userId) {
    await database.query(
      `DELETE FROM chat_conversations
       WHERE id = $1 AND user_id = $2`,
      [conversationId, userId]
    );
  }

  /** Persist a single message. */
  async addMessage({ conversationId, userId, role, content, curriculumData = null }) {
    const result = await database.query(
      `INSERT INTO chat_messages
         (conversation_id, user_id, role, content, curriculum_data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        conversationId,
        userId,
        role,
        content,
        curriculumData ? JSON.stringify(curriculumData) : null,
      ]
    );

    // Keep conversation.updated_at fresh
    await this.touchConversation(conversationId);

    return result.rows[0];
  }

 
  async getMessages(conversationId, limit = null) {
    if (limit) {
  
      const result = await database.query(
        `SELECT * FROM (
           SELECT * FROM chat_messages
           WHERE conversation_id = $1
           ORDER BY created_at DESC
           LIMIT $2
         ) sub
         ORDER BY created_at ASC`,
        [conversationId, limit]
      );
      return result.rows;
    }

    const result = await database.query(
      `SELECT * FROM chat_messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [conversationId]
    );
    return result.rows;
  }

 
  async trimMessages(conversationId, maxMessages = 20) {
    await database.query(
      `DELETE FROM chat_messages
       WHERE id IN (
         SELECT id FROM chat_messages
         WHERE conversation_id = $1
         ORDER BY created_at ASC
         OFFSET $2
       )`,
      [conversationId, maxMessages]
    );
  }


  async clearMessages(conversationId, userId) {
    await database.query(
      `DELETE FROM chat_messages
       WHERE conversation_id = $1
         AND user_id = $2`,
      [conversationId, userId]
    );
  }
}

export default new ChatModel();