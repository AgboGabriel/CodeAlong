import database from "../config/database.js";
import bktModel from "../models/bktModel.js";
import curriculumModel from "../models/curriculumModel.js";
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

      // ensure we have curriculum/module context for this topic and user
      const topicContext = await curriculumModel.getTopicContext(topicId, userId);
      if (!topicContext) {
        return res.status(400).json({ error: "Topic context not found for user" });
      }

      const curriculumIdToUse = curriculumId || topicContext.curriculum?.id;
      const moduleIdToUse = moduleId || topicContext.module?.id;

      if (!curriculumIdToUse || !moduleIdToUse) {
        return res.status(400).json({ error: "Missing curriculum or module context for this topic" });
      }

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
            curriculumIdToUse,
            moduleIdToUse,
            topicId,
            quiz_type || "posttest",
            questions ? JSON.stringify(questions) : JSON.stringify([]),
            score,
            didPass,
          ]
        );

        let params = await bktModel.getBktParameters(topicId, client);
        if (!params) {
          params = await bktModel.createBktParameters(topicId, {}, client);
        }

        let mastery = await bktModel.getTopicMastery(userId, topicId, client);
        let updatedMastery;

        if (!mastery) {
          // For prior knowledge (pretest), initialize mastery with the quiz score
          // For other quizzes, use default p_init
          const initialMastery = quiz_type === "pretest" ? score : params.p_init;

          mastery = await bktModel.createTopicMastery(
            userId,
            topicId,
            initialMastery,
            quizResult.rows[0].id,
            client
          );

          updatedMastery = mastery;
        } else {
          // Update existing mastery using BKT formula
          // Treat an attempt as "correct" if the score meets a threshold (e.g. 70%)
          const correctnessThreshold = 0.7;
          const scoreForAttempt = BKTService.computeScore(normalizedCorrect, normalizedTotal);
          const isCorrect = scoreForAttempt >= correctnessThreshold;

          const updatedProbability = BKTService.updateMasteryProbability(
            Number(mastery.mastery_probability),
            isCorrect,
            Number(params.p_guess),
            Number(params.p_slip),
            Number(params.p_learn)
          );

          updatedMastery = await bktModel.updateTopicMastery({
            userId,
            topicId,
            masteryProbability: updatedProbability,
            attempts: mastery.attempts + 1,
            correctAnswers: mastery.correct_answers + normalizedCorrect,
            incorrectAnswers: mastery.incorrect_answers + (normalizedTotal - normalizedCorrect),
            lastQuizId: quizResult.rows[0].id,
          }, client);
        }

        await client.query("COMMIT");

        const masteredThreshold = 0.80;
        const canProgress = Number(updatedMastery.mastery_probability) >= masteredThreshold;

        return res.status(200).json({
          success: true,
          quiz: quizResult.rows[0],
          mastery: updatedMastery,
          mastered: BKTService.isMastered(updatedMastery.mastery_probability),
          canProgress,
          progressionThreshold: masteredThreshold,
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

  async canProgressToNextTopic(req, res) {
    try {
      const userId = req.user?.id;
      const topicId = Number(req.params.topicId);
      const progressionThreshold = 0.80;

      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      if (!topicId) {
        return res.status(400).json({ error: "Invalid topicId" });
      }

      const mastery = await bktModel.getTopicMastery(userId, topicId);

      // If no mastery record yet, cannot progress
      if (!mastery) {
        return res.status(200).json({
          success: true,
          canProgress: false,
          reason: "No mastery data yet. Complete the assessments first.",
          masteryProbability: 0,
          threshold: progressionThreshold,
        });
      }

      const masteryProb = Number(mastery.mastery_probability);
      const canProgress = masteryProb >= progressionThreshold;

      return res.status(200).json({
        success: true,
        canProgress,
        masteryProbability: masteryProb,
        threshold: progressionThreshold,
        reason: canProgress
          ? `You have mastered this topic (${(masteryProb * 100).toFixed(1)}%). Ready to progress!`
          : `Current mastery: ${(masteryProb * 100).toFixed(1)}%. Reach ${(progressionThreshold * 100).toFixed(0)}% to progress.`,
      });
    } catch (error) {
      console.error("canProgressToNextTopic error:", error);
      return res.status(500).json({ error: error.message || "Failed to check progression" });
    }
  }
}

export default new BktController();