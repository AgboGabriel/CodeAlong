import database from "../config/database.js";

class bktModel {
    async getBktParameters(topicId, db = database) {
        const query = `
        SELECT * FROM bkt_parameters
        WHERE topic_id = $1
        LIMIT 1
        `;
        const result = await db.query(query, [topicId]);
        return result.rows[0] || null;
    }

    async createBktParameters(topicId, params = {}, db = database) {
        const {
            p_init = 0.20,
            p_learn = 0.15,
            p_guess = 0.20,
            p_slip = 0.10,
        } = params;

        const query = `
        INSERT INTO bkt_parameters(topic_id, p_init, p_learn, p_guess, p_slip)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        `;

        const result = await db.query(query, [topicId, p_init, p_learn, p_guess, p_slip]);
        return result.rows[0];
    }

    async getTopicMastery(userId, topicId, db = database) {
        const query = `
        SELECT * FROM topic_mastery
        WHERE user_id = $1 AND topic_id = $2
        LIMIT 1
        `;
        const result = await db.query(query, [userId, topicId]);
        return result.rows[0] || null;
    }

    async createTopicMastery(userId, topicId, masteryProbability = 0.2, lastQuizId = null, db = database) {
        const query = `
        INSERT INTO topic_mastery
          (user_id, topic_id, mastery_probability, attempts, correct_answers, incorrect_answers, last_quiz_id)
        VALUES
          ($1, $2, $3, 0, 0, 0, $4)
        RETURNING *
        `;
        const result = await db.query(query, [userId, topicId, masteryProbability, lastQuizId]);
        return result.rows[0];
    }

    async updateTopicMastery({
        userId,
        topicId,
        masteryProbability,
        attempts,
        correctAnswers,
        incorrectAnswers,
        lastQuizId,
    }, db = database) {
        const query = `
        UPDATE topic_mastery
        SET mastery_probability = $1,
            attempts = $2,
            correct_answers = $3,
            incorrect_answers = $4,
            last_quiz_id = $5,
            updated_at = NOW()
        WHERE user_id = $6 AND topic_id = $7
        RETURNING *
        `;

        const result = await db.query(query, [
            masteryProbability,
            attempts,
            correctAnswers,
            incorrectAnswers,
            lastQuizId,
            userId,
            topicId,
        ]);

        return result.rows[0];
    }
}

export default new bktModel();
