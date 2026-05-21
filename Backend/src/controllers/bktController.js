import database from "../config/database.js";
import bktModel from "../models/bktModel.js";
import BKTService from "../services/bkt.service.js";

class BktController {
  async submitTopicAttempt(req, res) {
    try {
      const userId = req.user?.id;
      const topicId = Number(req.params.topicId);

      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      if (!topicId) {
        return res.status(400).json({ error: "Invalid topicId" });
      }

      const {
        curriculumId,
        moduleId,
        quiz_type,
        questions,
        correctCount,
        totalCount,
        passed,
      } = req.body;

      const normalizedCorrect = Number(correctCount ?? 0);
      const normalizedTotal = Number(totalCount ?? 0);

      if (normalizedTotal <= 0) {
        return res.status(400).json({ error: "totalCount must be greater than zero" });
      }

      const score = BKTService.computeScore(normalizedCorrect, normalizedTotal);
      const didPass = typeof passed === "boolean" ? passed : score >= 0.7;

      const client = await database.getClient();

      try {
        await client.query("BEGIN");

        const quizResult = await client.query(
          `
            INSERT INTO topic_quizzes
              (user_id, curriculum_id, module_id, topic_id, quiz_type, questions, score, passed, submitted_at)
            VALUES
              ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            RETURNING *
          `,
          [
            userId,
            curriculumId || null,
            moduleId || null,
            topicId,
            quiz_type || "posttest",
            questions ? JSON.stringify(questions) : JSON.stringify([]),
            score,
            didPass,
          ]
        );

        let params = await bktModel.getBktParameters(topicId);
        if (!params) {
          params = await bktModel.createBktParameters(topicId);
        }

        let mastery = await bktModel.getTopicMastery(userId, topicId);
        if (!mastery) {
          mastery = await bktModel.createTopicMastery(userId, topicId, params.p_init, quizResult.rows[0].id);
        }

        const isCorrect = normalizedCorrect === normalizedTotal;
        const updatedProbability = BKTService.updateMasteryProbability(
          Number(mastery.mastery_probability),
          isCorrect,
          Number(params.p_guess),
          Number(params.p_slip),
          Number(params.p_learn)
        );

        const updatedMastery = await bktModel.updateTopicMastery({
          userId,
          topicId,
          masteryProbability: updatedProbability,
          attempts: mastery.attempts + 1,
          correctAnswers: mastery.correct_answers + normalizedCorrect,
          incorrectAnswers: mastery.incorrect_answers + (normalizedTotal - normalizedCorrect),
          lastQuizId: quizResult.rows[0].id,
        });

        await client.query("COMMIT");

        return res.status(200).json({
          success: true,
          quiz: quizResult.rows[0],
          mastery: updatedMastery,
          mastered: BKTService.isMastered(updatedProbability),
        });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("submitTopicAttempt error:", error);
      return res.status(500).json({ error: error.message || "Failed to submit topic attempt" });
    }
  }

  async getTopicMastery(req, res) {
    try {
      const userId = req.user?.id;
      const topicId = Number(req.params.topicId);

      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      if (!topicId) {
        return res.status(400).json({ error: "Invalid topicId" });
      }

      const mastery = await bktModel.getTopicMastery(userId, topicId);

      if (!mastery) {
        return res.status(404).json({ error: "Topic mastery record not found" });
      }

      return res.status(200).json({ success: true, mastery });
    } catch (error) {
      console.error("getTopicMastery error:", error);
      return res.status(500).json({ error: error.message || "Failed to fetch topic mastery" });
    }
  }
}

export default new BktController();