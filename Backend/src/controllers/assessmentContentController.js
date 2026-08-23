import assessmentContentService from "../services/assessmentContent.service.js";

class AssessmentContentController {
  async generatePriorKnowledgeQuiz(req, res) {
    try {
      const userId = req.user?.id;
      const { topicId, moduleId } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, error: "User not authenticated" });
      }

      const quiz = await assessmentContentService.generatePriorKnowledgeQuiz({
        userId,
        topicId,
        moduleId,
      });

      return res.status(200).json({ success: true, quiz });
    } catch (error) {
      console.error("Error generating prior knowledge quiz:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to generate prior knowledge quiz",
      });
    }
  }

  async generateTopicChallenge(req, res) {
    try {
      const userId = req.user?.id;
      const { topicId, moduleId, challengeType = "section" } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, error: "User not authenticated" });
      }

      const challenge = await assessmentContentService.generateTopicChallenge({
        userId,
        topicId,
        moduleId,
        challengeType,
      });

      return res.status(200).json({ success: true, challenge });
    } catch (error) {
      console.error("Error generating topic challenge:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to generate topic challenge",
      });
    }
  }

  async evaluateChallengeSubmission(req, res) {
    try {
      const userId = req.user?.id;
      const { challengeId, topicId, moduleId, curriculumId, source_code, language_id, test_cases, challengeType = "section" } = req.body;

      const result =
        await assessmentContentService.evaluateChallengeSubmission({
          userId,
          challengeId,
          topicId,
          moduleId,
          curriculumId,
          sourceCode: source_code,
          languageId: language_id,
          testCases: test_cases,
          challengeType,
        });

      // Flatten the service result so the frontend can destructure directly:
      // { success, evaluation, canProgress, unlockResult, mastery, mastered }
      return res.status(200).json({
        success: true,
        evaluation:          result.evaluation,
        canProgress:         result.canProgress,
        unlockResult:        result.unlockResult,
        mastery:             result.mastery,
        mastered:            result.mastered,
        progressionThreshold: result.progressionThreshold,
        videoReplacement:    result.videoReplacement,
      });
    } catch (error) {
      console.error("Error evaluating challenge submission:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to evaluate challenge submission",
      });
    }
  }
}

export default new AssessmentContentController();
