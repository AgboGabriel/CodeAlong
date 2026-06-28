import database from "../config/database.js";
import bktModel from "../models/bktModel.js";
import curriculumModel from "../models/curriculumModel.js";
import BKTService from "../services/bkt.service.js";

// Prior-knowledge (pretest) quizzes must never push mastery to ≥ 0.8.
// A learner could get lucky and score 100% without actually understanding
// anything, which would incorrectly grant progression. This hard ceiling
// keeps pretest mastery safely below the progression threshold.
const PRETEST_MASTERY_CAP = 0.79;
const PROGRESSION_THRESHOLD = 0.80;
// A pretest score ≥ this ratio means the learner has prior knowledge and
// should be offered the option to skip straight to the challenge.
const PRIOR_KNOWLEDGE_THRESHOLD = 0.70;

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

      const isPretest = quiz_type === "pretest";

      const normalizedCorrect = Number(correctCount ?? 0);
      const normalizedTotal = Number(totalCount ?? 0);

      if (normalizedTotal <= 0) {
        return res.status(400).json({ error: "totalCount must be greater than zero" });
      }

      const score = BKTService.computeScore(normalizedCorrect, normalizedTotal);
      const didPass = typeof passed === "boolean" ? passed : score >= PRIOR_KNOWLEDGE_THRESHOLD;

      // Ensure we have curriculum/module context for this topic and user
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
          // First attempt — seed mastery from the quiz score, then apply the
          // pretest cap so a lucky perfect score can't exceed 0.79.
          let initialMastery = isPretest ? score : params.p_init;

          if (isPretest && initialMastery > PRETEST_MASTERY_CAP) {
            initialMastery = PRETEST_MASTERY_CAP;
          }

          mastery = await bktModel.createTopicMastery(
            userId,
            topicId,
            initialMastery,
            quizResult.rows[0].id,
            client
          );

          updatedMastery = mastery;
        } else {
          // Subsequent attempt — run the full BKT update formula.
          const scoreForAttempt = BKTService.computeScore(normalizedCorrect, normalizedTotal);
          const isCorrect = scoreForAttempt >= PRIOR_KNOWLEDGE_THRESHOLD;

          let updatedProbability = BKTService.updateMasteryProbability(
            Number(mastery.mastery_probability),
            isCorrect,
            Number(params.p_guess),
            Number(params.p_slip),
            Number(params.p_learn)
          );

          // ── Pretest mastery cap ──────────────────────────────────────────
          // Regardless of what BKT computes, a pretest can never push mastery
          // to ≥ 0.8. Only a posttest (where the learner has actually watched
          // the video and attempted the challenge) can grant progression.
          if (isPretest && updatedProbability > PRETEST_MASTERY_CAP) {
            updatedProbability = PRETEST_MASTERY_CAP;
          }

          updatedMastery = await bktModel.updateTopicMastery(
            {
              userId,
              topicId,
              masteryProbability: updatedProbability,
              attempts: mastery.attempts + 1,
              correctAnswers: mastery.correct_answers + normalizedCorrect,
              incorrectAnswers:
                mastery.incorrect_answers + (normalizedTotal - normalizedCorrect),
              lastQuizId: quizResult.rows[0].id,
            },
            client
          );
        }

        await client.query("COMMIT");

        const finalMastery = Number(updatedMastery.mastery_probability);

        // Progression is only possible via a posttest — a pretest can never
        // grant it, even if the learner somehow reaches 0.79 mastery.
        const canProgress =
          !isPretest && finalMastery >= PROGRESSION_THRESHOLD;

        // Tell the frontend whether the learner demonstrated prior knowledge
        // (≥ 70% on the pretest) so it can show the "skip to challenge" popup.
        const hasPriorKnowledge = isPretest && score >= PRIOR_KNOWLEDGE_THRESHOLD;

        return res.status(200).json({
          success: true,
          quiz: quizResult.rows[0],
          mastery: updatedMastery,
          mastered: BKTService.isMastered(updatedMastery.mastery_probability),
          canProgress,
          hasPriorKnowledge,
          progressionThreshold: PROGRESSION_THRESHOLD,
        });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("submitTopicAttempt error:", error);
      return res
        .status(500)
        .json({ error: error.message || "Failed to submit topic attempt" });
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
      return res
        .status(500)
        .json({ error: error.message || "Failed to fetch topic mastery" });
    }
  }

  async canProgressToNextTopic(req, res) {
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
        return res.status(200).json({
          success: true,
          canProgress: false,
          reason: "No mastery data yet. Complete the assessments first.",
          masteryProbability: 0,
          threshold: PROGRESSION_THRESHOLD,
        });
      }

      const masteryProb = Number(mastery.mastery_probability);

      // This endpoint is only meaningful after a posttest. If somehow mastery
      // sits at exactly the cap (0.79) it means only a pretest was taken, so
      // we still block progression.
      const canProgress =
        masteryProb >= PROGRESSION_THRESHOLD &&
        masteryProb > PRETEST_MASTERY_CAP;

      return res.status(200).json({
        success: true,
        canProgress,
        masteryProbability: masteryProb,
        threshold: PROGRESSION_THRESHOLD,
        reason: canProgress
          ? `You have mastered this topic (${(masteryProb * 100).toFixed(1)}%). Ready to progress!`
          : `Current mastery: ${(masteryProb * 100).toFixed(1)}%. Complete the video and challenge to progress.`,
      });
    } catch (error) {
      console.error("canProgressToNextTopic error:", error);
      return res
        .status(500)
        .json({ error: error.message || "Failed to check progression" });
    }
  }

  // Called by POST /api/topic/:topicId/unlock-next
  // Marks the current topic completed and unlocks the next one.
  // The frontend calls this only after canProgress === true from submitTopicAttempt.
  async unlockNextTopic(req, res) {
    try {
      const userId  = req.user?.id;
      const topicId = Number(req.params.topicId);

      if (!userId)  return res.status(401).json({ error: "Not authenticated" });
      if (!topicId) return res.status(400).json({ error: "Invalid topicId" });

      const result = await curriculumModel.unlockNextTopic(topicId, userId);

      return res.status(200).json({
        success: true,
        // result is { unlockedTopicId, unlockedModuleId } or null (end of curriculum)
        result: result ?? { unlockedTopicId: null, unlockedModuleId: null },
      });
    } catch (error) {
      console.error("unlockNextTopic controller error:", error);
      return res.status(500).json({ error: error.message || "Failed to unlock next topic" });
    }
  }
}

export default new BktController();