import assessmentContentService from "../services/assessmentContent.service.js";
import challengeModel from "../models/challengeModel.js";

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
      const { topicId, moduleId, challengeType = "section", forceRegenerate = false, difficulty = "medium", language = null, challengeId = null } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, error: "User not authenticated" });
      }

      const challenge = await assessmentContentService.generateTopicChallenge({
        userId,
        topicId,
        moduleId,
        challengeType,
        forceRegenerate,
        difficulty,
        language,
        challengeId,
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
      return res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || "Failed to evaluate challenge submission",
      });
    }
  }

  async requestAdaptiveHelp(req, res) {
    try {
      const userId = req.user?.id;
      const { topicId, moduleId, curriculumId } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, error: "User not authenticated" });
      }
      if (!topicId) {
        return res.status(400).json({ success: false, error: "Topic context is required for adaptive help" });
      }

      const videoReplacement = await assessmentContentService.requestSimplerVideoForTopic({
        userId,
        topicId,
        moduleId,
        curriculumId,
      });

      if (!videoReplacement?.video) {
        return res.status(404).json({
          success: false,
          error: "We could not find a simpler video for this topic right now. Please try again shortly.",
        });
      }

      return res.status(200).json({ success: true, videoReplacement });
    } catch (error) {
      console.error("Error requesting adaptive help:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Unable to prepare adaptive help",
      });
    }
  }

  async getAssessmentAttempts(req, res) {
    try {
      if (!req.user?.id) return res.status(401).json({ success: false, error: "User not authenticated" });
      const attempts = await challengeModel.findAssessmentAttempts(req.user.id);
      return res.status(200).json({ success: true, attempts });
    } catch (error) {
      console.error("Error loading assessment attempts:", error);
      return res.status(500).json({ success: false, error: "Failed to load completed assessments" });
    }
  }

  async getGeneratedAssessments(req, res) {
    try {
      if (!req.user?.id) return res.status(401).json({ success: false, error: "User not authenticated" });
      const assessments = await challengeModel.findGeneratedAssessments(req.user.id);
      return res.status(200).json({ success: true, assessments });
    } catch (error) {
      console.error("Error loading generated assessments:", error);
      return res.status(500).json({ success: false, error: "Failed to load available assessments" });
    }
  }
}

export default new AssessmentContentController();
